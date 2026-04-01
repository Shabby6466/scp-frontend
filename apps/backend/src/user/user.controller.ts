import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listAll() {
    return this.userService.listAll();
  }

  @Post('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createUserGlobal(
    @Body() dto: CreateUserDto,
    @CurrentUser()
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
      name?: string | null;
    },
  ) {
    return this.userService.createUser(dto, user);
  }

  @Patch('users/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.userService.updateUser(id, dto, user);
  }

  @Post('schools/:schoolId/users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  createUser(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateUserDto,
    @CurrentUser() user: { id: string; role: UserRole; schoolId: string | null; branchId: string | null; name?: string | null },
  ) {
    return this.userService.createUser(
      { ...dto, schoolId: dto.schoolId ?? schoolId },
      user,
    );
  }

  @Get('schools/:schoolId/users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  listBySchool(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.userService.listBySchool(schoolId, user);
  }

  @Get('schools/:schoolId/branch-director-candidates')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.DIRECTOR)
  listBranchDirectorCandidates(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.userService.listBranchDirectorCandidates(schoolId, user);
  }

  @Get('teachers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DIRECTOR, UserRole.BRANCH_DIRECTOR)
  async listTeachers(
    @CurrentUser() user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    return this.userService.listTeachersForSchoolDirector(user);
  }
}
