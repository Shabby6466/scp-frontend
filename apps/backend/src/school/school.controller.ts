import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SchoolService } from './school.service.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { UpdateSchoolDto } from './dto/update-school.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('schools')
@UseGuards(JwtAuthGuard)
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateSchoolDto) {
    return this.schoolService.create(dto);
  }

  @Get()
  findAll(@CurrentUser() user: { role: UserRole; schoolId: string | null }) {
    return this.schoolService.findAll(user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { role: UserRole; schoolId: string | null },
  ) {
    return this.schoolService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.DIRECTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
    @CurrentUser() user: { role: UserRole; schoolId: string | null },
  ) {
    return this.schoolService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.schoolService.remove(id);
  }
}
