import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ComplianceService } from './compliance.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.SCHOOL_ADMIN)
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  @Get('heatmap')
  getHeatmap(@Query('schoolId') schoolId?: string) {
    return this.service.getHeatmapData(schoolId);
  }

  @Get('audit-readiness')
  getAuditReadiness(@Query('schoolId') schoolId?: string) {
    return this.service.getAuditReadiness(schoolId);
  }
}
