import { UserRole } from '@prisma/client';
import {
  branchDirectorOwnsBranch,
  canManageBranchLikeDirector,
  canManageSchoolBranches,
  directorOwnsBranchSchool,
  isSchoolDirector,
} from './school-scope.util';

describe('school-scope util', () => {
  it('identifies school directors correctly', () => {
    expect(
      isSchoolDirector({ role: UserRole.DIRECTOR, schoolId: 'school-1' }),
    ).toBe(true);
    expect(
      isSchoolDirector({ role: UserRole.DIRECTOR, schoolId: null }),
    ).toBe(false);
    expect(
      isSchoolDirector({ role: UserRole.BRANCH_DIRECTOR, schoolId: 'school-1' }),
    ).toBe(false);
  });

  it('validates branch ownership for directors and branch directors', () => {
    expect(
      directorOwnsBranchSchool(
        { role: UserRole.DIRECTOR, schoolId: 'school-1' },
        'school-1',
      ),
    ).toBe(true);
    expect(
      branchDirectorOwnsBranch(
        { role: UserRole.BRANCH_DIRECTOR, branchId: 'branch-1' },
        'branch-1',
      ),
    ).toBe(true);
  });

  it('allows correct branch-management actors', () => {
    const branch = { id: 'branch-1', schoolId: 'school-1' };
    expect(
      canManageBranchLikeDirector(
        { role: UserRole.ADMIN, schoolId: null, branchId: null },
        branch,
      ),
    ).toBe(true);
    expect(
      canManageBranchLikeDirector(
        { role: UserRole.DIRECTOR, schoolId: 'school-1', branchId: null },
        branch,
      ),
    ).toBe(true);
    expect(
      canManageBranchLikeDirector(
        {
          role: UserRole.BRANCH_DIRECTOR,
          schoolId: 'school-1',
          branchId: 'branch-1',
        },
        branch,
      ),
    ).toBe(true);
    expect(
      canManageBranchLikeDirector(
        { role: UserRole.TEACHER, schoolId: 'school-1', branchId: 'branch-1' },
        branch,
      ),
    ).toBe(false);
  });

  it('allows school branch management for admin/director only', () => {
    expect(
      canManageSchoolBranches(
        { role: UserRole.ADMIN, schoolId: null },
        'school-1',
      ),
    ).toBe(true);
    expect(
      canManageSchoolBranches(
        { role: UserRole.DIRECTOR, schoolId: 'school-1' },
        'school-1',
      ),
    ).toBe(true);
    expect(
      canManageSchoolBranches(
        { role: UserRole.BRANCH_DIRECTOR, schoolId: 'school-1' },
        'school-1',
      ),
    ).toBe(false);
  });
});
