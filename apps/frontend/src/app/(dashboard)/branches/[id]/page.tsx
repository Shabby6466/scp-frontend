'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGetBranchQuery, useGetBranchTeachersQuery } from '@/store/features/branchApi';
import { useGetSchoolUsersQuery } from '@/store/features/userApi';
import { useAppSelector } from '@/store/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/layout/empty-state';
import { PageBackLink } from '@/components/layout/page-back-link';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type DataTableColumnDef } from '@/components/data/data-table';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';
import { Users, GraduationCap } from 'lucide-react';

export default function BranchDetailPage() {
  const params = useParams();
  const branchId = params.id as string;
  const user = useAppSelector((state) => state.auth.user);

  const { data: branch, isLoading: branchLoading } = useGetBranchQuery(branchId);
  const { data: teachers, isLoading: teachersLoading } = useGetBranchTeachersQuery(branchId);
  const { data: schoolUsers, isLoading: schoolUsersLoading } = useGetSchoolUsersQuery(
    { schoolId: branch?.schoolId ?? '' },
    { skip: !branch?.schoolId },
  );

  const students = useMemo(
    () =>
      (schoolUsers?.data ?? []).filter(
        (u) => u.role === 'STUDENT' && u.branchId === branchId,
      ),
    [schoolUsers, branchId],
  );

  const canManage =
    user?.role === 'ADMIN' ||
    user?.role === 'SCHOOL_ADMIN' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'BRANCH_DIRECTOR';

  type StudentRow = (typeof students)[number];
  type TeacherRow = NonNullable<typeof teachers>[number];

  const studentColumns: DataTableColumnDef<StudentRow>[] = [
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
      id: 'actions',
      header: 'Actions',
      headInset: 'end',
      cellInset: 'end',
      headerClassName: 'w-32 text-right',
      cellClassName: 'text-right',
      cell: (s) => (
        <Link
          href={`/staff/${s.id}?from=${encodeURIComponent(`/branches/${branchId}`)}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Documents
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
        description="Students and teachers at this branch. Open Documents to view uploads and compliance."
      />

      <Tabs defaultValue="students" className="gap-4">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0"
        >
          <TabsTrigger
            value="students"
            className="gap-2 rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:shadow-none"
          >
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger
            value="teachers"
            className="gap-2 rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:shadow-none"
          >
            <GraduationCap className="h-4 w-4" />
            Teachers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-0">
          <DataTable.Card
            title="Students"
            description="Student accounts assigned to this branch."
            actions={
              canManage ? (
                <Link
                  href={`/school/students?from=${encodeURIComponent(`/branches/${branchId}`)}`}
                  className={cn(buttonVariants({ size: 'sm' }))}
                >
                  Manage students
                </Link>
              ) : undefined
            }
          >
            {schoolUsersLoading ? (
              <DataTable.Table>
                <DataTable.Header>
                  <DataTable.ColumnHeaderRow columns={studentColumns} />
                </DataTable.Header>
                <DataTable.Body>
                  <DataTable.SkeletonRows columns={studentColumns.length} />
                </DataTable.Body>
              </DataTable.Table>
            ) : !students.length ? (
              <DataTable.EmptyWrap>
                <EmptyState
                  icon={Users}
                  title="No students yet"
                  description="Add student users and assign them to this branch from the school directory."
                  action={
                    canManage
                      ? {
                          label: 'Open students',
                          href: `/school/students?from=${encodeURIComponent(`/branches/${branchId}`)}`,
                        }
                      : undefined
                  }
                />
              </DataTable.EmptyWrap>
            ) : (
              <DataTable.Table>
                <DataTable.Header>
                  <DataTable.ColumnHeaderRow columns={studentColumns} />
                </DataTable.Header>
                <DataTable.Body>
                  <DataTable.ColumnRows
                    data={students}
                    columns={studentColumns}
                    getRowKey={(s) => s.id}
                  />
                </DataTable.Body>
              </DataTable.Table>
            )}
          </DataTable.Card>
        </TabsContent>

        <TabsContent value="teachers" className="mt-0">
          <DataTable.Card title="Teachers" description="Teacher users assigned to this branch.">
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
                  <DataTable.ColumnRows
                    data={teachers}
                    columns={teacherColumns}
                    getRowKey={(t) => t.id}
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
