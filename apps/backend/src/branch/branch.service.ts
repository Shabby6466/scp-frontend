import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  canManageBranchLikeDirector,
  canManageSchoolBranches,
  directorOwnsBranchSchool,
} from '../auth/school-scope.util.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

const branchDetailInclude = {
  school: true,
  users: {
    where: { role: UserRole.BRANCH_DIRECTOR },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  },
} as const;

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    schoolId: string,
    dto: CreateBranchDto,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    if (!canManageSchoolBranches(user, schoolId)) {
      throw new ForbiddenException('Cannot create branches for this school');
    }

    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          name: dto.name.trim(),
          schoolId,
        },
      });

      await this.syncBranchDirectorForBranch(
        tx,
        branch,
        dto.branchDirectorUserId,
      );

      return branch;
    });
  }

  async findAllBySchool(
    schoolId: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (!user.branchId || user.schoolId !== schoolId) {
        throw new ForbiddenException('Cannot access branches for this school');
      }
      const b = await this.prisma.branch.findFirst({
        where: { id: user.branchId, schoolId },
      });
      if (!b) {
        throw new ForbiddenException('Cannot access branches for this school');
      }
      return [b];
    }

    if (!canManageSchoolBranches(user, schoolId)) {
      throw new ForbiddenException('Cannot access this school');
    }

    return this.prisma.branch.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: branchDetailInclude,
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    await this.ensureCanAccessBranchRecord(branch, user);

    return branch;
  }

  async listTeachers(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    await this.ensureCanAccessBranchRecord(branch, user);

    return this.prisma.user.findMany({
      where: {
        role: UserRole.TEACHER,
        branchId: id,
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

  async update(
    id: string,
    dto: UpdateBranchDto,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const schoolLevel = canManageSchoolBranches(user, branch.schoolId);
    const branchLevel = canManageBranchLikeDirector(user, branch);
    if (!schoolLevel && !branchLevel) {
      throw new ForbiddenException('Cannot update this branch');
    }

    if (dto.branchDirectorUserId !== undefined && !schoolLevel) {
      throw new ForbiddenException(
        'Only a school director, school admin, or platform admin can assign or remove a branch director',
      );
    }

    if (dto.name === undefined && dto.branchDirectorUserId === undefined) {
      throw new BadRequestException('Provide at least one field to update');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.syncBranchDirectorForBranch(
        tx,
        branch,
        dto.branchDirectorUserId,
      );

      const data: { name?: string } = {};
      if (dto.name != null) {
        data.name = dto.name.trim();
      }

      if (Object.keys(data).length > 0) {
        await tx.branch.update({ where: { id }, data });
      }

      return tx.branch.findUniqueOrThrow({
        where: { id },
        include: branchDetailInclude,
      });
    });
  }

  async remove(
    id: string,
    user: { role: UserRole; schoolId: string | null; branchId: string | null },
  ) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!canManageSchoolBranches(user, branch.schoolId)) {
      throw new ForbiddenException('Cannot delete this branch');
    }

    return this.prisma.branch.delete({
      where: { id },
    });
  }

  /**
   * `incoming === undefined` — no change. Empty string — remove all branch directors from this branch
   * (return to school pool). Non-empty — assign that user; unassign any other branch director on this branch.
   */
  private async syncBranchDirectorForBranch(
    tx: Prisma.TransactionClient,
    branch: { id: string; schoolId: string },
    incoming: string | undefined,
  ): Promise<void> {
    if (incoming === undefined) {
      return;
    }

    const trimmed = incoming.trim();

    if (!trimmed) {
      await tx.user.updateMany({
        where: {
          branchId: branch.id,
          role: UserRole.BRANCH_DIRECTOR,
        },
        data: {
          branchId: null,
          schoolId: branch.schoolId,
        },
      });
      return;
    }

    const directorUser = await tx.user.findUnique({
      where: { id: trimmed },
    });

    if (!directorUser) {
      throw new NotFoundException('Branch director user not found');
    }

    if (directorUser.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'A platform admin cannot be assigned as a branch director',
      );
    }

    if (directorUser.role !== UserRole.BRANCH_DIRECTOR) {
      throw new BadRequestException(
        'Selected user must have the branch director role',
      );
    }

    if (directorUser.branchId != null && directorUser.branchId !== branch.id) {
      throw new BadRequestException(
        'Selected user is already assigned to another branch; choose someone in the pool or reassign them first',
      );
    }

    if (
      directorUser.schoolId != null &&
      directorUser.schoolId !== branch.schoolId
    ) {
      throw new BadRequestException(
        'Branch director belongs to a different school',
      );
    }

    await tx.user.updateMany({
      where: {
        branchId: branch.id,
        role: UserRole.BRANCH_DIRECTOR,
        NOT: { id: trimmed },
      },
      data: {
        branchId: null,
        schoolId: branch.schoolId,
      },
    });

    await tx.user.update({
      where: { id: trimmed },
      data: {
        branchId: branch.id,
        schoolId: branch.schoolId,
        staffPosition: null,
        staffClearanceActive: false,
      },
    });
  }

  private async ensureCanAccessBranchRecord(
    branch: { id: string; schoolId: string },
    user: {
      role: UserRole;
      schoolId: string | null;
      branchId: string | null;
      id?: string;
    },
  ) {
    if (user.role === UserRole.ADMIN) return;

    if (
      user.role === UserRole.SCHOOL_ADMIN &&
      user.schoolId === branch.schoolId
    )
      return;

    if (directorOwnsBranchSchool(user, branch.schoolId)) return;

    if (canManageBranchLikeDirector(user, branch)) return;

    if (user.role === UserRole.TEACHER && user.branchId === branch.id) return;

    if (user.role === UserRole.STUDENT && user.branchId === branch.id) {
      return;
    }

    throw new ForbiddenException('Cannot access this branch');
  }
}
