import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import {
  canManageSchoolBranches,
  isSchoolDirector,
} from '../auth/school-scope.util.js';

/** Plain shape for `userBelongsToSchool` query (avoids ESLint losing Prisma.GetPayload nested types). */
interface UserSchoolScopeRow {
  schoolId: string | null;
  branch: { schoolId: string } | null;
  studentEnrollment: { branch: { schoolId: string } | null } | null;
}

type UserBranchScopeRow = Prisma.UserGetPayload<{
  select: {
    role: true;
    branchId: true;
    studentEnrollment: { select: { branchId: true } };
  };
}>;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly settings: SettingsService,
  ) {}

  async createUser(
    dto: CreateUserDto,
    currentUser: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
      name?: string | null;
    },
  ) {
    this.validateCreatePermission(dto, currentUser);

    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.role === UserRole.STUDENT) {
      throw new BadRequestException(
        'Student accounts are created when a child is enrolled at a branch',
      );
    }

    const { schoolId, branchId } = await this.resolveScopeForCreate(
      dto,
      currentUser,
    );
    if (
      currentUser.role !== UserRole.ADMIN &&
      dto.role !== UserRole.ADMIN &&
      !schoolId &&
      !branchId
    ) {
      throw new ForbiddenException('School or branch is required');
    }

    if (dto.role === UserRole.DIRECTOR) {
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'Only a platform admin can assign a school director',
        );
      }
      if (schoolId) {
        const taken = await this.prisma.user.findFirst({
          where: { role: UserRole.DIRECTOR, schoolId },
        });
        if (taken) {
          throw new ConflictException('This school already has a director');
        }
      }
    }

    if (dto.role === UserRole.BRANCH_DIRECTOR) {
      if (
        currentUser.role !== UserRole.ADMIN &&
        !isSchoolDirector(currentUser) &&
        currentUser.role !== UserRole.SCHOOL_ADMIN
      ) {
        throw new ForbiddenException(
          'Only a platform admin, school director, or school admin can assign a branch director',
        );
      }
      if (branchId && schoolId) {
        await this.assertBranchInSchool(branchId, schoolId);
      }
      if (!branchId && !schoolId && currentUser.role !== UserRole.ADMIN) {
        throw new BadRequestException(
          'schoolId is required for a pool branch director (no branch yet)',
        );
      }
      if (
        (isSchoolDirector(currentUser) ||
          currentUser.role === UserRole.SCHOOL_ADMIN) &&
        schoolId &&
        currentUser.schoolId &&
        schoolId !== currentUser.schoolId
      ) {
        throw new ForbiddenException(
          'Branch director must belong to your school',
        );
      }
    }

    if (
      (isSchoolDirector(currentUser) ||
        currentUser.role === UserRole.SCHOOL_ADMIN) &&
      branchId &&
      dto.role === UserRole.TEACHER
    ) {
      await this.assertBranchInSchool(branchId, currentUser.schoolId!);
    }

    if (
      currentUser.role === UserRole.BRANCH_DIRECTOR &&
      dto.role === UserRole.TEACHER
    ) {
      if (!branchId || branchId !== currentUser.branchId) {
        throw new ForbiddenException(
          'Teachers must be created for your branch only',
        );
      }
    }

    const { otpEmailVerificationEnabled } = await this.settings.getPublic();
    const skipInviteEmail =
      dto.role !== UserRole.ADMIN && !otpEmailVerificationEnabled;

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        role: dto.role,
        schoolId:
          dto.role === UserRole.DIRECTOR ||
          dto.role === UserRole.BRANCH_DIRECTOR
            ? (schoolId ?? null)
            : null,
        branchId:
          dto.role === UserRole.TEACHER || dto.role === UserRole.BRANCH_DIRECTOR
            ? (branchId ?? null)
            : null,
        staffPosition: null,
        staffClearanceActive: false,
        ...(skipInviteEmail ? { emailVerifiedAt: new Date() } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (dto.role !== UserRole.ADMIN && otpEmailVerificationEnabled) {
      await this.auth.sendInviteOtp(email, currentUser.name ?? undefined);
    }

    return user;
  }

  async getBranchForUser(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async listTeachersForSchoolDirector(currentUser: {
    role: UserRole;
    schoolId: string | null;
    branchId: string | null;
  }) {
    if (isSchoolDirector(currentUser)) {
      return this.prisma.user.findMany({
        where: {
          role: UserRole.TEACHER,
          branch: { schoolId: currentUser.schoolId! },
        },
        orderBy: [{ email: 'asc' }],
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          schoolId: true,
          branchId: true,
          createdAt: true,
          staffPosition: true,
          staffClearanceActive: true,
          branch: { select: { id: true, name: true, schoolId: true } },
        },
      });
    }
    if (currentUser.role === UserRole.BRANCH_DIRECTOR && currentUser.branchId) {
      return this.prisma.user.findMany({
        where: {
          role: UserRole.TEACHER,
          branchId: currentUser.branchId,
        },
        orderBy: [{ email: 'asc' }],
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          schoolId: true,
          branchId: true,
          createdAt: true,
          staffPosition: true,
          staffClearanceActive: true,
          branch: { select: { id: true, name: true, schoolId: true } },
        },
      });
    }
    throw new ForbiddenException(
      'Only a school director or branch director can list teachers this way',
    );
  }

  async listBranchDirectorCandidates(
    schoolId: string,
    currentUser: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    if (!canManageSchoolBranches(currentUser, schoolId)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    /**
     * Branch directors tied to this school, plus unscoped pool users (`schoolId` and `branchId` both null).
     * Pool users can be assigned to a branch by any caller who passes `canManageSchoolBranches` (see
     * BranchService.syncBranchDirectorForBranch), so school directors and school admins must see them here too —
     * not only platform admins.
     *
     * Note: in a strict multi-tenant deployment, pool invites are visible across schools until each user is
     * given a `schoolId` or linked to a branch; prefer creating branch directors with a school when isolation matters.
     */
    const schoolTied: Prisma.UserWhereInput[] = [
      { schoolId },
      { branch: { schoolId } },
      { schoolId: null, branchId: null },
    ];
    const whereSchoolBds: Prisma.UserWhereInput = {
      role: UserRole.BRANCH_DIRECTOR,
      OR: schoolTied,
    };

    return this.prisma.user.findMany({
      where: whereSchoolBds,
      orderBy: [{ email: 'asc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        branch: { select: { id: true, name: true, schoolId: true } },
        school: { select: { id: true, name: true } },
      },
    });
  }

  async listBySchool(
    schoolId: string,
    currentUser: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      // ok
    } else if (isSchoolDirector(currentUser)) {
      if (currentUser.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot access this school');
      }
    } else if (currentUser.role === UserRole.SCHOOL_ADMIN) {
      if (currentUser.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot access this school');
      }
    } else if (currentUser.role === UserRole.BRANCH_DIRECTOR) {
      if (currentUser.schoolId !== schoolId || !currentUser.branchId) {
        throw new ForbiddenException('Cannot access this school');
      }
    } else if (currentUser.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: currentUser.branchId },
      });
      if (!branch || branch.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot access this school');
      }
    } else {
      throw new ForbiddenException('Cannot access this school');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const schoolScope = {
      OR: [
        { schoolId },
        { branch: { schoolId } },
        {
          studentEnrollment: {
            branch: { schoolId },
          },
        },
      ],
    };

    const where =
      currentUser.role === UserRole.BRANCH_DIRECTOR && currentUser.branchId
        ? {
            AND: [
              schoolScope,
              {
                OR: [
                  { branchId: currentUser.branchId },
                  { studentEnrollment: { branchId: currentUser.branchId } },
                ],
              },
            ],
          }
        : schoolScope;

    return this.prisma.user.findMany({
      where,
      orderBy: [{ role: 'desc' }, { email: 'asc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        staffPosition: true,
        staffClearanceActive: true,
        branch: { select: { id: true, schoolId: true } },
      },
    });
  }

  async listAll() {
    return this.prisma.user.findMany({
      orderBy: [{ role: 'desc' }, { email: 'asc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        staffPosition: true,
        staffClearanceActive: true,
        school: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, schoolId: true } },
      },
    });
  }

  async updateUser(
    targetId: string,
    dto: {
      name?: string;
      password?: string;
      schoolId?: string;
      branchId?: string;
    },
    actor: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    const adminScopePatch =
      actor.role === UserRole.ADMIN &&
      (dto.schoolId !== undefined || dto.branchId !== undefined);
    if (
      dto.name === undefined &&
      (dto.password === undefined || dto.password === '') &&
      !adminScopePatch
    ) {
      throw new BadRequestException(
        'Provide name and/or a new password to update',
      );
    }

    if (
      (dto.schoolId !== undefined || dto.branchId !== undefined) &&
      actor.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only a platform admin can assign school or branch');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        role: true,
        schoolId: true,
        branchId: true,
      },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === UserRole.ADMIN && adminScopePatch) {
      throw new BadRequestException('Cannot assign school or branch to a platform admin');
    }

    if (actor.id === target.id) {
      if (actor.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'You cannot change your own account. Ask a supervisor.',
        );
      }
    } else {
      await this.assertSuperiorCanPatchUser(actor, target);
    }

    const data: {
      name?: string;
      password?: string;
      schoolId?: string | null;
      branchId?: string | null;
    } = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.password !== undefined && dto.password.length > 0) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    if (actor.role === UserRole.ADMIN && dto.schoolId !== undefined) {
      const sid = dto.schoolId.trim();
      if (target.role === UserRole.DIRECTOR) {
        if (sid) {
          const taken = await this.prisma.user.findFirst({
            where: {
              role: UserRole.DIRECTOR,
              schoolId: sid,
              NOT: { id: targetId },
            },
          });
          if (taken) {
            throw new ConflictException('This school already has a director');
          }
        }
        data.schoolId = sid || null;
        data.branchId = null;
      } else if (target.role === UserRole.BRANCH_DIRECTOR) {
        data.schoolId = sid || null;
        if (!sid) {
          data.branchId = null;
        }
      }
    }

    if (actor.role === UserRole.ADMIN && dto.branchId !== undefined) {
      const bid = dto.branchId.trim();
      if (target.role === UserRole.TEACHER) {
        if (bid) {
          const b = await this.prisma.branch.findUnique({ where: { id: bid } });
          if (!b) {
            throw new NotFoundException('Branch not found');
          }
          data.branchId = bid;
        } else {
          data.branchId = null;
        }
      } else if (target.role === UserRole.BRANCH_DIRECTOR && bid) {
        const b = await this.prisma.branch.findUnique({ where: { id: bid } });
        if (!b) {
          throw new NotFoundException('Branch not found');
        }
        data.branchId = bid;
        data.schoolId = b.schoolId;
      }
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        branchId: true,
        createdAt: true,
        staffPosition: true,
        staffClearanceActive: true,
        school: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, schoolId: true } },
      },
    });
  }

  private async assertBranchInSchool(branchId: string, schoolId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch || branch.schoolId !== schoolId) {
      throw new ForbiddenException('Branch is not in your school');
    }
  }

  private async assertSuperiorCanPatchUser(
    actor: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
    target: {
      id: string;
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (target.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only a platform admin can edit this account',
      );
    }

    if (actor.role === UserRole.SCHOOL_ADMIN) {
      if (!actor.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      const ok = await this.userBelongsToSchool(target.id, actor.schoolId);
      if (!ok) {
        throw new ForbiddenException('User is not in your school');
      }
      return;
    }

    if (isSchoolDirector(actor)) {
      if (target.role === UserRole.DIRECTOR) {
        throw new ForbiddenException(
          'Only a platform admin can edit the school director',
        );
      }
      const ok = await this.userBelongsToSchool(target.id, actor.schoolId!);
      if (!ok) {
        throw new ForbiddenException('User is not in your school');
      }
      return;
    }

    if (actor.role === UserRole.BRANCH_DIRECTOR) {
      if (!actor.branchId || !actor.schoolId) {
        throw new ForbiddenException('Your account is not linked to a branch');
      }
      if (
        target.role === UserRole.DIRECTOR ||
        target.role === UserRole.SCHOOL_ADMIN ||
        target.role === UserRole.BRANCH_DIRECTOR
      ) {
        throw new ForbiddenException('You cannot edit this account');
      }
      const ok = await this.userBelongsToBranchScope(target.id, actor.branchId);
      if (!ok) {
        throw new ForbiddenException('User is not at your branch');
      }
      return;
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  private async userBelongsToSchool(
    userId: string,
    schoolId: string,
  ): Promise<boolean> {
    const u: UserSchoolScopeRow | null = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        schoolId: true,
        branch: { select: { schoolId: true } },
        studentEnrollment: {
          select: { branch: { select: { schoolId: true } } },
        },
      },
    });
    if (!u) {
      return false;
    }
    if (u.schoolId === schoolId) {
      return true;
    }
    if (u.branch?.schoolId === schoolId) {
      return true;
    }
    const studentBranchSchoolId = u.studentEnrollment?.branch?.schoolId;
    return studentBranchSchoolId === schoolId;
  }

  private async userBelongsToBranchScope(
    userId: string,
    branchId: string,
  ): Promise<boolean> {
    const u: UserBranchScopeRow | null = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        branchId: true,
        studentEnrollment: { select: { branchId: true } },
      },
    });
    if (!u) return false;
    if (u.role === UserRole.TEACHER || u.role === UserRole.BRANCH_DIRECTOR) {
      return u.branchId === branchId;
    }
    if (u.role === UserRole.STUDENT) {
      return u.studentEnrollment?.branchId === branchId;
    }
    return false;
  }

  private validateCreatePermission(
    dto: CreateUserDto,
    currentUser: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ) {
    if (dto.role === UserRole.SCHOOL_ADMIN) {
      throw new BadRequestException(
        'SCHOOL_ADMIN is no longer used; use DIRECTOR for the school owner',
      );
    }
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }
    if (isSchoolDirector(currentUser)) {
      if (
        dto.role !== UserRole.TEACHER &&
        dto.role !== UserRole.BRANCH_DIRECTOR
      ) {
        throw new ForbiddenException(
          'You can only create teachers or branch directors',
        );
      }
      return;
    }
    if (currentUser.role === UserRole.SCHOOL_ADMIN) {
      if (!currentUser.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      if (
        dto.role !== UserRole.TEACHER &&
        dto.role !== UserRole.BRANCH_DIRECTOR
      ) {
        throw new ForbiddenException(
          'You can only create teachers or branch directors',
        );
      }
      return;
    }
    if (currentUser.role === UserRole.BRANCH_DIRECTOR) {
      if (dto.role !== UserRole.TEACHER) {
        throw new ForbiddenException(
          'You can only create teachers for your branch',
        );
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions');
  }

  private async resolveScopeForCreate(
    dto: CreateUserDto,
    currentUser: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
    },
  ): Promise<{ schoolId: string | null; branchId: string | null }> {
    if (dto.role === UserRole.ADMIN) {
      return { schoolId: null, branchId: null };
    }
    if (currentUser.role === UserRole.ADMIN) {
      if (dto.role === UserRole.DIRECTOR) {
        return { schoolId: dto.schoolId ?? null, branchId: null };
      }
      if (dto.role === UserRole.BRANCH_DIRECTOR) {
        if (dto.branchId) {
          const b = await this.prisma.branch.findUnique({
            where: { id: dto.branchId },
          });
          if (!b) {
            throw new NotFoundException('Branch not found');
          }
          return { schoolId: b.schoolId, branchId: dto.branchId };
        }
        return { schoolId: dto.schoolId ?? null, branchId: null };
      }
      if (dto.role === UserRole.TEACHER) {
        return { schoolId: null, branchId: dto.branchId ?? null };
      }
      return { schoolId: null, branchId: null };
    }
    if (isSchoolDirector(currentUser)) {
      if (dto.role === UserRole.BRANCH_DIRECTOR) {
        if (dto.branchId) {
          return { schoolId: currentUser.schoolId, branchId: dto.branchId };
        }
        return { schoolId: currentUser.schoolId, branchId: null };
      }
      return { schoolId: null, branchId: dto.branchId ?? null };
    }
    if (currentUser.role === UserRole.SCHOOL_ADMIN) {
      if (!currentUser.schoolId) {
        throw new ForbiddenException('Your account is not linked to a school');
      }
      if (dto.role === UserRole.BRANCH_DIRECTOR) {
        if (dto.branchId) {
          return { schoolId: currentUser.schoolId, branchId: dto.branchId };
        }
        return { schoolId: currentUser.schoolId, branchId: null };
      }
      return { schoolId: null, branchId: dto.branchId ?? null };
    }
    if (currentUser.role === UserRole.BRANCH_DIRECTOR) {
      if (!currentUser.branchId || !currentUser.schoolId) {
        throw new ForbiddenException('Your account is not linked to a branch');
      }
      return { schoolId: currentUser.schoolId, branchId: currentUser.branchId };
    }
    throw new ForbiddenException('Insufficient permissions');
  }
}
