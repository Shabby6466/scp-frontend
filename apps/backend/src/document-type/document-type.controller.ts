import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentTypeService } from './document-type.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto.js';
import { AssignDocumentTypeDto } from './dto/assign-document-type.dto.js';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto.js';

@Controller('document-types')
@UseGuards(JwtAuthGuard)
export class DocumentTypeController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Post()
  create(
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    @Body() dto: CreateDocumentTypeDto,
  ) {
    return this.documentTypeService.create(dto, user);
  }

  @Post(':id/assign')
  assignUsers(
    @Param('id') id: string,
    @Body() dto: AssignDocumentTypeDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentTypeService.assignUsers(id, dto.userIds, user);
  }

  @Delete(':id/assign/:userId')
  unassignUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentTypeService.unassignUser(id, userId, user);
  }

  @Get('assigned/me')
  assignedToMe(
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentTypeService.getAssignedForCurrentUser(user);
  }

  @Get(':id/assignees')
  assignees(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentTypeService.getAssignees(id, user);
  }

  @Get()
  findAll(
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    @Query('schoolId') schoolId?: string,
    @Query('branchId') branchId?: string,
    @Query('targetRole') targetRole?: UserRole,
  ) {
    return this.documentTypeService.findAll(
      { schoolId, branchId, targetRole },
      user,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentTypeDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentTypeService.update(id, dto, user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    return this.documentTypeService.findOne(id, user);
  }
}
