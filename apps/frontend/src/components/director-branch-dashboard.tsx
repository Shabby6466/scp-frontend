'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  type BranchRecentDocument,
  useGetBranchDashboardSummaryQuery,
  useGetBranchRecentDocumentsQuery,
} from '@/store/features/branchApi';
import { useLazyGetDownloadUrlQuery } from '@/store/features/documentApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';
import { DataTable, type DataTableColumnDef } from '@/components/data-table';
import { DocumentExpiryStatusBadge } from '@/components/document-expiry-status-badge';
import { InlineLoading } from '@/components/inline-loading';
import { Button } from '@/components/ui/button';
import { formatDocumentDate, getDocumentExpiryStatus } from '@/lib/document-expiry-status';
import { FileText, Users } from 'lucide-react';

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)'];

function RecentDocumentOpenButton({
  documentId,
  fileName,
}: {
  documentId: string;
  fileName: string;
}) {
  const [getDownloadUrl] = useLazyGetDownloadUrlQuery();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto max-w-[min(100%,12rem)] truncate px-0 py-0 text-primary"
      title={fileName}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const url = (await getDownloadUrl(documentId).unwrap()) as string;
          if (url) window.open(url, '_blank');
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? 'Opening…' : fileName || 'Open'}
    </Button>
  );
}

const RECENT_DOCUMENT_COLUMNS: DataTableColumnDef<BranchRecentDocument>[] = [
  {
    id: 'name',
    header: 'Name',
    headInset: 'start',
    cellInset: 'start',
    cellClassName: 'font-medium',
    cell: (row) => row.documentTypeName,
  },
  {
    id: 'issued',
    header: 'Issuance',
    cellClassName: 'text-muted-foreground text-sm',
    cell: (row) => formatDocumentDate(row.issuedAt),
  },
  {
    id: 'expiry',
    header: 'Expiry',
    headInset: 'end',
    cellInset: 'end',
    cellClassName: 'text-muted-foreground text-sm',
    cell: (row) => formatDocumentDate(row.expiresAt),
  },
  {
    id: 'document',
    header: 'Document',
    cell: (row) => (
      <RecentDocumentOpenButton documentId={row.id} fileName={row.fileName} />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <DocumentExpiryStatusBadge status={getDocumentExpiryStatus(row.expiresAt)} />
    ),
  },
];

export function DirectorBranchDashboard({ branchId }: { branchId: string }) {
  const { data: summary, isLoading: sumLoading, isError: sumError } =
    useGetBranchDashboardSummaryQuery(branchId);
  const { data: recent, isLoading: recLoading } = useGetBranchRecentDocumentsQuery({
    branchId,
    limit: 20,
  });

  if (sumLoading || !summary) {
    return <InlineLoading message="Loading branch overview…" />;
  }

  if (sumError) {
    return (
      <p className="text-sm text-destructive">
        Could not load branch dashboard. You may not have access to this branch.
      </p>
    );
  }

  const enrollmentData = [
    { label: 'Students', count: summary.studentCount },
    { label: 'Teachers', count: summary.teacherCount },
  ];

  const { satisfiedSlots, missingSlots } = summary.compliance;
  const pieData = [
    { name: 'Satisfied', value: satisfiedSlots },
    { name: 'Missing', value: missingSlots },
  ];
  const pieHasData = satisfiedSlots + missingSlots > 0;

  const teacherCompleteRatio =
    summary.teachersConsidered > 0
      ? Math.round((summary.teachersWithAllRequiredForms / summary.teachersConsidered) * 100)
      : null;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Enrollment</CardTitle>
            <CardDescription>Students and teachers in this branch</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Compliance slots</CardTitle>
            <CardDescription>Required document slots satisfied vs missing (all categories)</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] pt-0">
            {pieHasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No required slots computed yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Teachers up to date
            </CardTitle>
            <CardDescription>Staff with profiles and all required forms current</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {summary.teachersConsidered === 0
                ? '—'
                : `${summary.teachersWithAllRequiredForms} / ${summary.teachersConsidered}`}
            </p>
            {teacherCompleteRatio != null && (
              <p className="mt-1 text-sm text-muted-foreground">{teacherCompleteRatio}% fully compliant</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Near expiry
            </CardTitle>
            <CardDescription>Forms expiring in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {summary.formsNearExpiryCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Across students, staff, and facility</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Latest forms</CardTitle>
            <CardDescription>Most recent uploads for this branch</CardDescription>
          </div>
          <Link
            href={`/branches/${branchId}/compliance`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Compliance by person
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recLoading ? (
            <DataTable.Table>
              <DataTable.Header>
                <DataTable.ColumnHeaderRow columns={RECENT_DOCUMENT_COLUMNS} />
              </DataTable.Header>
              <DataTable.Body>
                <DataTable.SkeletonRows columns={RECENT_DOCUMENT_COLUMNS.length} rows={4} />
              </DataTable.Body>
            </DataTable.Table>
          ) : !recent?.length ? (
            <DataTable.EmptyWrap>
              <p className="text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
            </DataTable.EmptyWrap>
          ) : (
            <DataTable.Table>
              <DataTable.Header>
                <DataTable.ColumnHeaderRow columns={RECENT_DOCUMENT_COLUMNS} />
              </DataTable.Header>
              <DataTable.Body>
                <DataTable.ColumnRows
                  data={recent}
                  columns={RECENT_DOCUMENT_COLUMNS}
                  getRowKey={(row) => row.id}
                />
              </DataTable.Body>
            </DataTable.Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
