'use client';

import { useMemo, useState } from 'react';
import { useGetSchoolQuery, useGetSchoolsQuery } from '@/store/features/schoolApi';
import { useGetBranchesQuery } from '@/store/features/branchApi';
import {
  useGetAllUsersQuery,
  useGetSchoolUsersQuery,
  useGetTeachersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useSearchUsersQuery,
} from '@/store/features/userApi';
import { UserSearchFilters, type UserFilters } from './user-search-filters';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { useAppSelector } from '@/store/hooks';
import { canShowEditUser } from '@/lib/school-user-permissions';

interface SchoolUsersPanelProps {
  /** Required for director / branch director scoped views. Ignored for platform admin. */
  schoolId: string;
  title?: string;
  description?: string;
  fixedRole?: UserSummary['role'];
  allowedCreateRoles?: Array<'DIRECTOR' | 'BRANCH_DIRECTOR' | 'TEACHER' | 'STUDENT'>;
  readOnly?: boolean;
  /**
   * Load via `GET /teachers` (session-scoped: branch teachers for students & branch directors;
   * all school teachers for directors). Use for student read-only teacher directory — avoids
   * `GET /schools/:id/users`, which is staff-only.
   */
  sessionTeachers?: boolean;
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
  headerClassName: 'min-w-[200px]',
  cellClassName: 'text-muted-foreground text-sm max-w-[300px] truncate',
  cell: (u) => {
    const parts = [u.school?.name, u.branch?.name].filter(Boolean);
    return parts.length ? parts.join(' · ') : '—';
  },
};

export function SchoolUsersPanel({
  schoolId,
  title,
  description,
  fixedRole,
  allowedCreateRoles,
  readOnly = false,
  sessionTeachers = false,
}: SchoolUsersPanelProps) {
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
    role: 'TEACHER' as 'DIRECTOR' | 'BRANCH_DIRECTOR' | 'TEACHER' | 'STUDENT',
  });
  const [createBranchId, setCreateBranchId] = useState('');
  const [search, setSearch] = useState('');
  /** Admin only: explicit school pick; defaults to first school when unset. */
  const [createSchoolId, setCreateSchoolId] = useState<string | null>(null);

  const [filters, setFilters] = useState<UserFilters>({
    query: '',
    role: 'ALL',
    branchId: 'ALL',
    staffClearanceActive: undefined,
  });
  const [page, setPage] = useState(1);
  const limit = 20;
  const debouncedQuery = useDebounce(filters.query, 400);

  const { data: schools, isLoading: schoolsLoading } = useGetSchoolsQuery(undefined, {
    skip: !isAdmin,
  });

  /** Admin: optional school (assign later). Non-admin: page school scope. */
  const resolvedCreateSchoolId =
    (createSchoolId ?? (schoolId.trim() ? schoolId : null)) ?? '';
  const targetSchoolIdForCreate = isAdmin ? resolvedCreateSchoolId : schoolId;
  const adminSchoolSelectValue =
    createSchoolId ?? (schoolId.trim() ? schoolId : null) ?? '__none__';
  const assigneeNeedsBranch =
    (form.role === 'TEACHER' || form.role === 'STUDENT') &&
    Boolean(targetSchoolIdForCreate.trim());

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
    skip: !schoolId || isAdmin || sessionTeachers,
  });

  const {
    data: schoolUsersResponse,
    isLoading: schoolUsersLoading,
    isError: schoolUsersError,
    error: schoolUsersErrorPayload,
  } = useGetSchoolUsersQuery(schoolId, {
    skip: !schoolId || isAdmin || sessionTeachers,
  });

  const {
    data: teachersFromSession,
    isLoading: teachersFromSessionLoading,
    isError: teachersFromSessionError,
    error: teachersFromSessionErrorPayload,
  } = useGetTeachersQuery(undefined, {
    skip: !sessionTeachers || isAdmin,
  });

  const {
    data: allUsersResponse,
    isLoading: allUsersLoading,
    isError: allUsersError,
    error: allUsersErrorPayload,
  } = useGetAllUsersQuery(
    { page, limit },
    {
      skip: !isAdmin,
    },
  );

  const {
    data: searchedUsersResponse,
    isLoading: searchedUsersLoading,
    isError: searchedUsersError,
    error: searchedUsersErrorPayload,
  } = useSearchUsersQuery({
    query: debouncedQuery || undefined,
    role: filters.role === 'ALL' ? undefined : (filters.role as any),
    branchId: filters.branchId === 'ALL' ? undefined : filters.branchId,
    staffClearanceActive: filters.staffClearanceActive,
    schoolId: isAdmin ? undefined : schoolId,
    page,
    limit,
  });

  const users = isAdmin
    ? allUsers
    : sessionTeachers
      ? teachersFromSession
      : schoolUsers;
  const usersLoading = isAdmin
    ? allUsersLoading
    : sessionTeachers
      ? teachersFromSessionLoading
      : schoolUsersLoading;
  const usersError = isAdmin
    ? allUsersError
    : sessionTeachers
      ? teachersFromSessionError
      : schoolUsersError;
  const usersErrorPayload = isAdmin
    ? allUsersErrorPayload
    : sessionTeachers
      ? teachersFromSessionErrorPayload
      : schoolUsersErrorPayload;

  const usersErrorMessage =
    usersError && usersErrorPayload && 'data' in usersErrorPayload
      ? (usersErrorPayload.data as { message?: string })?.message ?? 'Could not load users'
      : usersError
        ? 'Could not load users'
        : null;

  const isDirector = user?.role === 'DIRECTOR';
  const isBranchDirector = user?.role === 'BRANCH_DIRECTOR';

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const openInviteDialog = () => {
    const prop = schoolId.trim();
    if (isAdmin && prop) {
      setCreateSchoolId(prop);
    }
    const nextRole =
      fixedRole && roleOptions.includes(fixedRole as never)
        ? (fixedRole as 'DIRECTOR' | 'BRANCH_DIRECTOR' | 'TEACHER' | 'STUDENT')
        : ((roleOptions[0] ?? 'TEACHER') as
            | 'DIRECTOR'
            | 'BRANCH_DIRECTOR'
            | 'TEACHER'
            | 'STUDENT');
    setForm((f) => ({ ...f, role: nextRole }));
    setDialogOpen(true);
  };

  const roleOptions = useMemo<
    Array<'DIRECTOR' | 'BRANCH_DIRECTOR' | 'TEACHER' | 'STUDENT'>
  >(() => {
    if (allowedCreateRoles && allowedCreateRoles.length > 0) {
      return [...allowedCreateRoles];
    }
    if (isAdmin) return ['DIRECTOR', 'BRANCH_DIRECTOR', 'TEACHER', 'STUDENT'];
    if (isDirector) return ['BRANCH_DIRECTOR', 'TEACHER', 'STUDENT'];
    if (isBranchDirector) return ['TEACHER', 'STUDENT'];
    return [];
  }, [allowedCreateRoles, isAdmin, isDirector, isBranchDirector]);

  const columns = useMemo((): DataTableColumnDef<UserSummary>[] => {
    const baseCols =
      fixedRole != null
        ? isAdmin
          ? [...BASE_COLUMNS, LOCATION_COLUMN]
          : [...BASE_COLUMNS]
        : isAdmin
          ? [...BASE_COLUMNS, LOCATION_COLUMN, ROLE_COLUMN]
          : [...BASE_COLUMNS, ROLE_COLUMN];
    const canManageOthers = !readOnly && (isAdmin || isDirector || isBranchDirector);
    if (!canManageOthers || !user) {
      return baseCols;
    }
    return [
      ...baseCols,
      {
        id: 'actions',
        header: '',
        headInset: 'end',
        cellInset: 'end',
        headerClassName: 'w-[140px]',
        cellClassName: 'w-[140px]',
        cell: (row) => (
          <div className="flex gap-2">
            <Link 
              href={`/staff/${row.id}${schoolId ? `?from=/users` : ''}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View
            </Link>
            {canShowEditUser(user, row) && (
              <Button
                type="button"
                variant="ghost"
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
            )}
          </div>
        ),
      },
    ];
  }, [fixedRole, isAdmin, isDirector, isBranchDirector, readOnly, user]);

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

  const closeInviteDialog = () => {
    setDialogOpen(false);
    setCreateSchoolId(null);
    setCreateBranchId('');
    const nextDefaultRole =
      fixedRole && roleOptions.includes(fixedRole as never)
        ? (fixedRole as 'DIRECTOR' | 'BRANCH_DIRECTOR' | 'TEACHER' | 'STUDENT')
        : ((roleOptions[0] ?? 'TEACHER') as
            | 'DIRECTOR'
            | 'BRANCH_DIRECTOR'
            | 'TEACHER'
            | 'STUDENT');
    setForm({ email: '', name: '', role: nextDefaultRole });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.name.trim()) return;
    const scopeSchoolId = isAdmin
      ? targetSchoolIdForCreate.trim() || undefined
      : schoolId.trim();
    if (!isAdmin && !scopeSchoolId) return;
    if (assigneeNeedsBranch && !effectiveTeacherBranchId) {
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
      if (
        (form.role === 'TEACHER' || form.role === 'STUDENT') &&
        effectiveTeacherBranchId
      ) {
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

  if (!isAdmin && !schoolId && !sessionTeachers) {
    return null;
  }

  if (!isAdmin && !sessionTeachers && (schoolLoading || !school)) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!isAdmin && sessionTeachers && usersLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const allRows = users ?? [];
  const filteredUsers = allRows.filter((row) => {
    if (fixedRole && row.role !== fixedRole) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      row.email,
      row.name ?? '',
      row.role,
      row.school?.name ?? '',
      row.branch?.name ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });

  const pageTitle =
    title ?? (isAdmin ? 'All users' : sessionTeachers ? 'Teachers' : school!.name);
  const pageDescription =
    description ??
    (isAdmin
      ? 'Everyone in the platform (no school filter).'
      : sessionTeachers
        ? 'Teachers at your branch.'
        : 'Users');

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          !readOnly && roleOptions.length > 0 ? (
            <Button onClick={openInviteDialog} disabled={isAdmin && schoolsLoading}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add user
            </Button>
          ) : null
        }
      />

      <UserSearchFilters 
        schoolId={schoolId || undefined} 
        filters={filters} 
        onFiltersChange={(f) => {
          setFilters(f);
          setPage(1); // Reset page on filter change
        }} 
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
                {fixedRole ? (
                  <Input readOnly value={fixedRole.replace('_', ' ')} className="bg-muted/40" />
                ) : (
                  <Select
                    value={form.role}
                    onValueChange={(value) => {
                      const r = value as 'DIRECTOR' | 'BRANCH_DIRECTOR' | 'TEACHER' | 'STUDENT';
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
                      {roleOptions.includes('DIRECTOR') && (
                        <SelectItem value="DIRECTOR">Director</SelectItem>
                      )}
                      {roleOptions.includes('BRANCH_DIRECTOR') && (
                        <SelectItem value="BRANCH_DIRECTOR">Branch director</SelectItem>
                      )}
                      {roleOptions.includes('TEACHER') && (
                        <SelectItem value="TEACHER">Teacher</SelectItem>
                      )}
                      {roleOptions.includes('STUDENT') && (
                        <SelectItem value="STUDENT">Student</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {(form.role === 'TEACHER' || form.role === 'STUDENT') && (
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
                  (assigneeNeedsBranch &&
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
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="users-search">Search</Label>
            <Input
              id="users-search"
              placeholder="Search by email, name, role, school, or branch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {usersError && usersErrorMessage ? null : usersLoading ? (
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
      ) : !filteredUsers.length ? (
        <EmptyState
          icon={UserPlus}
          title="No users found"
          description={
            search.trim()
              ? 'No results match your search.'
              : isAdmin
                ? 'No accounts in the system yet.'
                : 'Add users to get started for this role.'
          }
          action={
            !readOnly && roleOptions.length > 0
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
              <DataTable.ColumnRows data={filteredUsers} columns={columns} getRowKey={(u) => u.id} />
            </DataTable.Body>
          </DataTable.Table>
        </DataTable.Card>
      )}
    </div>
  );
}
