'use client';

import { useAppSelector } from '@/store/hooks';
import { useGetDocumentStatsQuery } from '@/store/features/documentApi';
import { Shield, FileCheck, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: stats, isLoading } = useGetDocumentStatsQuery(
    user?.schoolId ? { schoolId: user.schoolId } : undefined,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Welcome back, {user?.name ?? user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/documents">
            <Button variant="outline" size="sm">
              <FileCheck className="mr-1 h-4 w-4" /> Documents
            </Button>
          </Link>
          <Link href="/document-types">
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-1 h-4 w-4" /> Types
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={isLoading ? '...' : String(stats?.total ?? 0)}
          icon={<FileCheck className="h-5 w-5 text-blue-600" />}
          description="All uploaded documents"
        />
        <StatCard
          title="Valid"
          value={isLoading ? '...' : String(stats?.valid ?? 0)}
          icon={<Shield className="h-5 w-5 text-green-600" />}
          description="Currently compliant"
        />
        <StatCard
          title="Expiring Soon"
          value={isLoading ? '...' : String(stats?.expiringSoon ?? 0)}
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          description="Within 30 days"
        />
        <StatCard
          title="Expired"
          value={isLoading ? '...' : String(stats?.expired ?? 0)}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          description="Needs attention"
        />
      </div>

      {stats && stats.expired > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {stats.expired} document{stats.expired > 1 ? 's have' : ' has'} expired and
              require{stats.expired === 1 ? 's' : ''} immediate attention.
            </p>
          </div>
        </div>
      )}

      {stats && stats.expiringSoon > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              {stats.expiringSoon} document{stats.expiringSoon > 1 ? 's' : ''} will expire
              within 30 days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{description}</p>
    </div>
  );
}
