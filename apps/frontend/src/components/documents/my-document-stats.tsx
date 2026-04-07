'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useGetAssignedSummaryQuery } from '@/store/features/documentApi';
import { getDocumentExpiryStatus } from '@/lib/document-expiry-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';

const ROLE_DESCRIPTIONS: Record<string, { greeting: string; context: string }> = {
  TEACHER: {
    greeting: 'Your Compliance Status',
    context: 'Keep your documents up to date. Compliance affects your clearance status.',
  },
  STUDENT: {
    greeting: 'My Document Status',
    context: 'Make sure all required documents are submitted and current.',
  },
};

function StatCard({
  title,
  value,
  subtitle,
  href,
  variant = 'default',
  loading,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  href?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  loading?: boolean;
}) {
  const content = (
    <Card
      className={cn(
        'transition-all duration-200',
        href && 'cursor-pointer hover:shadow-md hover:-translate-y-px',
        variant === 'danger' && 'border-destructive/30 bg-destructive/5',
        variant === 'warning' && 'border-amber-500/30 bg-amber-500/5',
        variant === 'success' && 'border-emerald-500/30 bg-emerald-500/5',
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            'text-3xl font-bold tabular-nums',
            loading && 'animate-pulse text-muted-foreground',
            variant === 'danger' && 'text-destructive',
            variant === 'warning' && 'text-amber-600 dark:text-amber-400',
            variant === 'success' && 'text-emerald-600 dark:text-emerald-400',
          )}
        >
          {loading ? '—' : value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export function MyDocumentStats() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading } = useGetAssignedSummaryQuery();

  const stats = useMemo(() => {
    if (!data) return { uploaded: 0, pending: 0, expired: 0, nearExpiry: 0 };
    let expired = 0;
    let nearExpiry = 0;
    for (const item of data.items) {
      const doc = item.latestDocument;
      if (!doc) continue;
      const status = getDocumentExpiryStatus(doc.expiresAt);
      if (status === 'expired') expired++;
      else if (status === 'near_expiry') nearExpiry++;
    }
    return { uploaded: data.uploadedCount, pending: data.remainingCount, expired, nearExpiry };
  }, [data]);

  const role = user?.role ?? 'TEACHER';
  const desc = ROLE_DESCRIPTIONS[role] ?? ROLE_DESCRIPTIONS['TEACHER'];
  const allClear = !isLoading && stats.pending === 0 && stats.expired === 0 && stats.nearExpiry === 0 && stats.uploaded > 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{desc.greeting}</h2>
        <p className="text-sm text-muted-foreground">{desc.context}</p>
      </div>

      {allClear ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 py-10 text-center">
          <div className="text-4xl">✅</div>
          <div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">You&apos;re all caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              All {stats.uploaded} document{stats.uploaded !== 1 ? 's' : ''} are current. No action needed.
            </p>
          </div>
          <Link
            href="/document-uploading"
            className="text-xs text-emerald-700 dark:text-emerald-400 underline underline-offset-4 hover:opacity-80"
          >
            View documents →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Uploaded"
            value={stats.uploaded}
            subtitle="Documents on file"
            loading={isLoading}
            variant="success"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            subtitle="Required, not yet uploaded"
            href={stats.pending > 0 ? '/document-uploading' : undefined}
            loading={isLoading}
            variant={stats.pending > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Expired"
            value={stats.expired}
            subtitle="Past expiry date"
            href={stats.expired > 0 ? '/document-uploading' : undefined}
            loading={isLoading}
            variant={stats.expired > 0 ? 'danger' : 'default'}
          />
          <StatCard
            title="Near Expiry"
            value={stats.nearExpiry}
            subtitle="Expiring within 30 days"
            href={stats.nearExpiry > 0 ? '/document-uploading' : undefined}
            loading={isLoading}
            variant={stats.nearExpiry > 0 ? 'warning' : 'default'}
          />
        </div>
      )}
    </div>
  );
}
