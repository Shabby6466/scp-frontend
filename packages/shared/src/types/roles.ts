export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  BRANCH_DIRECTOR = 'BRANCH_DIRECTOR',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPERADMIN]: 4,
  [Role.SCHOOL_ADMIN]: 3,
  [Role.BRANCH_DIRECTOR]: 2,
  [Role.TEACHER]: 1,
  [Role.STUDENT]: 0,
};

export function hasHigherOrEqualRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
