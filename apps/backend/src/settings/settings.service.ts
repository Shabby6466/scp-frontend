import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto.js';

export interface AppSettingsPublic {
  otpEmailVerificationEnabled: boolean;
  selfRegistrationEnabled: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefault() {
    const row = await this.prisma.appConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        otpEmailVerificationEnabled: true,
        selfRegistrationEnabled: true,
      },
      update: {},
    });
    return row;
  }

  async getPublic(): Promise<AppSettingsPublic> {
    const row = await this.ensureDefault();
    return {
      otpEmailVerificationEnabled: row.otpEmailVerificationEnabled,
      selfRegistrationEnabled: row.selfRegistrationEnabled,
    };
  }

  async update(dto: UpdateAppSettingsDto): Promise<AppSettingsPublic> {
    await this.ensureDefault();
    const row = await this.prisma.appConfig.update({
      where: { id: 'default' },
      data: {
        ...(dto.otpEmailVerificationEnabled !== undefined && {
          otpEmailVerificationEnabled: dto.otpEmailVerificationEnabled,
        }),
        ...(dto.selfRegistrationEnabled !== undefined && {
          selfRegistrationEnabled: dto.selfRegistrationEnabled,
        }),
      },
    });
    return {
      otpEmailVerificationEnabled: row.otpEmailVerificationEnabled,
      selfRegistrationEnabled: row.selfRegistrationEnabled,
    };
  }
}
