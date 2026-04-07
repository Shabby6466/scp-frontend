import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AnalyticsService } from './analytics.service.js';
import { FormsAnalyticsQueryDto } from './dto/forms-analytics-query.dto.js';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.DIRECTOR,
  UserRole.BRANCH_DIRECTOR,
  UserRole.TEACHER,
)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('forms/submissions')
  submissions(
    @Query() q: FormsAnalyticsQueryDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.analytics.submissions(
      user,
      new Date(q.from),
      new Date(q.to),
      q.bucket,
      q.documentTypeId,
    );
  }

  @Get('forms/by-uploader')
  byUploader(
    @Query() q: FormsAnalyticsQueryDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.analytics.byUploader(
      user,
      new Date(q.from),
      new Date(q.to),
      q.documentTypeId,
    );
  }

  @Get('forms/expiry-by-type')
  expiryByType(
    @Query('documentTypeId') documentTypeId: string | undefined,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.analytics.expiryByType(user, documentTypeId);
  }

  @Get('compliance/summary')
  getComplianceSummary(@CurrentUser() user: any) {
    return this.analytics.getComplianceSummary(user);
  }

  @Get('compliance/pending-actions')
  getPendingActions(@CurrentUser() user: any) {
    return this.analytics.getPendingActions(user);
  }
}
