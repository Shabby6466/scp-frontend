import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/**
 * Explicit allow-list (not numeric hierarchy) so BRANCH_DIRECTOR does not
 * satisfy DIRECTOR-only routes (explicit allow-list, not numeric hierarchy).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('No user in request');
    }

    const role = user.role as UserRole;

    if (role === UserRole.ADMIN) {
      return true;
    }

    if (requiredRoles.includes(role)) {
      return true;
    }


    throw new ForbiddenException(
      `Requires one of: ${requiredRoles.join(', ')}`,
    );
  }
}
