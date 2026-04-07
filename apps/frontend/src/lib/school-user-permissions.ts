import type { UserSummary } from '@/store/features/userApi';

export function rowBelongsToSchool(row: UserSummary, schoolId: string): boolean {
  if (row.schoolId === schoolId) return true;
  if (row.branch?.schoolId === schoolId) return true;
  return false;
}

/** Whether the actor may open the Edit dialog for this row (name/password). */
export function canShowEditUser(
  actor: { id: string; role: string; schoolId: string | null; branchId?: string | null },
  row: UserSummary,
): boolean {
  if (actor.role === 'ADMIN') return true;
  if (row.id === actor.id) return false;
  if (row.role === 'ADMIN') return false;
  if (actor.role === 'DIRECTOR' && actor.schoolId) {
    if (row.role === 'DIRECTOR') return false;
    return rowBelongsToSchool(row, actor.schoolId);
  }
  if (actor.role === 'BRANCH_DIRECTOR' && actor.branchId && actor.schoolId) {
    if (['ADMIN', 'DIRECTOR', 'BRANCH_DIRECTOR'].includes(row.role)) {
      return false;
    }
    return row.branchId === actor.branchId;
  }
  return false;
}
