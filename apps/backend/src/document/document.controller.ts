import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { DocumentService } from './document.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { QueryDocumentDto } from './dto/query-document.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Audited } from '../audit/audit.decorator.js';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Post('upload')
  @Roles(Role.SUPERADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_DIRECTOR)
  @Audited('DOCUMENT_UPLOAD')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.upload(dto, file, userId);
  }

  @Post(':id/reupload')
  @Roles(Role.SUPERADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_DIRECTOR)
  @Audited('DOCUMENT_REUPLOAD')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  reupload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('metadata') metadata?: Record<string, unknown>,
    @Body('expiresAt') expiresAt?: string,
  ) {
    return this.service.reupload(id, file, userId, metadata, expiresAt);
  }

  @Get()
  findAll(@Query() query: QueryDocumentDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  getStats(
    @Query('schoolId') schoolId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.service.getStats(schoolId, branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/download')
  @Audited('DOCUMENT_DOWNLOAD')
  getSignedUrl(@Param('id') id: string) {
    return this.service.getSignedUrl(id);
  }

  @Get(':id/versions/:version/download')
  getVersionSignedUrl(
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.service.getVersionSignedUrl(id, version);
  }
}
