'use client';

import { useMemo, useState } from 'react';
import { useGetSchoolQuery, useGetSchoolsQuery } from '@/store/features/schoolApi';
import { useGetBranchesQuery } from '@/store/features/branchApi';
import {
  useGetAllUsersQuery,
  useGetSchoolUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} from '@/store/features/userApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, type DataTableColumnDef } from '@/components/data/data-table';
import type { CreateUserDto, UserSummary } from '@/store/features/userApi';
import { RoleBadge } from '@/components/users/role-badge';
import { EmptyState } from '@/components/layout/empty-state';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/layout/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

function rowBelongsToSchool(row: UserSummary, schoolId: string): boolean {
  if (row.schoolId === schoolId) return true;
  if (row.branch?.schoolId === schoolId) return true;
  return false;
}

function canShowEditUser(
  actor: { id: string; role: string; schoolId: string | null; branchId?: string | null },
  row: UserSummary,
): boolean {
  if (actor.role === 'ADMIN') return true;
  if (row.id === actor.id) return false;
  if (row.role === 'ADMIN') return false;
  if (actor.role === 'SCHOOL_ADMIN' && actor.schoolId) {
    return rowBelongsToSchool(row, actor.schoolId);
  }
  if (actor.role === 'DIRECTOR' && actor.schoolId) {
    if (row.role === 'DIRECTOR') return false;
    return rowBelongsToSchool(row, actor.schoolId);
  }
  if (actor.role === 'BRANCH_DIRECTOR' && actor.branchId && actor.schoolId) {
    if (['ADMIN', 'DIRECTOR', 'SCHOOL_ADMIN', 'BRANCH_DIRECTOR'].includes(row.role)) {
      return false;
    }
    return row.branchId === actor.branchId;
  }
  return false;
}

interface SchoolUsersPanelProps {
  /** Required for school admin / director (scoped list). Ignored for platform admin. */
  schoolId: string;
}

const BASE_COLUMNS: DataTableColumnDef<UserSummary>[] = [
  {
    id: 'email',
    header: 'Email',
    headInset: 'start',
    cellInset: 'start',
    cellClassName: 'font-medium text-foreground',
    cell: (u) => u.email,
  },
  { id: 'name', header: 'Name', cellClassName: 'text-muted-foreground', cell: (u) => u.name ?? '–' },
];

const ROLE_COLUMN: DataTableColumnDef<UserSummary> = {
  id: 'role',
  header: 'Role',
  headInset: 'end',
  cellInset: 'end',
  cell: (u) => <RoleBadge role={u.role} />,
};

const LOCATION_COLUMN: DataTableColumnDef<UserSummary> = {
  id: 'location',
  header: 'School / branch',
  cellClassName: 'text-muted-foreground text-sm',
  cell: (u) => {
    const parts = [u.school?.name, u.branch?.name].filter(Boolean);
    return parts.length ? parts.join(' · ') : '—';
  },
};

export function SchoolUsersPanel({ schoolId }: SchoolUsersPanelProps) {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'ADMIN';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserSummary | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  /** Admin: assign unassigned director to a school from Edit dialog. */
  const [editDirectorSchoolId, setEditDirectorSchoolId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    name: '',
    role: 'TEACHER' as 'DIRECTOR' | 'BRANCH_DIRECTOR' | 'TEACHER',
  });
  const [createBranchId, setCreateBranchId] = useState('');
  /** Admin only: explicit school pick; defaults to first school when unset. */
  const [createSchoolId, setCreateSchoolId] = useState<string | null>(null);

  const { data: schools, isLoading: schoolsLoading } = useGetSchoolsQuery(undefined, {
    skip: !isAdmin,
  });

  /** Admin: optional school (assign later). Non-admin: page school scope. */
  const resolvedCreateSchoolId =
    (createSchoolId ?? (schoolId.trim() ? schoolId : null)) ?? '';
  const targetSchoolIdForCreate = isAdmin ? resolvedCreateSchoolId : schoolId;
  const adminSchoolSelectValue =
    createSchoolId ?? (schoolId.trim() ? schoolId : null) ?? '__none__';
  const teacherNeedsBranch =
    form.role === 'TEACHER' && Boolean(targetSchoolIdForCreate.trim());

  const {
    data: branchesForCreate,
    isLoading: branchesForCreateLoading,
    isFetching: branchesForCreateFetching,
  } = useGetBranchesQuery(targetSchoolIdForCreate, {
    skip:
      !targetSchoolIdForCreate ||
      (form.role !== 'TEACHER' && form.role !== 'BRANCH_DIRECTOR'),
  });

  const defaultTeacherBranchId = branchesForCreate?.[0]?.id ?? '';
  const effectiveTeacherBranchId =
    form.role === 'TEACHER' ? (createBranchId || defaultTeacherBranchId) : '';

  const { data: school, isLoading: schoolLoading } = useGetSchoolQuery(schoolId, {
    skip: !schoolId || isAdmin,
  });

  const {
    data: schoolUsers,
    isLoading: schoolUsersLoading,
    isError: schoolUsersError,
    error: schoolUsersErrorPayload,
  } = useGetSchoolUsersQuery(schoolId, {
    skip: !schoolId || isAdmin,
  });

  const {
    data: allUsers,
    isLoading: allUsersLoading,
    isError: allUsersError,
    error: allUsersErrorPayload,
  } = useGetAllUsersQuery(undefined, {
    skip: !isAdmin,
  });

  const users = isAdmin ? allUsers : schoolUsers;
  const usersLoading = isAdmin ? allUsersLoading : schoolUsersLoading;
  const usersError = isAdmin ? allUsersError : schoolUsersError;
  const usersErrorPayload = isAdmin ? allUsersErrorPayload : schoolUsersErrorPayload;

  const usersErrorMessage =
    usersError && usersErrorPayload && 'data' in usersErrorPayload
      ? (usersErrorPayload.data as { message?: string })?.message ?? 'Could not load users'
      : usersError
        ? 'Could not load users'
        : null;

  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';
  const isDirector = user?.role === 'DIRECTOR';
  const isBranchDirector = user?.role === 'BRANCH_DIRECTOR';

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const openInviteDialog = () => {
    const prop = schoolId.trim();
    if (isAdmin && prop) {
      setCreateSchoolId(prop);
    }
    setDialogOpen(true);
  };

  const columns = useMemo((): DataTableColumnDef<UserSummary>[] => {
    const dataCols = isAdmin ? [...BASE_COLUMNS, LOCATION_COLUMN, ROLE_COLUMN] : [...BASE_COLUMNS, ROLE_COLUMN];
    const canManageOthers = isAdmin || isSchoolAdmin || isDirector || isBranchDirector;
    if (!canManageOthers || !user) {
      return dataCols;
    }
    return [
      ...dataCols,
      {
        id: 'actions',
        header: '',
        headInset: 'end',
        cellInset: 'end',
        headerClassName: 'w-[96px]',
        cell: (row) =>
          canShowEditUser(user, row) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(row.name ?? '');
                setEditPassword('');
                setEditDirectorSchoolId(row.role === 'DIRECTOR' ? row.schoolId ?? null : null);
                setEditTarget(row);
              }}
            >
              Edit
            </Button>
          ) : null,
      },
    ];
  }, [isAdmin, isSchoolAdmin, isDirector, isBranchDirector, user]);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editName.trim()) return;
    const desiredDirectorSchool = editDirectorSchoolId ?? '';
    const currentDirectorSchool = editTarget.schoolId ?? '';
    const patchDirectorSchool =
      isAdmin &&
      editTarget.role === 'DIRECTOR' &&
      desiredDirectorSchool !== currentDirectorSchool;
    try {
      await updateUser({
        id: editTarget.id,
        body: {
          name: editName.trim(),
          ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
          ...(patchDirectorSchool ? { schoolId: desiredDirectorSchool } : {}),
        },
      }).unwrap();
      setEditTarget(null);
      setEditDirectorSchoolId(null);
      toast('User updated');
    } catch (err) {
      toastError(err, 'Failed to update user');
    }
  };

  const canCreateDirector = isAdmin;
  const canCreateBranchDirector = isAdmin || isDirector || isSchoolAdmin;
  const canCreateTeacher = isAdmin || isSchoolAdmin || isDirector || isBranchDirector;

  const closeInviteDialog = () => {
    setDialogOpen(false);
    setCreateSchoolId(null);
    setCreateBranchId('');
    setForm({ email: '', name: '', role: 'TEACHER' });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.name.trim()) return;
    const scopeSchoolId = isAdmin
      ? targetSchoolIdForCreate.trim() || undefined
      : schoolId.trim();
    if (!isAdmin && !scopeSchoolId) return;
    if (teacherNeedsBranch && !effectiveTeacherBranchId) {
      toast('Select a branch', 'error');
      return;
    }
    try {
      const data: CreateUserDto = {
        email: form.email.trim(),
        name: form.name.trim(),
        role: form.role,
        ...(scopeSchoolId ? { schoolId: scopeSchoolId } : {}),
      };
      if (form.role === 'TEACHER' && effectiveTeacherBranchId) {
        data.branchId = effectiveTeacherBranchId;
      } else if (
        form.role === 'BRANCH_DIRECTOR' &&
        createBranchId &&
        createBranchId !== '__pool__'
      ) {
        data.branchId = createBranchId;
      }
      await createUser({
        ...(isAdmin && !scopeSchoolId ? {} : { schoolId: scopeSchoolId! }),
        data,
      }).unwrap();
      closeInviteDialog();
      toast('User created');
    } catch (err) {
      toastError(err, 'Failed to create user');
    }
  };

  if (!isAdmin && !schoolId) {
    return null;
  }

  if (!isAdmin && (schoolLoading || !school)) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const pageTitle = isAdmin ? 'All users' : school!.name;
  const pageDescription = isAdmin
    ? 'Everyone in the platform (no school filter).'
    : 'Users';

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          canCreateDirector || canCreateBranchDirector || canCreateTeacher ? (
            <Button onClick={openInviteDialog} disabled={isAdmin && schoolsLoading}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add user
            </Button>
          ) : null
        }
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeInviteDialog())}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add user</DialogTitle>
              <DialogDescription>
                {isAdmin
                  ? 'School and branch are optional — assign them later if you prefer. Email verification flow applies when enabled.'
                  : 'Creates the account in this school. They can set a password when email verification is enabled.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="admin-invite-school">School (optional)</Label>
                  {schoolsLoading ? (
                    <div className="h-10 animate-pulse rounded-md bg-muted" />
                  ) : (
                    <Select
                      value={adminSchoolSelectValue}
                      onValueChange={(v) => {
                        if (v === '__none__') {
                          setCreateSchoolId(null);
                        } else if (v) {
                          setCreateSchoolId(v);
                        }
                        setCreateBranchId('');
                      }}
                    >
                      <SelectTrigger id="admin-invite-school" className="w-full">
                        <SelectValue placeholder="Assign later" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Assign later</SelectItem>
                        {(schools ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor={`invite-email-${targetSchoolIdForCreate || 'x'}`}>Email</Label>
                <Input
                  id={`invite-email-${targetSchoolIdForCreate || 'x'}`}
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`invite-name-${targetSchoolIdForCreate || 'x'}`}>Name</Label>
                <Input
                  id={`invite-name-${targetSchoolIdForCreate || 'x'}`}
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`invite-role-${targetSchoolIdForCreate || 'x'}`}>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => {
                    const r = value as 'DIRECTOR' | 'BRANCH_DIRECTOR' | 'TEACHER';
                    setForm((f) => ({ ...f, role: r }));
                    if (r === 'BRANCH_DIRECTOR') {
                      setCreateBranchId('__pool__');
                    } else {
                      setCreateBranchId('');
                    }
                  }}
                >
                  <SelectTrigger id={`invite-role-${targetSchoolIdForCreate || 'x'}`} className="w-full">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {canCreateDirector && <SelectItem value="DIRECTOR">Director</SelectItem>}
                    {canCreateBranchDirector && (
                      <SelectItem value="BRANCH_DIRECTOR">Branch director</SelectItem>
                    )}
                    {canCreateTeacher && <SelectItem value="TEACHER">Teacher</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              {form.role === 'TEACHER' && (
                <div className="space-y-2">
                  <Label htmlFor={`invite-branch-${targetSchoolIdForCreate || 'x'}`}>Branch</Label>
                  {!targetSchoolIdForCreate.trim() ? (
                    <p className="text-sm text-muted-foreground">
                      Choose a school above to pick a branch, or leave both unset and assign later.
                    </p>
                  ) : branchesForCreate?.length ? (
                    <Select
                      value={createBranchId || defaultTeacherBranchId}
                      onValueChange={(v) => setCreateBranchId(v ?? '')}
                    >
                      <SelectTrigger id={`invite-branch-${targetSchoolIdForCreate || 'x'}`} className="w-full">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchesForCreate.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Add a branch under this school before inviting teachers to a branch.
                    </p>
                  )}
                </div>
              )}
              {form.role === 'BRANCH_DIRECTOR' && (
                <div className="space-y-2">
                  <Label htmlFor={`invite-branch-bd-${targetSchoolIdForCreate || 'x'}`}>
                    Branch (optional)
                  </Label>
                  {branchesForCreate?.length ? (
                    <Select
                      value={createBranchId || '__pool__'}
                      onValueChange={(v) => setCreateBranchId(v ?? '__pool__')}
                    >
                      <SelectTrigger
                        id={`invite-branch-bd-${targetSchoolIdForCreate || 'x'}`}
                        className="w-full"
                      >
                        <SelectValue placeholder="Pool or branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__pool__">
                          Pool — assign when a branch is created
                        </SelectItem>
                        {branchesForCreate.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No branches yet — user joins the pool and is assigned when a branch is created.
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeInviteDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isCreating ||
                  (teacherNeedsBranch &&
                    (branchesForCreateLoading ||
                      branchesForCreateFetching ||
                      !effectiveTeacherBranchId ||
                      (Array.isArray(branchesForCreate) && branchesForCreate.length === 0)))
                }
              >
                {isCreating ? 'Creating...' : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditDirectorSchoolId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleEditSave}>
            <DialogHeader>
              <DialogTitle>Edit user</DialogTitle>
              <DialogDescription>
                Update name and optionally set a new password. Only platform admins can edit their own
                account here; everyone else must ask a supervisor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Name</Label>
                <Input
                  id="edit-user-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-password">New password (optional)</Label>
                <Input
                  id="edit-user-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Minimum 8 characters when set.</p>
              </div>
              {isAdmin && editTarget?.role === 'DIRECTOR' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-director-school">School</Label>
                  {schoolsLoading ? (
                    <div className="h-10 animate-pulse rounded-md bg-muted" />
                  ) : (
                    <Select
                      value={editDirectorSchoolId ?? '__none__'}
                      onValueChange={(v) =>
                        setEditDirectorSchoolId(v === '__none__' ? null : (v ?? null))
                      }
                    >
                      <SelectTrigger id="edit-director-school" className="w-full">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {(schools ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Link this director to a school, or leave unassigned.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditTarget(null);
                  setEditDirectorSchoolId(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {usersError && usersErrorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{usersErrorMessage}</AlertDescription>
        </Alert>
      ) : usersLoading ? (
        <DataTable.Card>
          <DataTable.Table>
            <DataTable.Header>
              <DataTable.ColumnHeaderRow columns={columns} />
            </DataTable.Header>
            <DataTable.Body>
              <DataTable.SkeletonRows columns={columns.length} />
            </DataTable.Body>
          </DataTable.Table>
        </DataTable.Card>
      ) : !users?.length ? (
        <EmptyState
          icon={UserPlus}
          title="No users yet"
          description={
            isAdmin
              ? 'No accounts in the system yet.'
              : 'Add teachers to get started. Students are created when children are enrolled at a branch. The school director is assigned by a platform admin.'
          }
          action={
            canCreateDirector || canCreateBranchDirector || canCreateTeacher
              ? { label: 'Add user', onClick: openInviteDialog }
              : undefined
          }
        />
      ) : (
        <DataTable.Card>
          <DataTable.Table>
            <DataTable.Header>
              <DataTable.ColumnHeaderRow columns={columns} />
            </DataTable.Header>
            <DataTable.Body>
              <DataTable.ColumnRows data={users} columns={columns} getRowKey={(u) => u.id} />
            </DataTable.Body>
          </DataTable.Table>
        </DataTable.Card>
      )}
    </div>
  );
}
