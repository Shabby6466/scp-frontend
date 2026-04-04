'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetSchoolUsersQuery, useCreateUserMutation } from '@/store/features/userApi';
import { useGetBranchesQuery } from '@/store/features/branchApi';
import { useAppSelector } from '@/store/hooks';
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
import type { UserSummary } from '@/store/features/userApi';
import { EmptyState } from '@/components/layout/empty-state';
import { PageBackLink } from '@/components/layout/page-back-link';
import { PageHeader } from '@/components/layout/page-header';
import { toast, toastError } from '@/lib/toast';
import { GraduationCap, UserPlus } from 'lucide-react';
import { InlineLoading } from '@/components/layout/inline-loading';

const TEACHER_COLUMNS: DataTableColumnDef<UserSummary>[] = [
  {
    id: 'email',
    header: 'Email',
    headInset: 'start',
    cellInset: 'start',
    cellClassName: 'font-medium text-foreground',
    cell: (t) => t.email,
  },
  {
    id: 'name',
    header: 'Name',
    headInset: 'end',
    cellInset: 'end',
    cellClassName: 'text-muted-foreground',
    cell: (t) => t.name ?? '–',
  },
  {
    id: 'role',
    header: 'Role',
    cellClassName: 'text-muted-foreground text-sm',
    cell: () => 'Teacher',
  },
  {
    id: 'branch',
    header: 'Branch',
    cellClassName: 'text-muted-foreground text-sm',
    cell: (t) => t.branch?.name ?? '—',
  },
];

/**
 * Teachers directory for **platform admins** and **school admins**, scoped by school id in the URL.
 */
export default function SchoolTeachersAdminPage() {
  const params = useParams();
  const schoolId = params.id as string;
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role;

  const canAccess =
    role === 'ADMIN' ||
    (role === 'SCHOOL_ADMIN' && user?.schoolId === schoolId);

  const { data: schoolUsers, isLoading } = useGetSchoolUsersQuery(schoolId, {
    skip: !schoolId || !canAccess,
  });
  const { data: branches } = useGetBranchesQuery(schoolId, {
    skip: !schoolId || !canAccess,
  });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '' });
  const [branchId, setBranchId] = useState('');

  const teachers = useMemo(
    () => schoolUsers?.filter((u) => u.role === 'TEACHER') ?? [],
    [schoolUsers],
  );

  const resolvedBranchId = branchId || branches?.[0]?.id || '';

  const backHref =
    role === 'ADMIN' ? `/schools/${schoolId}/branches` : '/dashboard';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.name.trim() || !resolvedBranchId) return;
    try {
      await createUser({
        schoolId,
        data: {
          email: form.email.trim(),
          name: form.name.trim(),
          role: 'TEACHER',
          schoolId,
          branchId: resolvedBranchId,
        },
      }).unwrap();
      setForm({ email: '', name: '' });
      setDialogOpen(false);
      toast('Invite sent');
    } catch (err) {
      toastError(err, 'Failed to send invite');
    }
  };

  if (!user) {
    return <InlineLoading message="Loading…" />;
  }

  if (!canAccess) {
    return (
      <p className="text-sm text-muted-foreground">
        You do not have access to this school&apos;s teachers list.
      </p>
    );
  }

  const hasBranches = !!branches?.length;
  const showBranchPicker = hasBranches;

  return (
    <div className="space-y-6">
      <PageBackLink href={backHref} />

      <PageHeader
        title="Teachers"
        description="Invite and view teachers for this school (admin view)."
        actions={
          <Button onClick={() => setDialogOpen(true)} disabled={!resolvedBranchId}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add user
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add user</DialogTitle>
              <DialogDescription>
                Create a user with role <strong>TEACHER</strong> for this school.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {showBranchPicker ? (
                <div className="space-y-2">
                  <Label htmlFor="admin-teacher-branch">Branch</Label>
                  <Select value={resolvedBranchId} onValueChange={(v) => setBranchId(v ?? '')}>
                    <SelectTrigger id="admin-teacher-branch" className="w-full">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches!.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a branch for this school before inviting teachers.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin-teacher-email">Email</Label>
                <Input
                  id="admin-teacher-email"
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-teacher-name">Name</Label>
                <Input
                  id="admin-teacher-name"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !resolvedBranchId}>
                {isCreating ? 'Sending...' : 'Create teacher user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <DataTable.Card>
          <DataTable.Table>
            <DataTable.Header>
              <DataTable.ColumnHeaderRow columns={TEACHER_COLUMNS} />
            </DataTable.Header>
            <DataTable.Body>
              <DataTable.SkeletonRows columns={TEACHER_COLUMNS.length} />
            </DataTable.Body>
          </DataTable.Table>
        </DataTable.Card>
      ) : !teachers.length ? (
        <EmptyState
          icon={GraduationCap}
          title="No teachers yet"
          description="Invite teachers by branch for this school."
          action={
            resolvedBranchId ? { label: 'Add user', onClick: () => setDialogOpen(true) } : undefined
          }
        />
      ) : (
        <DataTable.Card>
          <DataTable.Table>
            <DataTable.Header>
              <DataTable.ColumnHeaderRow columns={TEACHER_COLUMNS} />
            </DataTable.Header>
            <DataTable.Body>
              <DataTable.ColumnRows
                data={teachers}
                columns={TEACHER_COLUMNS}
                getRowKey={(t) => t.id}
              />
            </DataTable.Body>
          </DataTable.Table>
        </DataTable.Card>
      )}
    </div>
  );
}
