import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service.js';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Unauthenticated: drives login / register / verify UI. */
  @Get('public')
  getPublic() {
    return this.settings.getPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdmin() {
    return this.settings.getPublic();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  patch(@Body() dto: UpdateAppSettingsDto) {
    return this.settings.update(dto);
  }
}
