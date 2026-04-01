import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailerService } from '../mailer/mailer.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/index.js';

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;
const RATE_LIMIT_MINUTES = 1;

function generateOtp(): string {
  const digits = crypto.randomInt(0, 1_000_000);
  return digits.toString().padStart(OTP_LENGTH, '0');
}

async function hashOtp(code: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(code, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyOtpHash(code: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(code, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
  const storedBuf = Buffer.from(hashHex, 'hex');
  return crypto.timingSafeEqual(hash, storedBuf);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
    private readonly settings: SettingsService,
  ) {}

  async login(dto: LoginDto): Promise<{ user: object; accessToken: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        password: true,
        emailVerifiedAt: true,
        school: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, schoolId: true } },
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { otpEmailVerificationEnabled } = await this.settings.getPublic();
    if (otpEmailVerificationEnabled && !user.emailVerifiedAt) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateAccessToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        branchId: user.branchId,
        school: user.school,
        branch: user.branch,
      },
      accessToken,
    };
  }

  async register(dto: RegisterDto): Promise<{ message: string; skipVerification?: boolean }> {
    const flags = await this.settings.getPublic();
    if (!flags.selfRegistrationEnabled) {
      throw new ForbiddenException('Self-service registration is disabled');
    }

    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    if (!flags.otpEmailVerificationEnabled) {
      await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: dto.name.trim(),
          role: 'TEACHER',
          emailVerifiedAt: new Date(),
        },
      });
      this.logger.log(`User registered: ${email} (verified, no OTP)`);
      return { message: 'Account created. You can sign in now.', skipVerification: true };
    }

    await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: dto.name.trim(),
        role: 'TEACHER',
        emailVerifiedAt: null,
      },
    });

    await this.sendVerificationOtp(email, false);

    this.logger.log(`User registered: ${email} (pending verification)`);
    return { message: 'Check your email for the verification code' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ user: object; accessToken: string }> {
    const email = dto.email.toLowerCase().trim();
    const hasCode = typeof dto.code === 'string' && /^\d{6}$/.test(dto.code);
    const hasToken = typeof dto.token === 'string' && dto.token.length >= 32;
    if (!hasCode && !hasToken) {
      throw new BadRequestException(
        'Provide the 6-digit code or open the invite link from your email.',
      );
    }
    const secret = (hasCode ? dto.code : dto.token) as string;

    const candidates = await this.prisma.authOtp.findMany({
      where: {
        email,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let otp: (typeof candidates)[0] | null = null;
    for (const row of candidates) {
      if (await verifyOtpHash(secret, row.codeHash)) {
        otp = row;
        break;
      }
    }

    if (!otp) {
      throw new UnauthorizedException('Invalid or expired code. Please request a new one.');
    }

    await this.prisma.authOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const updateData: { emailVerifiedAt: Date; password?: string } = {
      emailVerifiedAt: new Date(),
    };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 12);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    const updated = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        school: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, schoolId: true } },
      },
    });

    const accessToken = await this.generateAccessToken(updated!.id, updated!.email, updated!.role);

    return {
      user: {
        id: updated!.id,
        email: updated!.email,
        name: updated!.name,
        role: updated!.role,
        schoolId: updated!.schoolId,
        branchId: updated!.branchId,
        school: updated!.school,
        branch: updated!.branch,
      },
      accessToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        password: true,
        school: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, schoolId: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hasPassword = user.password != null && user.password.length > 0;
    const { password: _p, ...rest } = user;
    return { ...rest, hasPassword };
  }

  async sendVerificationOtp(email: string, requireUnverifiedUser = false): Promise<void> {
    const { otpEmailVerificationEnabled } = await this.settings.getPublic();
    if (!otpEmailVerificationEnabled) {
      throw new BadRequestException('Email verification codes are disabled on this system.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (requireUnverifiedUser) {
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (!user || user.emailVerifiedAt) {
        throw new UnauthorizedException('No pending verification found for this email');
      }
    }

    const recent = await this.prisma.authOtp.findFirst({
      where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (recent) {
      const elapsed = Date.now() - recent.createdAt.getTime();
      if (elapsed < RATE_LIMIT_MINUTES * 60 * 1000) {
        throw new BadRequestException(
          `Please wait ${RATE_LIMIT_MINUTES} minute(s) before requesting a new code`,
        );
      }
    }

    const code = generateOtp();
    const codeHash = await hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.authOtp.create({
      data: { email: normalizedEmail, codeHash, expiresAt },
    });

    await this.mailer.sendVerificationCode(normalizedEmail, code);
  }

  async resendVerification(email: string): Promise<void> {
    await this.sendVerificationOtp(email, true);
  }

  /** When OTP emails are off, this is not called (see UserService). No-op if invoked. */
  async sendInviteOtp(email: string, inviterName?: string): Promise<void> {
    const { otpEmailVerificationEnabled } = await this.settings.getPublic();
    if (!otpEmailVerificationEnabled) {
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const code = generateOtp();
    const codeHash = await hashOtp(code);
    await this.prisma.authOtp.create({
      data: { email: normalizedEmail, codeHash, expiresAt },
    });
    await this.mailer.sendInvite(normalizedEmail, code, inviterName);
  }

  private async generateAccessToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const expiresIn = this.config.get<number>('JWT_EXPIRATION') ?? 604800;
    return this.jwt.signAsync(payload, { expiresIn });
  }
}
