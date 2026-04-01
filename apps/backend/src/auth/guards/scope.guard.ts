import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { isSchoolDirector } from '../school-scope.util.js';

/**
 * Ensures users can only access resources within their scope.
 * ADMIN bypasses all scope checks.
 * SCHOOL_ADMIN (legacy) can access their school.
 * School DIRECTOR (schoolId set) can access any branch in their school.
 * TEACHER is limited to their branch when branchId is present on the request.
 *
 * Expects schoolId or branchId in request params, query, or body.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user in request');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const targetSchoolId =
      request.params?.schoolId ??
      request.query?.schoolId ??
      request.body?.schoolId;
    const targetBranchId =
      request.params?.branchId ??
      request.query?.branchId ??
      request.body?.branchId;

    if (user.role === UserRole.SCHOOL_ADMIN) {
      if (targetSchoolId && targetSchoolId !== user.schoolId) {
        throw new ForbiddenException('Cannot access another school');
      }
      return true;
    }

    if (isSchoolDirector(user)) {
      if (targetSchoolId && targetSchoolId !== user.schoolId) {
        throw new ForbiddenException('Cannot access another school');
      }
      if (targetBranchId) {
        const branch = await this.prisma.branch.findUnique({
          where: { id: targetBranchId },
        });
        if (!branch || branch.schoolId !== user.schoolId) {
          throw new ForbiddenException('Cannot access this branch');
        }
      }
      return true;
    }

    if (user.role === UserRole.BRANCH_DIRECTOR) {
      if (targetSchoolId && targetSchoolId !== user.schoolId) {
        throw new ForbiddenException('Cannot access another school');
      }
      if (targetBranchId && targetBranchId !== user.branchId) {
        throw new ForbiddenException('Cannot access another branch');
      }
      return true;
    }

    if (user.role === UserRole.TEACHER) {
      if (targetBranchId && targetBranchId !== user.branchId) {
        throw new ForbiddenException('Cannot access another branch');
      }
      return true;
    }

    return true;
  }
}
