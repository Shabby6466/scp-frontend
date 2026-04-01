'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useGetBranchQuery, useGetBranchTeachersQuery } from '@/store/features/branchApi';
import { useGetChildrenQuery } from '@/store/features/childApi';
import { useGetDocumentsByBranchFacilityQuery } from '@/store/features/documentApi';
import { useAppSelector } from '@/store/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { PageBackLink } from '@/components/page-back-link';
import { PageHeader } from '@/components/page-header';
import { DataTable, type DataTableColumnDef } from '@/components/data-table';
import { DocumentExpiryStatusBadge } from '@/components/document-expiry-status-badge';
import { buttonVariants } from '@/lib/button-variants';
import { getDocumentExpiryStatus } from '@/lib/document-expiry-status';
import { cn } from '@/lib/utils';
import { Users, GraduationCap, FileCheck } from 'lucide-react';

function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function BranchDetailPage() {
  const params = useParams();
  const branchId = params.id as string;
  const user = useAppSelector((state) => state.auth.user);

  const { data: branch, isLoading: branchLoading } = useGetBranchQuery(branchId);
  const { data: children, isLoading: childrenLoading } = useGetChildrenQuery({ branchId });
  const { data: teachers, isLoading: teachersLoading } = useGetBranchTeachersQuery(branchId);
  const { data: facilityDocs, isLoading: facilityLoading } = useGetDocumentsByBranchFacilityQuery(
    branchId,
  );

  const canManage =
    user?.role === 'ADMIN' ||
    user?.role === 'SCHOOL_ADMIN' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'BRANCH_DIRECTOR';

  type ChildRow = NonNullable<typeof children>[number];
  type TeacherRow = NonNullable<typeof teachers>[number];
  type FacilityRow = NonNullable<typeof facilityDocs>[number];

  const childColumns: DataTableColumnDef<ChildRow>[] = [
    {
      id: 'name',
      header: 'Name',
      headInset: 'start',
      cellInset: 'start',
      cellClassName: 'font-medium text-foreground',
      cell: (c) => `${c.firstName} ${c.lastName}`,
    },
    {
      id: 'guardian',
      header: 'Guardian / login',
      cellClassName: 'max-w-55 truncate text-muted-foreground',
      cell: (c) => c.guardianName ?? c.guardianEmail ?? c.student?.email ?? '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      headInset: 'end',
      cellInset: 'end',
      headerClassName: 'w-32 text-right',
      cellClassName: 'text-right',
      cell: (c) => (
        <Link href={`/children/${c.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Open
        </Link>
      ),
    },
  ];

  const teacherColumns: DataTableColumnDef<TeacherRow>[] = [
    {
      id: 'name',
      header: 'Name',
      headInset: 'start',
      cellInset: 'start',
      cellClassName: 'font-medium text-foreground',
      cell: (t) => t.name ?? '—',
    },
    {
      id: 'email',
      header: 'Email',
      cellClassName: 'text-muted-foreground',
      cell: (t) => t.email,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (t) =>
        t.staffClearanceActive ? (
          <Badge variant="default">Active</Badge>
        ) : (
          <Badge variant="secondary">Pending clearances</Badge>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      headInset: 'end',
      cellInset: 'end',
      headerClassName: 'w-32 text-right',
      cellClassName: 'text-right',
      cell: (t) => (
        <Link
          href={`/staff/${t.id}?from=${encodeURIComponent(`/branches/${branchId}`)}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Documents
        </Link>
      ),
    },
  ];

  const facilityColumns: DataTableColumnDef<FacilityRow>[] = [
    {
      id: 'documentType',
      header: 'Document type',
      headInset: 'start',
      cellInset: 'start',
      cellClassName: 'font-medium text-foreground',
      cell: (d) => d.documentType?.name ?? 'Document',
    },
    {
      id: 'issued',
      header: 'Issuance',
      cellClassName: 'text-muted-foreground text-sm',
      cell: (d) => formatShortDate(d.issuedAt),
    },
    {
      id: 'expires',
      header: 'Expiry',
      cellClassName: 'tabular-nums text-muted-foreground text-sm',
      cell: (d) => formatShortDate(d.expiresAt),
    },
    {
      id: 'file',
      header: 'Document',
      headerClassName: 'max-w-50',
      cellClassName: 'max-w-50 truncate text-muted-foreground',
      cell: (d) => <span title={d.fileName}>{d.fileName}</span>,
    },
    {
      id: 'expiryStatus',
      header: 'Status',
      cell: (d) => (
        <DocumentExpiryStatusBadge status={getDocumentExpiryStatus(d.expiresAt)} />
      ),
    },
    {
      id: 'verified',
      header: 'Verified',
      headInset: 'end',
      cellInset: 'end',
      cell: (d) =>
        d.verifiedAt ? (
          <Badge variant="default">Yes</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        ),
    },
  ];

  if (branchLoading || !branch) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBackLink href={`/schools/${branch.schoolId}/branches`} />

      <PageHeader
        title={branch.name}
        description="Children, teachers, and facility documents for this location."
      />

      <Tabs defaultValue="children" className="gap-4">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0"
        >
          <TabsTrigger
            value="children"
            className="gap-2 rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:shadow-none"
          >
            <Users className="h-4 w-4" />
            Children
          </TabsTrigger>
          <TabsTrigger
            value="teachers"
            className="gap-2 rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:shadow-none"
          >
            <GraduationCap className="h-4 w-4" />
            Teachers
          </TabsTrigger>
          <TabsTrigger
            value="facility"
            className="gap-2 rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:shadow-none"
          >
            <FileCheck className="h-4 w-4" />
            Facility Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="mt-0">
          <DataTable.Card
            title="Children"
            description="Students enrolled at this branch. Open a row to manage documents and details."
            actions={
              canManage ? (
                <Link
                  href={`/branches/${branchId}/children/new`}
                  className={cn(buttonVariants({ size: 'sm' }))}
                >
                  Add child
                </Link>
              ) : undefined
            }
          >
            {childrenLoading ? (
              <DataTable.Table>
                <DataTable.Header>
                  <DataTable.ColumnHeaderRow columns={childColumns} />
                </DataTable.Header>
                <DataTable.Body>
                  <DataTable.SkeletonRows columns={childColumns.length} />
                </DataTable.Body>
              </DataTable.Table>
            ) : !children?.length ? (
              <DataTable.EmptyWrap>
                <EmptyState
                  icon={Users}
                  title="No children yet"
                  description={
                    canManage
                      ? 'Add a child to start tracking enrollment and required documents.'
                      : 'No students are registered at this branch yet.'
                  }
                  action={
                    canManage
                      ? { label: 'Add child', href: `/branches/${branchId}/children/new` }
                      : undefined
                  }
                />
              </DataTable.EmptyWrap>
            ) : (
              <DataTable.Table>
                <DataTable.Header>
                  <DataTable.ColumnHeaderRow columns={childColumns} />
                </DataTable.Header>
                <DataTable.Body>
                  <DataTable.ColumnRows data={children} columns={childColumns} getRowKey={(c) => c.id} />
                </DataTable.Body>
              </DataTable.Table>
            )}
          </DataTable.Card>
        </TabsContent>

        <TabsContent value="teachers" className="mt-0">
          <DataTable.Card
            title="Teachers"
            description="Teacher users assigned to this branch."
          >
            {teachersLoading ? (
              <DataTable.Table>
                <DataTable.Header>
                  <DataTable.ColumnHeaderRow columns={teacherColumns} />
                </DataTable.Header>
                <DataTable.Body>
                  <DataTable.SkeletonRows columns={teacherColumns.length} />
                </DataTable.Body>
              </DataTable.Table>
            ) : !teachers?.length ? (
              <DataTable.EmptyWrap>
                <EmptyState
                  icon={GraduationCap}
                  title="No teachers yet"
                  description="Add teacher users from the Teachers page and assign them to this branch."
                  action={
                    canManage
                      ? {
                          label: 'Open teachers',
                          href: `/school/teachers?from=${encodeURIComponent(`/branches/${branchId}`)}`,
                        }
                      : undefined
                  }
                />
              </DataTable.EmptyWrap>
            ) : (
              <DataTable.Table>
                <DataTable.Header>
                  <DataTable.ColumnHeaderRow columns={teacherColumns} />
                </DataTable.Header>
                <DataTable.Body>
                  <DataTable.ColumnRows data={teachers} columns={teacherColumns} getRowKey={(t) => t.id} />
                </DataTable.Body>
              </DataTable.Table>
            )}
          </DataTable.Card>
        </TabsContent>

        <TabsContent value="facility" className="mt-0">
          <DataTable.Card
            title="Facility documents"
            description="Permits, inspections, and site-level compliance files for this branch."
            actions={
              <Link
                href={`/branches/${branchId}/facility`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                Upload & manage
              </Link>
            }
          >
            {facilityLoading ? (
              <DataTable.Table>
                <DataTable.Header>
                  <DataTable.ColumnHeaderRow columns={facilityColumns} />
                </DataTable.Header>
                <DataTable.Body>
                  <DataTable.SkeletonRows columns={facilityColumns.length} />
                </DataTable.Body>
              </DataTable.Table>
            ) : !facilityDocs?.length ? (
              <DataTable.EmptyWrap>
                <EmptyState
                  icon={FileCheck}
                  title="No facility uploads yet"
                  description="Upload DOH permit, certificate of occupancy, safety plans, and other branch-level documents."
                  action={
                    canManage
                      ? { label: 'Go to facility documents', href: `/branches/${branchId}/facility` }
                      : undefined
                  }
                />
              </DataTable.EmptyWrap>
            ) : (
              <DataTable.Table>
                <DataTable.Header>
                  <DataTable.ColumnHeaderRow columns={facilityColumns} />
                </DataTable.Header>
                <DataTable.Body>
                  <DataTable.ColumnRows
                    data={facilityDocs}
                    columns={facilityColumns}
                    getRowKey={(d) => d.id}
                  />
                </DataTable.Body>
              </DataTable.Table>
            )}
          </DataTable.Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
