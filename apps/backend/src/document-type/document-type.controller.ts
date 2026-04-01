import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DocumentTypeService } from './document-type.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { DocumentCategory, UserRole } from '@prisma/client';

@Controller('document-types')
@UseGuards(JwtAuthGuard)
export class DocumentTypeController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
    @Query('category') category?: DocumentCategory,
    @Query('schoolId') schoolId?: string,
    @Query('position') position?: string,
    @Query('childId') childId?: string,
  ) {
    return this.documentTypeService.findAll({ category, schoolId, position, childId }, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentTypeService.findOne(id);
  }
}
