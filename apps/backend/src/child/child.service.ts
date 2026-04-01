import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { canManageBranchLikeDirector } from '../auth/school-scope.util.js';
import { CreateChildDto } from './dto/create-child.dto.js';
import { UpdateChildDto } from './dto/update-child.dto.js';
import { AuthService } from '../auth/auth.service.js';
import { SettingsService } from '../settings/settings.service.js';

type CurrentUser = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  branchId: string | null;
  name?: string | null;
};

@Injectable()
export class ChildService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly settings: SettingsService,
  ) {}

  async create(branchId: string, dto: CreateChildDto, user: CurrentUser) {
    await this.ensureCanManageBranch(branchId, user);

    const email = dto.studentEmail.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const { otpEmailVerificationEnabled } = await this.settings.getPublic();

    const child = await this.prisma.$transaction(async (tx) => {
      const studentUser = await tx.user.create({
        data: {
          email,
          name: dto.studentName?.trim() ?? `${dto.firstName.trim()} ${dto.lastName.trim()}`,
          role: UserRole.STUDENT,
          branchId,
          emailVerifiedAt: otpEmailVerificationEnabled ? null : new Date(),
        },
      });

      return tx.child.create({
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          branchId,
          studentUserId: studentUser.id,
          guardianName: dto.guardianName?.trim() ?? null,
          guardianEmail: dto.guardianEmail?.trim() ?? null,
          guardianPhone: dto.guardianPhone?.trim() ?? null,
          hasAllergies: dto.hasAllergies ?? false,
          hasAsthma: dto.hasAsthma ?? false,
          hasDiabetes: dto.hasDiabetes ?? false,
          hasSeizures: dto.hasSeizures ?? false,
          takesMedsAtSchool: dto.takesMedsAtSchool ?? false,
        },
        include: {
          student: { select: { id: true, email: true, name: true } },
        },
      });
    });

    if (otpEmailVerificationEnabled) {
      await this.auth.sendInviteOtp(email, user.name ?? undefined);
    }

    return child;
  }

  async listMyEnrollment(userId: string, user: CurrentUser) {
    if (user.role !== UserRole.STUDENT || user.id !== userId) {
      throw new ForbiddenException('Cannot access');
    }
    return this.prisma.child.findMany({
      where: { studentUserId: userId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        student: { select: { id: true, email: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async listByBranch(branchId: string, user: CurrentUser) {
    await this.ensureCanAccessBranch(branchId, user);

    return this.prisma.child.findMany({
      where: { branchId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        student: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async findOne(id: string, user: CurrentUser) {
    const child = await this.prisma.child.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, email: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    await this.ensureCanAccessChild(child.id, user);

    return child;
  }

  async update(id: string, dto: UpdateChildDto, user: CurrentUser) {
    const child = await this.findOne(id, user);
    await this.ensureCanManageBranch(child.branchId, user);

    return this.prisma.child.update({
      where: { id },
      data: {
        firstName: dto.firstName != null ? dto.firstName.trim() : undefined,
        lastName: dto.lastName != null ? dto.lastName.trim() : undefined,
        hasAllergies: dto.hasAllergies,
        hasAsthma: dto.hasAsthma,
        hasDiabetes: dto.hasDiabetes,
        hasSeizures: dto.hasSeizures,
        takesMedsAtSchool: dto.takesMedsAtSchool,
        guardianName: dto.guardianName !== undefined ? dto.guardianName?.trim() ?? null : undefined,
        guardianEmail: dto.guardianEmail !== undefined ? dto.guardianEmail?.trim() ?? null : undefined,
        guardianPhone: dto.guardianPhone !== undefined ? dto.guardianPhone?.trim() ?? null : undefined,
      },
      include: {
        student: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async remove(id: string, user: CurrentUser) {
    const child = await this.findOne(id, user);
    await this.ensureCanManageBranch(child.branchId, user);

    const studentUserId = child.studentUserId;

    await this.prisma.child.delete({
      where: { id },
    });

    await this.prisma.user.delete({
      where: { id: studentUserId },
    });

    return { deleted: true };
  }

  private async ensureCanManageBranch(branchId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
    });

    if (canManageBranchLikeDirector(user, branch)) return;

    throw new ForbiddenException('Cannot manage this branch');
  }

  private async ensureCanAccessBranch(branchId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
    });

    if (user.role === UserRole.STUDENT) {
      const hasChild = await this.prisma.child.findFirst({
        where: { branchId, studentUserId: user.id },
      });
      if (!hasChild) throw new ForbiddenException('Cannot access this branch');
      return;
    }

    if (user.role === UserRole.TEACHER) {
      if (user.branchId === branchId) return;
      throw new ForbiddenException('Cannot access this branch');
    }

    if (canManageBranchLikeDirector(user, branch)) return;

    throw new ForbiddenException('Cannot access this branch');
  }

  /** Used by other modules (e.g. document types) that need the same access rules as child APIs. */
  async ensureCanAccessChild(childId: string, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    const child = await this.prisma.child.findUniqueOrThrow({
      where: { id: childId },
      include: { branch: true },
    });

    if (user.role === UserRole.STUDENT && child.studentUserId === user.id) return;

    if (user.role === UserRole.TEACHER) {
      if (user.branchId === child.branchId) return;
      throw new ForbiddenException('Cannot access this child');
    }

    if (canManageBranchLikeDirector(user, child.branch)) return;

    throw new ForbiddenException('Cannot access this child');
  }
}
