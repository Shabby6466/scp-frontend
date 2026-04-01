import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { ScopeGuard } from './guards/scope.guard.js';
import { MailerModule } from '../mailer/index.js';
import { SettingsModule } from '../settings/index.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: 604800 }, // 7 days in seconds
      }),
    }),
    MailerModule,
    SettingsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ScopeGuard],
  exports: [AuthService, JwtModule, ScopeGuard],
})
export class AuthModule {}
