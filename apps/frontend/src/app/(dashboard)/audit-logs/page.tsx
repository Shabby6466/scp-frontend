'use client';

import { useState } from 'react';
import { useGetAuditLogsQuery } from '@/store/features/auditApi';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const { data, isLoading } = useGetAuditLogsQuery({
    page,
    limit: 25,
    ...(actionFilter ? { action: actionFilter } : {}),
  });

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading audit logs...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {data?.total ?? 0} total entries
        </p>
      </div>

      <div className="flex gap-3">
        <input
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="overflow-hidden rounded-lg border dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Action</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">User ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Entity ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Details</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white dark:divide-gray-800 dark:bg-gray-950">
            {data?.items.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800">
                    <ClipboardList className="h-3 w-3" />
                    {entry.action}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {entry.userId.slice(0, 12)}...
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {entry.entityId ? `${entry.entityId.slice(0, 12)}...` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {entry.details ? (entry.details as Record<string, unknown>).path as string ?? '—' : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {(!data?.items || data.items.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No audit log entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {data.page} of {data.pages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
