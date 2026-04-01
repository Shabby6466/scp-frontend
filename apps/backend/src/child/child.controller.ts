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
import { ChildService } from './child.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateChildDto } from './dto/create-child.dto.js';
import { UpdateChildDto } from './dto/update-child.dto.js';
import { UserRole } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChildController {
  constructor(private readonly childService: ChildService) {}

  @Post('branches/:branchId/children')
  create(
    @Param('branchId') branchId: string,
    @Body() dto: CreateChildDto,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.childService.create(branchId, dto, user);
  }

  @Get('children/my')
  listMyEnrollment(
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.childService.listMyEnrollment(user.id, user);
  }

  @Get('branches/:branchId/children')
  listByBranch(
    @Param('branchId') branchId: string,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.childService.listByBranch(branchId, user);
  }

  @Get('children/:id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.childService.findOne(id, user);
  }

  @Patch('children/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChildDto,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.childService.update(id, dto, user);
  }

  @Delete('children/:id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.childService.remove(id, user);
  }
}
