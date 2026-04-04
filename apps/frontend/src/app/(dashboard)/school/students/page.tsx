'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useGetBranchesQuery } from '@/store/features/branchApi';
import {
  useGetSchoolUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} from '@/store/features/userApi';
import type { UserSummary } from '@/store/features/userApi';
import {
  useAssignDocumentTypeUsersMutation,
  useGetDocumentTypesQuery,
} from '@/store/features/documentTypeApi';
import { PageBackLink } from '@/components/layout/page-back-link';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumnDef } from '@/components/data/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/layout/empty-state';
import { sanitizeFromPath } from '@/lib/safe-from-path';
import { toast, toastError } from '@/lib/toast';
import { GraduationCap, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { canShowEditUser } from '@/lib/school-user-permissions';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';

function branchLabel(s: UserSummary, branches: { id: string; name: string }[]): string {
  return s.branch?.name ?? branches.find((b) => b.id === (s.branchId ?? ''))?.name ?? '—';
}

export default function SchoolStudentsPage() {
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const schoolId = user?.schoolId ?? user?.school?.id ?? '';
  const isDirector = user?.role === 'DIRECTOR';
  const isBranchDirector = user?.role === 'BRANCH_DIRECTOR';
  const canUsePage = isDirector || isBranchDirector;

  const from = sanitizeFromPath(searchParams.get('from'));
  const backHref = from ? from : '/dashboard';

  const { data: users = [], isLoading } = useGetSchoolUsersQuery(schoolId, {
    skip: !schoolId || !canUsePage,
  });
  const { data: branches = [] } = useGetBranchesQuery(schoolId, {
    skip: !schoolId || !canUsePage,
  });
  const { data: studentDocTypes = [] } = useGetDocumentTypesQuery(
    { schoolId, targetRole: 'STUDENT' },
    { skip: !schoolId || !canUsePage },
  );
  const [assignDocumentTypeUsers, { isLoading: isAssigning }] = useAssignDocumentTypeUsersMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const [filterBranchId, setFilterBranchId] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState('');

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({ email: '', name: '' });
  const [createBranchId, setCreateBranchId] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserSummary | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const resolvedBranchId = isBranchDirector
    ? (user?.branchId ?? '')
    : createBranchId || branches[0]?.id || '';

  const showBranchPicker = isDirector && branches.length > 0;

  const students = users.filter((u) => {
    if (u.role !== 'STUDENT') return false;
    if (isBranchDirector && user?.branchId && u.branchId !== user.branchId) return false;
    const branchOk = filterBranchId === 'ALL' ? true : (u.branchId ?? '') === filterBranchId;
    const q = search.trim().toLowerCase();
    const bname = branchLabel(u, branches).toLowerCase();
    const matches =
      q === '' ||
      u.email.toLowerCase().includes(q) ||
      (u.name ?? '').toLowerCase().includes(q) ||
      bname.includes(q);
    return branchOk && matches;
  });

  const assignToUsers = async (userIds: string[]) => {
    if (!selectedDocumentTypeId) {
      toastError(new Error('Select a document type first'), 'Missing document type');
      return;
    }
    if (userIds.length === 0) {
      toastError(new Error('Select at least one student'), 'No students selected');
      return;
    }
    try {
      await assignDocumentTypeUsers({
        documentTypeId: selectedDocumentTypeId,
        userIds,
      }).unwrap();
      toast('Document assigned');
      setSelectedStudentIds([]);
    } catch (err) {
      toastError(err, 'Failed to assign document');
    }
  };

  const staffFromPath = '/school/students';

  const columns = useMemo((): DataTableColumnDef<(typeof students)[number]>[] => {
    const base: DataTableColumnDef<(typeof students)[number]>[] = [
      {
        id: 'name',
        header: 'Name',
        headInset: 'start',
        cellInset: 'start',
        cellClassName: 'font-medium text-foreground',
        cell: (s) => s.name ?? '—',
      },
      {
        id: 'email',
        header: 'Email',
        cellClassName: 'text-muted-foreground',
        cell: (s) => s.email,
      },
      {
        id: 'branch',
        header: 'Branch',
        cellClassName: 'text-muted-foreground',
        cell: (s) => branchLabel(s, branches),
      },
    ];
    const actions: DataTableColumnDef<(typeof students)[number]> = {
      id: 'actions',
      header: 'Actions',
      headInset: 'end',
      cellInset: 'end',
      headerClassName: 'min-w-[180px]',
      cell: (s) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={`/staff/${s.id}?from=${encodeURIComponent(staffFromPath)}`}
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
          >
            Documents
          </Link>
          {user && canShowEditUser(user, s) ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditTarget(s);
                setEditName(s.name ?? '');
                setEditPassword('');
                setEditOpen(true);
              }}
            >
              Edit
            </Button>
          ) : null}
        </div>
      ),
    };
    return [...base, actions];
  }, [user, branches]);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editName.trim()) return;
    try {
      await updateUser({
        id: editTarget.id,
        body: {
          name: editName.trim(),
          ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
        },
      }).unwrap();
      setEditOpen(false);
      setEditTarget(null);
      toast('User updated');
    } catch (err) {
      toastError(err, 'Failed to update user');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.email.trim() || !studentForm.name.trim() || !schoolId || !resolvedBranchId) return;
    try {
      await createUser({
        schoolId,
        data: {
          email: studentForm.email.trim(),
          name: studentForm.name.trim(),
          role: 'STUDENT',
          schoolId,
          branchId: resolvedBranchId,
        },
      }).unwrap();
      setStudentForm({ email: '', name: '' });
      setAddDialogOpen(false);
      toast('Student created');
    } catch (err) {
      toastError(err, 'Failed to create student');
    }
  };

  if (!canUsePage) {
    return (
      <div className="space-y-2">
        <PageBackLink href={backHref} />
        <p className="text-sm text-muted-foreground">You do not have access to this page.</p>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="space-y-2">
        <PageBackLink href={backHref} />
        <p className="text-sm text-muted-foreground">
          Your account is not linked to a school. Contact a platform administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBackLink href={backHref} />
      <PageHeader
        title="Students"
        description="Assign required document types to students, invite new students, and open their files."
        actions={
          <Button onClick={() => setAddDialogOpen(true)} disabled={!resolvedBranchId}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add student
          </Button>
        }
      />

      <DataTable.Card
        title="Assign document requirements"
        description="Pick a document type below, select rows in the table, then assign — or assign to everyone matching your filters."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => void assignToUsers(selectedStudentIds)}
              disabled={isAssigning || selectedStudentIds.length === 0 || !selectedDocumentTypeId}
            >
              Assign to selected ({selectedStudentIds.length})
            </Button>
            <Button
              onClick={() => void assignToUsers(students.map((s) => s.id))}
              disabled={isAssigning || students.length === 0 || !selectedDocumentTypeId}
            >
              Assign to all filtered ({students.length})
            </Button>
          </>
        }
      >
        <div className="grid gap-3 border-b p-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="student-doc-type">Document type</Label>
            <Select
              value={selectedDocumentTypeId}
              onValueChange={(v) => setSelectedDocumentTypeId(v ?? '')}
            >
              <SelectTrigger id="student-doc-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {studentDocTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-branch-filter">Branch</Label>
            <Select
              value={filterBranchId}
              onValueChange={(v) => setFilterBranchId(v ?? 'ALL')}
            >
              <SelectTrigger id="student-branch-filter">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="student-search">Search</Label>
            <Input
              id="student-search"
              placeholder="Search by name, email, branch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </DataTable.Card>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditSave}>
            <DialogHeader>
              <DialogTitle>Edit student</DialogTitle>
              <DialogDescription>Update name or set a new password for {editTarget?.email}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-student-name">Name</Label>
                <Input
                  id="edit-student-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-student-password">New password (optional)</Label>
                <Input
                  id="edit-student-password"
                  type="password"
                  autoComplete="new-password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateStudent}>
            <DialogHeader>
              <DialogTitle>Add student</DialogTitle>
              <DialogDescription>Create a student account for your school and branch.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {showBranchPicker ? (
                <div className="space-y-2">
                  <Label htmlFor="student-branch-create">Branch</Label>
                  <Select value={resolvedBranchId} onValueChange={(v) => setCreateBranchId(v ?? '')}>
                    <SelectTrigger id="student-branch-create" className="w-full">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : isBranchDirector ? (
                <p className="text-sm text-muted-foreground">Students will be added to your branch.</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a branch under your school before inviting students.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="student-email">Email</Label>
                <Input
                  id="student-email"
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-name">Name</Label>
                <Input
                  id="student-name"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !resolvedBranchId}>
                {isCreating ? 'Creating…' : 'Create student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
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
      ) : !students.length ? (
        <EmptyState
          icon={GraduationCap}
          title="No students match your filters"
          description="Try a different branch or search keyword."
          action={
            resolvedBranchId ? { label: 'Add student', onClick: () => setAddDialogOpen(true) } : undefined
          }
        />
      ) : (
        <DataTable.Card>
          <DataTable.Table>
            <DataTable.Header>
              <DataTable.HeaderRow>
                <DataTable.Head inset="start" className="w-12">
                  <Checkbox
                    checked={
                      students.length > 0 && students.every((s) => selectedStudentIds.includes(s.id))
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...students.map((s) => s.id)])));
                      } else {
                        setSelectedStudentIds((prev) =>
                          prev.filter((id) => !students.some((s) => s.id === id)),
                        );
                      }
                    }}
                  />
                </DataTable.Head>
                {columns.map((col, idx) => (
                  <DataTable.Head
                    key={col.id}
                    inset={idx === columns.length - 1 ? 'end' : undefined}
                    className={col.headerClassName}
                  >
                    {col.header}
                  </DataTable.Head>
                ))}
              </DataTable.HeaderRow>
            </DataTable.Header>
            <DataTable.Body>
              {students.map((s) => (
                <DataTable.Row key={s.id}>
                  <DataTable.Cell inset="start" className="w-12">
                    <Checkbox
                      checked={selectedStudentIds.includes(s.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudentIds((prev) => Array.from(new Set([...prev, s.id])));
                        } else {
                          setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                        }
                      }}
                    />
                  </DataTable.Cell>
                  {columns.map((col, idx) => (
                    <DataTable.Cell
                      key={col.id}
                      inset={idx === columns.length - 1 ? 'end' : undefined}
                      className={col.cellClassName}
                    >
                      {col.cell(s)}
                    </DataTable.Cell>
                  ))}
                </DataTable.Row>
              ))}
            </DataTable.Body>
          </DataTable.Table>
        </DataTable.Card>
      )}
    </div>
  );
}
