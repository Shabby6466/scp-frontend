import { Controller, Post, Query, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { Role } from '@prisma/client';
import { ExportService } from './export.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Audited } from '../audit/audit.decorator.js';

@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Post('audit-zip')
  @Roles(Role.SUPERADMIN, Role.SCHOOL_ADMIN)
  @Audited('AUDIT_ZIP_EXPORT')
  async exportAuditZip(
    @Query('schoolId') schoolId: string,
    @Query('branchId') branchId: string | undefined,
    @Res() res: express.Response,
  ) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="audit-pack-${timestamp}.zip"`,
    });

    await this.service.streamAuditZip(res, schoolId, branchId);
  }
}
