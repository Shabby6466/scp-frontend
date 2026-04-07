'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { useGetSchoolsQuery } from '@/store/features/schoolApi';
import { useGetBranchesQuery } from '@/store/features/branchApi';
import {
  useGetDocumentTypesQuery,
  useCreateDocumentTypeMutation,
  useUpdateDocumentTypeMutation,
} from '@/store/features/documentTypeApi';
import type { DocumentType } from '@/store/features/documentTypeApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast, toastError } from '@/lib/toast';
import { PageBackLink } from '@/components/layout/page-back-link';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';
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
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/layout/page-header';

const ROLE_OPTIONS = ['BRANCH_DIRECTOR', 'TEACHER', 'STUDENT'] as const;
const RENEWAL_OPTIONS = ['NONE', 'ANNUAL', 'BIENNIAL'] as const;

function canAssignTarget(actorRole: string, targetRole: string): boolean {
  if (actorRole === 'ADMIN') return targetRole !== 'ADMIN' && targetRole !== 'DIRECTOR';
  if (actorRole === 'DIRECTOR') {
    return targetRole === 'BRANCH_DIRECTOR' || targetRole === 'TEACHER' || targetRole === 'STUDENT';
  }
  if (actorRole === 'BRANCH_DIRECTOR') {
    return targetRole === 'TEACHER' || targetRole === 'STUDENT';
  }
  return false;
}

function scopeLabel(dt: DocumentType): string {
  if (!dt.schoolId) return 'Platform';
  const school = dt.school?.name ?? 'School';
  if (!dt.branchId) return `${school} · All branches`;
  const br = dt.branch?.name ?? 'Branch';
  return `${school} · ${br}`;
}

export default function DocumentTypesPage() {
  const authUser = useAppSelector((state) => state.auth.user);
  const isAdmin = authUser?.role === 'ADMIN';
  const canManage =
    authUser?.role === 'ADMIN' ||
    authUser?.role === 'DIRECTOR' ||
    authUser?.role === 'BRANCH_DIRECTOR';

  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState<string>('TEACHER');
  const [renewalCreate, setRenewalCreate] = useState<string>('NONE');
  const [adminCreateSchoolId, setAdminCreateSchoolId] = useState<string>('');
  const [adminCreateBranchId, setAdminCreateBranchId] = useState<string>('');

  const [filterSchoolId, setFilterSchoolId] = useState<string>('');
  const [filterBranchId, setFilterBranchId] = useState<string>('');

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<DocumentType | null>(null);
  const [editName, setEditName] = useState('');
  const [editTargetRole, setEditTargetRole] = useState<string>('TEACHER');
  const [editRenewal, setEditRenewal] = useState<string>('NONE');
  const [editMandatory, setEditMandatory] = useState(true);

  const { data: schools = [] } = useGetSchoolsQuery(undefined, { skip: !isAdmin });
  const { data: filterBranches = [] } = useGetBranchesQuery(filterSchoolId, {
    skip: !isAdmin || !filterSchoolId,
  });
  const { data: createBranches = [] } = useGetBranchesQuery(adminCreateSchoolId, {
    skip: !isAdmin || !adminCreateSchoolId,
  });

  const listParams = useMemo(() => {
    if (isAdmin) {
      const p: { schoolId?: string; branchId?: string } = {};
      if (filterSchoolId) p.schoolId = filterSchoolId;
      if (filterBranchId) p.branchId = filterBranchId;
      return p;
    }
    return {};
  }, [isAdmin, filterSchoolId, filterBranchId]);

  const { data: documentTypes = [], isLoading } = useGetDocumentTypesQuery(listParams, {
    skip: !canManage,
  });

  const [createDocumentType, { isLoading: creating }] = useCreateDocumentTypeMutation();
  const [updateDocumentType, { isLoading: updating }] = useUpdateDocumentTypeMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    if (isAdmin && !adminCreateSchoolId) {
      toastError(new Error('Select a school'), 'School required');
      return;
    }
    try {
      await createDocumentType({
        name,
        targetRole,
        renewalPeriod: renewalCreate,
        ...(isAdmin && adminCreateSchoolId
          ? {
              schoolId: adminCreateSchoolId,
              ...(adminCreateBranchId ? { branchId: adminCreateBranchId } : {}),
            }
          : {}),
      }).unwrap();
      toast('Document type created');
      setName('');
      setRenewalCreate('NONE');
    } catch (error) {
      toastError(error, 'Failed to create document type');
    }
  };

  const openEdit = (dt: DocumentType) => {
    setEditRow(dt);
    setEditName(dt.name);
    setEditTargetRole(dt.targetRole ?? 'TEACHER');
    setEditRenewal(dt.renewalPeriod ?? 'NONE');
    setEditMandatory(dt.isMandatory);
    setEditOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow || !editName.trim()) return;
    if (!canAssignTarget(authUser?.role ?? '', editTargetRole)) {
      toastError(new Error('Invalid role'), 'Cannot set this target role');
      return;
    }
    try {
      await updateDocumentType({
        id: editRow.id,
        body: {
          name: editName.trim(),
          renewalPeriod: editRenewal,
          isMandatory: editMandatory,
          targetRole: editTargetRole,
        },
      }).unwrap();
      toast('Document type updated');
      setEditOpen(false);
      setEditRow(null);
    } catch (error) {
      toastError(error, 'Failed to update');
    }
  };

  const columns: DataTableColumnDef<DocumentType>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        headInset: 'start',
        cellInset: 'start',
        cellClassName: 'font-medium text-foreground',
        cell: (dt) => dt.name,
      },
      {
        id: 'targetRole',
        header: 'Target role',
        cellClassName: 'text-muted-foreground text-sm',
        cell: (dt) => (dt.targetRole ?? '—').replaceAll('_', ' '),
      },
      {
        id: 'scope',
        header: 'Scope',
        cellClassName: 'text-muted-foreground text-sm max-w-[240px]',
        cell: (dt) => scopeLabel(dt),
      },
      {
        id: 'renewal',
        header: 'Renewal',
        cellClassName: 'text-muted-foreground text-sm',
        cell: (dt) => dt.renewalPeriod ?? '—',
      },
      {
        id: 'mandatory',
        header: 'Required',
        cell: (dt) => (dt.isMandatory ? 'Yes' : 'No'),
      },
      {
        id: 'actions',
        header: '',
        headInset: 'end',
        cellInset: 'end',
        cell: (dt) =>
          canManage ? (
            <Button type="button" size="sm" variant="outline" onClick={() => openEdit(dt)}>
              Edit
            </Button>
          ) : null,
      },
    ],
    [canManage],
  );

  if (!canManage) {
    return (
      <div className="space-y-2">
        <PageBackLink href="/dashboard" />
        <p className="text-sm text-muted-foreground">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageBackLink href="/dashboard" />
      <PageHeader
        title="Document types"
        description="Create and edit requirement types. Directors manage school-wide types; branch directors can add types for their branch. Assign people from Teachers or Students."
      />

      <Card>
        <CardHeader>
          <CardTitle>Create document type</CardTitle>
          <CardDescription>
            New types appear in the table below. Then assign them on{' '}
            <Link href="/school/teachers" className="text-primary underline-offset-4 hover:underline">
              Teachers
            </Link>{' '}
            or{' '}
            <Link href="/school/students" className="text-primary underline-offset-4 hover:underline">
              Students
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreate}>
            {isAdmin ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-school">School</Label>
                  <Select
                    value={adminCreateSchoolId || '__none__'}
                    onValueChange={(v) => {
                      setAdminCreateSchoolId(v === '__none__' ? '' : (v ?? ''));
                      setAdminCreateBranchId('');
                    }}
                  >
                    <SelectTrigger id="admin-school">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select school</SelectItem>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-branch">Branch (optional)</Label>
                  <Select
                    value={adminCreateBranchId || '__all__'}
                    onValueChange={(v) =>
                      setAdminCreateBranchId(v === '__all__' ? '' : (v ?? ''))
                    }
                    disabled={!adminCreateSchoolId}
                  >
                    <SelectTrigger id="admin-branch">
                      <SelectValue placeholder="School-wide (all branches)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">School-wide (all branches)</SelectItem>
                      {createBranches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave branch empty for a type that applies to the whole school.
                  </p>
                </div>
              </div>
            ) : authUser?.role === 'BRANCH_DIRECTOR' ? (
              <p className="text-sm text-muted-foreground">
                Types you create are scoped to <strong>your branch</strong> only.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Types you create apply to <strong>all branches</strong> in your school.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doc-name">Document type name</Label>
                <Input
                  id="doc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Annual ID verification"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-role">Applies to role</Label>
                <select
                  id="target-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {ROLE_OPTIONS.filter((role) => canAssignTarget(authUser!.role, role)).map((role) => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewal-create">Renewal</Label>
                <select
                  id="renewal-create"
                  value={renewalCreate}
                  onChange={(e) => setRenewalCreate(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {RENEWAL_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={creating || (isAdmin && !adminCreateSchoolId)}>
                {creating ? 'Saving…' : 'Create document type'}
              </Button>
              <Link href="/school/teachers" className={cn(buttonVariants({ variant: 'outline' }))}>
                Assign on Teachers
              </Link>
              <Link href="/school/students" className={cn(buttonVariants({ variant: 'outline' }))}>
                Assign on Students
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your document types</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Filter by school and/or branch. Leave filters empty to load all.'
              : 'Types you are allowed to manage for your school or branch.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Filter by school</Label>
                <Select
                  value={filterSchoolId || '__all__'}
                  onValueChange={(v) => {
                    setFilterSchoolId(v === '__all__' ? '' : (v ?? ''));
                    setFilterBranchId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All schools</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Filter by branch</Label>
                <Select
                  value={filterBranchId || '__all__'}
                  onValueChange={(v) => setFilterBranchId(v === '__all__' ? '' : (v ?? ''))}
                  disabled={!filterSchoolId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All branches in school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All branches</SelectItem>
                    {filterBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

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
          ) : !documentTypes.length ? (
            <p className="text-sm text-muted-foreground">No document types match your filters.</p>
          ) : (
            <DataTable.Card className="border-0 shadow-none">
              <DataTable.Table>
                <DataTable.Header>
                  <DataTable.ColumnHeaderRow columns={columns} />
                </DataTable.Header>
                <DataTable.Body>
                  <DataTable.ColumnRows
                    data={documentTypes}
                    columns={columns}
                    getRowKey={(dt) => dt.id}
                  />
                </DataTable.Body>
              </DataTable.Table>
            </DataTable.Card>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditRow(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditSave}>
            <DialogHeader>
              <DialogTitle>Edit document type</DialogTitle>
              <DialogDescription>Update labels and rules. Scope (school/branch) is fixed after creation.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-target">Target role</Label>
                <select
                  id="edit-target"
                  value={editTargetRole}
                  onChange={(e) => setEditTargetRole(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {ROLE_OPTIONS.filter((role) => canAssignTarget(authUser!.role, role)).map(
                    (role) => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ')}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-renewal">Renewal</Label>
                <select
                  id="edit-renewal"
                  value={editRenewal}
                  onChange={(e) => setEditRenewal(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {RENEWAL_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-mandatory"
                  checked={editMandatory}
                  onCheckedChange={(c) => setEditMandatory(!!c)}
                />
                <Label htmlFor="edit-mandatory" className="font-normal">
                  Mandatory by default when assigned
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
