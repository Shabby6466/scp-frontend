import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto, VerifyEmailDto } from './dto/index.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

interface RequestUser {
  id: string;
  email: string;
  role: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: { email: string }) {
    await this.authService.resendVerification(body.email);
    return { message: 'Verification code sent' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: RequestUser) {
    return this.authService.getProfile(user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logged out' };
  }
}
