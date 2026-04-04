'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useGetBranchesQuery } from '@/store/features/branchApi';
import { useGetSchoolUsersQuery } from '@/store/features/userApi';
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
import { GraduationCap } from 'lucide-react';

export default function SchoolStudentsRedirectPage() {
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const schoolId = user?.schoolId ?? user?.school?.id ?? '';
  const isDirector = user?.role === 'DIRECTOR';
  const isBranchDirector = user?.role === 'BRANCH_DIRECTOR';
  const canUsePage = isDirector || isBranchDirector || user?.role === 'SCHOOL_ADMIN';

  const from = sanitizeFromPath(searchParams.get('from'));
  const backHref = from ? from : '/dashboard';

  const { data: usersPage, isLoading } = useGetSchoolUsersQuery(
    { schoolId },
    { skip: !schoolId || !canUsePage },
  );
  const users = usersPage?.data ?? [];
  const { data: branches = [] } = useGetBranchesQuery(schoolId, {
    skip: !schoolId || !canUsePage,
  });
  const { data: studentDocTypes = [] } = useGetDocumentTypesQuery(
    { schoolId, targetRole: 'STUDENT' },
    { skip: !schoolId || !canUsePage },
  );
  const [assignDocumentTypeUsers, { isLoading: isAssigning }] = useAssignDocumentTypeUsersMutation();

  const [filterBranchId, setFilterBranchId] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState('');

  const students = users.filter((u) => {
    if (u.role !== 'STUDENT') return false;
    if (isBranchDirector && user?.branchId && u.branchId !== user.branchId) return false;
    const branchOk = filterBranchId === 'ALL' ? true : (u.branchId ?? '') === filterBranchId;
    const q = search.trim().toLowerCase();
    const matches =
      q === '' ||
      u.email.toLowerCase().includes(q) ||
      (u.name ?? '').toLowerCase().includes(q) ||
      (u.branch?.name ?? '').toLowerCase().includes(q);
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

  const columns: DataTableColumnDef<(typeof students)[number]>[] = [
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
      cell: (s) => s.branch?.name ?? '—',
    },
  ];

  if (!canUsePage) {
    return (
      <div className="space-y-2">
        <PageBackLink href={backHref} />
        <p className="text-sm text-muted-foreground">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBackLink href={backHref} />
      <PageHeader title="Students" description="Filter students and assign document requirements." />

      <DataTable.Card
        title="Assign document requirements"
        description="Select rows or assign to all filtered students."
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
