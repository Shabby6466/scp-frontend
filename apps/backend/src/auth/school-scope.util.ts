import { UserRole } from '@prisma/client';

/** School owner: DIRECTOR with schoolId (not branch-scoped). */
export function isSchoolDirector(user: {
  role: UserRole;
  schoolId: string | null;
}): boolean {
  return user.role === UserRole.DIRECTOR && user.schoolId != null;
}

export function directorOwnsBranchSchool(
  user: { role: UserRole; schoolId: string | null },
  branchSchoolId: string,
): boolean {
  return isSchoolDirector(user) && user.schoolId === branchSchoolId;
}

export function branchDirectorOwnsBranch(
  user: { role: UserRole; branchId: string | null },
  branchId: string,
): boolean {
  return user.role === UserRole.BRANCH_DIRECTOR && user.branchId === branchId;
}

/** Admin, school admin, school director, or branch director for this branch. */
export function canManageBranchLikeDirector(
  user: { role: UserRole; schoolId: string | null; branchId: string | null },
  branch: { id: string; schoolId: string },
): boolean {
  if (user.role === UserRole.ADMIN) return true;
  if (user.role === UserRole.SCHOOL_ADMIN && user.schoolId === branch.schoolId)
    return true;
  if (directorOwnsBranchSchool(user, branch.schoolId)) return true;
  if (branchDirectorOwnsBranch(user, branch.id)) return true;
  return false;
}

/** Create/update/delete branches for a school — not branch directors. */
export function canManageSchoolBranches(
  user: { role: UserRole; schoolId: string | null },
  schoolId: string,
): boolean {
  if (user.role === UserRole.ADMIN) return true;
  if (user.role === UserRole.SCHOOL_ADMIN && user.schoolId === schoolId)
    return true;
  if (directorOwnsBranchSchool(user, schoolId)) return true;
  return false;
}
