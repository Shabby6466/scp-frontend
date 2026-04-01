'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetTeachersQuery, useCreateUserMutation } from '@/store/features/userApi';
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
import { DataTable, type DataTableColumnDef } from '@/components/data-table';
import type { UserSummary } from '@/store/features/userApi';
import { EmptyState } from '@/components/empty-state';
import { PageBackLink } from '@/components/page-back-link';
import { PageHeader } from '@/components/page-header';
import { sanitizeFromPath } from '@/lib/safe-from-path';
import { toast, toastError } from '@/lib/toast';
import { GraduationCap, UserPlus } from 'lucide-react';

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
 * Teachers directory for **school directors** and **branch directors** (school context from the signed-in user).
 * Prefer this route over `/schools/:id/teachers`, which is for platform and school admins.
 */
export default function SchoolTeachersForDirectorsPage() {
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const schoolId = user?.schoolId ?? user?.school?.id ?? '';
  const isDirector = user?.role === 'DIRECTOR';
  const isBranchDirector = user?.role === 'BRANCH_DIRECTOR';
  const canUsePage = isDirector || isBranchDirector;

  const { data: teachers, isLoading } = useGetTeachersQuery(undefined, {
    skip: !schoolId || !canUsePage,
  });
  const { data: branches } = useGetBranchesQuery(schoolId, {
    skip: !schoolId || !canUsePage,
  });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: '', name: '' });
  const [branchId, setBranchId] = useState('');

  const resolvedBranchId = isBranchDirector
    ? (user?.branchId ?? '')
    : (branchId || branches?.[0]?.id || '');

  const from = sanitizeFromPath(searchParams.get('from'));
  const backHref = from
    ? from
    : isBranchDirector && user?.branchId
      ? `/branches/${user.branchId}`
      : '/dashboard';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.name.trim() || !schoolId || !resolvedBranchId) return;
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

  if (!canUsePage) {
    return (
      <p className="text-sm text-muted-foreground">
        Only school directors and branch directors can open this page.
      </p>
    );
  }

  if (!schoolId) {
    return (
      <p className="text-sm text-muted-foreground">
        Your account is not linked to a school. Contact a platform administrator.
      </p>
    );
  }

  const hasBranches = !!branches?.length;
  const showBranchPicker = isDirector && hasBranches;

  return (
    <div className="space-y-6">
      <PageBackLink href={backHref} />

      <PageHeader
        title="Teachers"
        description="Invite and view teachers in your school (director view)."
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
                Create a user with role <strong>TEACHER</strong>. Invite flow stays the same as user creation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {showBranchPicker ? (
                <div className="space-y-2">
                  <Label htmlFor="teacher-branch">Branch</Label>
                  <Select value={resolvedBranchId} onValueChange={(v) => setBranchId(v ?? '')}>
                    <SelectTrigger id="teacher-branch" className="w-full">
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
              ) : isBranchDirector ? (
                <p className="text-sm text-muted-foreground">
                  Teachers will be added to your branch.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a branch from the Branches page (and assign a branch director) before inviting
                  teachers.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="teacher-email">Email</Label>
                <Input
                  id="teacher-email"
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-name">Name</Label>
                <Input
                  id="teacher-name"
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
      ) : !teachers?.length ? (
        <EmptyState
          icon={GraduationCap}
          title="No teachers yet"
          description="Invite teachers by branch. Branch directors are not listed here — add them from the Branches page for your school."
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
