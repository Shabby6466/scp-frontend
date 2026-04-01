import { Body, Controller, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PresignDto } from './dto/presign.dto.js';
import { CompleteDocumentDto } from './dto/complete.dto.js';
import { UserRole } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('presign')
  presign(
    @Body() dto: PresignDto,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.documentService.presign(dto, user);
  }

  @Post('complete')
  complete(
    @Body() dto: CompleteDocumentDto,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.documentService.complete(dto, user);
  }

  @Get('child/:childId')
  listByChild(
    @Param('childId') childId: string,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.documentService.listByChild(childId, user);
  }

  @Get('staff/:staffId')
  listByStaff(
    @Param('staffId') staffId: string,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.documentService.listByStaff(staffId, user);
  }

  @Get('branch/:branchId/facility')
  listByBranchFacility(
    @Param('branchId') branchId: string,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.documentService.listByBranchFacility(branchId, user);
  }

  @Patch(':id/verify')
  verify(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.documentService.verify(id, user);
  }

  @Get(':id/download')
  getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.documentService.getDownloadUrl(id, user);
  }
}
