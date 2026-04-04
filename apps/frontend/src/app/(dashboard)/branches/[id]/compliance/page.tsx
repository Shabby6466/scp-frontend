'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  type ComplianceStudentRow,
  type ComplianceTeacherRow,
  useGetBranchCompliancePeopleQuery,
} from '@/store/features/branchApi';
import { PageBackLink } from '@/components/layout/page-back-link';
import { PageHeader } from '@/components/layout/page-header';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';
import { DataTable, type DataTableColumnDef } from '@/components/data/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InlineLoading } from '@/components/layout/inline-loading';

function teacherComplianceColumns(
  branchId: string,
): DataTableColumnDef<ComplianceTeacherRow>[] {
  const staffFrom = encodeURIComponent(`/branches/${branchId}`);
  return [
    {
      id: 'name',
      header: 'Name',
      headInset: 'start',
      cellInset: 'start',
      cellClassName: 'font-medium',
      cell: (row) => row.name,
    },
    {
      id: 'required',
      header: 'Required',
      headInset: 'end',
      headerClassName: 'text-right',
      cellInset: 'end',
      cellClassName: 'text-right tabular-nums',
      cell: (row) => row.requiredCount,
    },
    {
      id: 'uploaded',
      header: 'Uploaded',
      headInset: 'end',
      headerClassName: 'text-right',
      cellInset: 'end',
      cellClassName: 'text-right tabular-nums',
      cell: (row) => row.uploadedSatisfiedCount,
    },
    {
      id: 'missing',
      header: 'Missing',
      headInset: 'end',
      headerClassName: 'text-right',
      cellInset: 'end',
      cellClassName: 'text-right tabular-nums',
      cell: (row) => row.missingCount,
    },
    {
      id: 'actions',
      header: '',
      headInset: 'end',
      headerClassName: 'w-[140px]',
      cellInset: 'end',
      cell: (row) => (
        <Link
          href={`/staff/${row.userId}?from=${staffFrom}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          View forms
        </Link>
      ),
    },
  ];
}

function studentComplianceColumns(
  branchId: string,
): DataTableColumnDef<ComplianceStudentRow>[] {
  return [
    {
      id: 'student',
      header: 'Student',
      headInset: 'start',
      cellInset: 'start',
      cellClassName: 'font-medium',
      cell: (row) => row.name,
    },
    {
      id: 'guardian',
      header: 'Guardian',
      cellClassName: 'text-muted-foreground',
      cell: (row) => row.guardianName ?? row.guardianEmail ?? '—',
    },
    {
      id: 'required',
      header: 'Required',
      headInset: 'end',
      headerClassName: 'text-right',
      cellInset: 'end',
      cellClassName: 'text-right tabular-nums',
      cell: (row) => row.requiredCount,
    },
    {
      id: 'uploaded',
      header: 'Uploaded',
      headInset: 'end',
      headerClassName: 'text-right',
      cellInset: 'end',
      cellClassName: 'text-right tabular-nums',
      cell: (row) => row.uploadedSatisfiedCount,
    },
    {
      id: 'missing',
      header: 'Missing',
      headInset: 'end',
      headerClassName: 'text-right',
      cellInset: 'end',
      cellClassName: 'text-right tabular-nums',
      cell: (row) => row.missingCount,
    },
    {
      id: 'actions',
      header: '',
      headInset: 'end',
      headerClassName: 'w-[140px]',
      cellInset: 'end',
      cell: (row) => (
        <Link
          href={`/staff/${row.userId}?from=${encodeURIComponent(`/branches/${branchId}`)}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          View forms
        </Link>
      ),
    },
  ];
}

export default function BranchCompliancePage() {
  const params = useParams();
  const branchId = params.id as string;
  const teacherColumns = teacherComplianceColumns(branchId);
  const studentColumns = studentComplianceColumns(branchId);
  const { data, isLoading, isError } = useGetBranchCompliancePeopleQuery(branchId);

  if (isLoading) {
    return <InlineLoading message="Loading compliance…" />;
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageBackLink href="/dashboard" />
        <p className="text-sm text-destructive">Could not load compliance data for this branch.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBackLink href={`/branches/${branchId}`} />
      <PageHeader
        title="Compliance by person"
        description="Required document slots vs current uploads (non-expired) for teachers and students."
      />

      <Tabs defaultValue="teachers" className="gap-4">
        <TabsList variant="line" className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="teachers"
            className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:shadow-none"
          >
            Teachers ({data.teachers.length})
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:shadow-none"
          >
            Students ({data.students.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teachers" className="mt-0">
          <DataTable.Card>
            <DataTable.Table>
              <DataTable.Header>
                <DataTable.ColumnHeaderRow columns={teacherColumns} />
              </DataTable.Header>
              <DataTable.Body>
                {data.teachers.length === 0 ? (
                  <DataTable.Row>
                    <DataTable.Cell
                      colSpan={teacherColumns.length}
                      className="text-center text-muted-foreground"
                      inset="both"
                    >
                      No teachers in this branch.
                    </DataTable.Cell>
                  </DataTable.Row>
                ) : (
                  <DataTable.ColumnRows
                    data={data.teachers}
                    columns={teacherColumns}
                    getRowKey={(row) => row.userId}
                  />
                )}
              </DataTable.Body>
            </DataTable.Table>
          </DataTable.Card>
        </TabsContent>

        <TabsContent value="students" className="mt-0">
          <DataTable.Card>
            <DataTable.Table>
              <DataTable.Header>
                <DataTable.ColumnHeaderRow columns={studentColumns} />
              </DataTable.Header>
              <DataTable.Body>
                {data.students.length === 0 ? (
                  <DataTable.Row>
                    <DataTable.Cell
                      colSpan={studentColumns.length}
                      className="text-center text-muted-foreground"
                      inset="both"
                    >
                      No students in this branch.
                    </DataTable.Cell>
                  </DataTable.Row>
                ) : (
                  <DataTable.ColumnRows
                    data={data.students}
                    columns={studentColumns}
                    getRowKey={(row) => row.userId}
                  />
                )}
              </DataTable.Body>
            </DataTable.Table>
          </DataTable.Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
