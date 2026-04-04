import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { DocumentService } from './document.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PresignDto } from './dto/presign.dto.js';
import { CompleteDocumentDto } from './dto/complete.dto.js';
import { SearchDocumentDto } from './dto/search-document.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.DIRECTOR,
    UserRole.BRANCH_DIRECTOR,
  )
  searchDocuments(
    @Query() dto: SearchDocumentDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.searchDocuments(dto, user);
  }

  @Post('presign')
  presign(
    @Body() dto: PresignDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.presign(dto, user);
  }

  @Post('complete')
  complete(
    @Body() dto: CompleteDocumentDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.complete(dto, user);
  }

  /** Alias: documents for a user (teacher, student, etc.) by user id. */
  @Get('staff/:staffId')
  listByStaff(
    @Param('staffId') staffId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.listByOwner(staffId, user);
  }

  @Get('owner/:ownerUserId')
  listByOwner(
    @Param('ownerUserId') ownerUserId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.listByOwner(ownerUserId, user);
  }

  @Get('assigned/me/summary')
  getAssignedSummary(
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.getAssignedSummary(user);
  }

  @Get('owner/:ownerUserId/type/:documentTypeId')
  getPerFormDetail(
    @Param('ownerUserId') ownerUserId: string,
    @Param('documentTypeId') documentTypeId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.getPerFormDetail(
      ownerUserId,
      documentTypeId,
      user,
    );
  }

  @Get('owner/:ownerUserId/type/:documentTypeId/export')
  async exportPerFormPdf(
    @Param('ownerUserId') ownerUserId: string,
    @Param('documentTypeId') documentTypeId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, fileName } = await this.documentService.exportPerFormPdf(
      ownerUserId,
      documentTypeId,
      user,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(buffer);
  }

  @Patch(':id/verify')
  verify(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.verify(id, user);
  }

  @Get(':id/download')
  getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.getDownloadUrl(id, user);
  }

  @Patch('verify-many')
  verifyMany(
    @Body('ids') ids: string[],
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.verifyMany(ids, user);
  }

  @Post('owner/:ownerUserId/type/:documentTypeId/nudge')
  nudge(
    @Param('ownerUserId') ownerUserId: string,
    @Param('documentTypeId') documentTypeId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentService.nudge(ownerUserId, documentTypeId, user);
  }
}
