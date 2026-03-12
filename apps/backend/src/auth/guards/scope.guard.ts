import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Ensures users can only access resources within their own school/branch.
 * SUPERADMIN bypasses all scope checks.
 * SCHOOL_ADMIN can only access data for their schoolId.
 * BRANCH_DIRECTOR can only access data for their branchId.
 * TEACHER/STUDENT can only access their own data.
 *
 * Expects schoolId/branchId in request params, query, or body.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user in request');
    }

    if (user.role === Role.SUPERADMIN) {
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

    if (user.role === Role.SCHOOL_ADMIN) {
      if (targetSchoolId && targetSchoolId !== user.schoolId) {
        throw new ForbiddenException('Cannot access another school');
      }
      return true;
    }

    if (user.role === Role.BRANCH_DIRECTOR) {
      if (targetSchoolId && targetSchoolId !== user.schoolId) {
        throw new ForbiddenException('Cannot access another school');
      }
      if (targetBranchId && targetBranchId !== user.branchId) {
        throw new ForbiddenException('Cannot access another branch');
      }
      return true;
    }

    // TEACHER / STUDENT: most restrictive
    if (targetSchoolId && targetSchoolId !== user.schoolId) {
      throw new ForbiddenException('Cannot access another school');
    }
    if (targetBranchId && targetBranchId !== user.branchId) {
      throw new ForbiddenException('Cannot access another branch');
    }

    return true;
  }
}
