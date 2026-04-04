'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppSelector } from '@/store/hooks';
import {
  useGetFormByUploaderQuery,
  useGetFormExpiryByTypeQuery,
  useGetFormSubmissionsQuery,
  type FormsBucket,
} from '@/store/features/analyticsApi';
import { useGetDocumentTypesQuery } from '@/store/features/documentTypeApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DataTable, type DataTableColumnDef } from '@/components/data/data-table';
import { DocumentExpiryStatusBadge } from '@/components/documents/document-expiry-status-badge';
import { TrendingUp, FileStack, Users, AlertTriangle } from 'lucide-react';

const ANALYTICS_ROLES = new Set([
  'ADMIN',
  'DIRECTOR',
  'SCHOOL_ADMIN',
  'BRANCH_DIRECTOR',
  'TEACHER',
]);

type Preset = 'today' | '7d' | '30d' | 'custom';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function rangeForPreset(preset: Preset, customFrom: string, customTo: string): { from: Date; to: Date } {
  const now = new Date();
  if (preset === 'today') {
    return { from: startOfDay(now), to: endOfDay(now) };
  }
  if (preset === '7d') {
    return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) };
  }
  if (preset === '30d') {
    return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) };
  }
  const from = customFrom ? new Date(`${customFrom}T00:00:00`) : startOfDay(addDays(now, -29));
  const to = customTo ? new Date(`${customTo}T23:59:59.999`) : endOfDay(now);
  return { from, to };
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  BRANCH_DIRECTOR: 'Branch director',
  DIRECTOR: 'School director',
  SCHOOL_ADMIN: 'School admin',
  ADMIN: 'Platform admin',
};

function scopeDescription(role: string | undefined): string {
  switch (role) {
    case 'ADMIN':
      return 'All schools — uploads and form status across the platform.';
    case 'DIRECTOR':
    case 'SCHOOL_ADMIN':
      return 'Your school — all branches.';
    case 'BRANCH_DIRECTOR':
      return 'Your branch — students, teachers, and facility documents.';
    case 'TEACHER':
      return 'Your branch — student (child) documents only.';
    default:
      return '';
  }
}

type ExpiryRow = {
  formName: string;
  total: number;
  active: number;
  nearExpiry: number;
  expired: number;
  noExpiry: number;
};

const EXPIRY_COLUMNS: DataTableColumnDef<ExpiryRow>[] = [
  {
    id: 'form',
    header: 'Form',
    headInset: 'start',
    cellInset: 'start',
    cellClassName: 'font-medium',
    cell: (r) => r.formName,
  },
  {
    id: 'active',
    header: 'Active',
    cellClassName: 'tabular-nums text-muted-foreground',
    cell: (r) => r.active,
  },
  {
    id: 'near',
    header: 'Near expiry',
    cellClassName: 'tabular-nums',
    cell: (r) => r.nearExpiry,
  },
  {
    id: 'expired',
    header: 'Expired',
    cellClassName: 'tabular-nums text-destructive',
    cell: (r) => r.expired,
  },
  {
    id: 'none',
    header: 'No expiry',
    headInset: 'end',
    cellInset: 'end',
    cellClassName: 'tabular-nums text-muted-foreground',
    cell: (r) => r.noExpiry,
  },
  {
    id: 'total',
    header: 'Total',
    headInset: 'end',
    cellInset: 'end',
    cellClassName: 'tabular-nums font-medium',
    cell: (r) => r.total,
  },
];

export function DashboardAnalytics() {
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role;

  const [preset, setPreset] = useState<Preset>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [bucket, setBucket] = useState<FormsBucket>('day');
  const [documentTypeId, setDocumentTypeId] = useState<string>('__all__');

  const skipQueries =
    !user ||
    !role ||
    !ANALYTICS_ROLES.has(role) ||
    (role === 'BRANCH_DIRECTOR' && !user.branchId) ||
    (role === 'TEACHER' && !user.branchId) ||
    ((role === 'DIRECTOR' || role === 'SCHOOL_ADMIN') && !user.schoolId);

  const { from, to } = useMemo(
    () => rangeForPreset(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const typeFilter = documentTypeId !== '__all__' ? documentTypeId : undefined;

  const { data: submissions, isLoading: subLoading } = useGetFormSubmissionsQuery(
    { from: fromIso, to: toIso, bucket, documentTypeId: typeFilter },
    { skip: skipQueries },
  );
  const { data: uploaders, isLoading: upLoading } = useGetFormByUploaderQuery(
    { from: fromIso, to: toIso, bucket, documentTypeId: typeFilter },
    { skip: skipQueries },
  );
  const { data: expiry, isLoading: expLoading } = useGetFormExpiryByTypeQuery(
    typeFilter ? { documentTypeId: typeFilter } : undefined,
    { skip: skipQueries },
  );

  const { data: docTypes } = useGetDocumentTypesQuery(
    { schoolId: user?.schoolId ?? undefined },
    { skip: skipQueries || !user },
  );

  const chartData = useMemo(() => {
    return (submissions?.buckets ?? []).map((b) => {
      const d = new Date(b.label);
      return {
        name:
          bucket === 'month'
            ? d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
            : bucket === 'week'
              ? `W ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
              : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: b.count,
      };
    });
  }, [submissions, bucket]);

  const barData = useMemo(() => {
    return (uploaders?.byRole ?? []).map((r) => ({
      name: ROLE_LABELS[r.role] ?? r.role,
      count: r.count,
    }));
  }, [uploaders]);

  const kpi = useMemo(() => {
    const totalSub = submissions?.buckets.reduce((s, b) => s + b.count, 0) ?? 0;
    const rows = expiry?.rows ?? [];
    const near = rows.reduce((s, r) => s + r.nearExpiry, 0);
    const expired = rows.reduce((s, r) => s + r.expired, 0);
    const active = rows.reduce((s, r) => s + r.active, 0);
    return { totalSub, near, expired, active };
  }, [submissions, expiry]);

  if (skipQueries) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl tracking-tight text-primary">Forms & documents</h2>
        <p className="max-w-2xl text-base text-muted-foreground">{scopeDescription(role)}</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Tabs
          value={preset}
          onValueChange={(v) => setPreset(v as Preset)}
          className="w-full lg:w-auto"
        >
          <TabsList className="grid h-9 w-full grid-cols-4 lg:w-[360px]">
            <TabsTrigger value="today" className="text-xs sm:text-sm">
              Today
            </TabsTrigger>
            <TabsTrigger value="7d" className="text-xs sm:text-sm">
              7 days
            </TabsTrigger>
            <TabsTrigger value="30d" className="text-xs sm:text-sm">
              30 days
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs sm:text-sm">
              Custom
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-end gap-4">
          {preset === 'custom' ? (
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dash-from" className="text-xs">
                  From
                </Label>
                <Input
                  id="dash-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-[140px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dash-to" className="text-xs">
                  To
                </Label>
                <Input
                  id="dash-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-[140px]"
                />
              </div>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label className="text-xs">Chart bucket</Label>
            <Select
              value={bucket}
              onValueChange={(v) => setBucket((v ?? 'day') as FormsBucket)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 min-w-[200px] flex-1">
            <Label className="text-xs">Form type</Label>
            <Select
              value={documentTypeId}
              onValueChange={(v) => setDocumentTypeId(v ?? '__all__')}
            >
              <SelectTrigger className="w-full min-w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All types</SelectItem>
                {(docTypes ?? []).map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Uploads in range</CardTitle>
            <FileStack className="h-4 w-4 text-primary/40" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{subLoading ? '—' : kpi.totalSub}</p>
            <p className="text-xs text-muted-foreground">Forms submitted (completed upload)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active (not near expiry)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{expLoading ? '—' : kpi.active}</p>
            <p className="text-xs text-muted-foreground">Documents with expiry &gt; 30 days out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Near expiry</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{expLoading ? '—' : kpi.near}</p>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-destructive">
              {expLoading ? '—' : kpi.expired}
            </p>
            <p className="text-xs text-muted-foreground">Past expiry date</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Submissions over time</CardTitle>
            <CardDescription className="text-base text-muted-foreground">Count of document uploads in the selected range</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[280px] w-full">
              {subLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading chart…
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No data in this range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillSubmissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: '0',
                        boxShadow: 'var(--elevation-popover)',
                        background: 'hsl(var(--card))',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      fill="url(#fillSubmissions)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Uploaded by</CardTitle>
            <CardDescription className="text-base text-muted-foreground">Uploader role in the same date range</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[280px] w-full">
              {upLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : barData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: '0',
                        boxShadow: 'var(--elevation-popover)',
                        background: 'hsl(var(--card))',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Forms by expiry status</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Counts per document type — status uses the same rules as the rest of the app (including{' '}
            <span className="whitespace-nowrap">“Near expiry”</span> within 30 days).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 bg-secondary/30 px-6 py-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Status badges</span>
            <span className="inline-flex items-center gap-1.5">
              <DocumentExpiryStatusBadge status="active" />
              <DocumentExpiryStatusBadge status="near_expiry" />
              <DocumentExpiryStatusBadge status="expired" />
              <DocumentExpiryStatusBadge status="no_expiry" />
            </span>
          </div>
          {expLoading ? (
            <DataTable.Table>
              <DataTable.Header>
                <DataTable.ColumnHeaderRow columns={EXPIRY_COLUMNS} />
              </DataTable.Header>
              <DataTable.Body>
                <DataTable.SkeletonRows columns={EXPIRY_COLUMNS.length} rows={4} />
              </DataTable.Body>
            </DataTable.Table>
          ) : !expiry?.rows.length ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No documents in scope.</p>
          ) : (
            <DataTable.Table>
              <DataTable.Header>
                <DataTable.ColumnHeaderRow columns={EXPIRY_COLUMNS} />
              </DataTable.Header>
              <DataTable.Body>
                <DataTable.ColumnRows
                  data={expiry.rows}
                  columns={EXPIRY_COLUMNS}
                  getRowKey={(r) => r.formName}
                />
              </DataTable.Body>
            </DataTable.Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
