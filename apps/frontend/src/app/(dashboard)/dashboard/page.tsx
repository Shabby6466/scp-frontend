'use client';

import { useAppSelector } from '@/store/hooks';
import { Shield, FileCheck, AlertTriangle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name ?? user?.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value="--"
          icon={<FileCheck className="h-5 w-5 text-blue-600" />}
          description="All uploaded documents"
        />
        <StatCard
          title="Valid"
          value="--"
          icon={<Shield className="h-5 w-5 text-green-600" />}
          description="Currently compliant"
        />
        <StatCard
          title="Expiring Soon"
          value="--"
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          description="Within 30 days"
        />
        <StatCard
          title="Expired"
          value="--"
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          description="Needs attention"
        />
      </div>

      <div className="rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Document management features will be available in upcoming phases.
        </p>
      </div>
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
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
        {description}
      </p>
    </div>
  );
}
