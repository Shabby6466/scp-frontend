'use client';

import { useGetHeatmapQuery, useGetAuditReadinessQuery } from '@/store/features/complianceApi';
import { useAppSelector } from '@/store/hooks';
import { Shield, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getComplianceColor(percent: number): string {
  if (percent >= 90) return 'bg-green-500';
  if (percent >= 70) return 'bg-yellow-500';
  if (percent > 0) return 'bg-red-500';
  return 'bg-gray-300 dark:bg-gray-700';
}

function getComplianceTextColor(percent: number): string {
  if (percent >= 90) return 'text-green-700 dark:text-green-400';
  if (percent >= 70) return 'text-yellow-700 dark:text-yellow-400';
  return 'text-red-700 dark:text-red-400';
}

export default function CompliancePage() {
  const user = useAppSelector((s) => s.auth.user);
  const schoolId = user?.role !== 'SUPERADMIN' ? user?.schoolId ?? undefined : undefined;
  const { data: heatmap, isLoading: heatmapLoading } = useGetHeatmapQuery(
    schoolId ? { schoolId } : undefined,
  );
  const { data: readiness, isLoading: readinessLoading } = useGetAuditReadinessQuery(
    schoolId ? { schoolId } : undefined,
  );

  const docTypeNames = [...new Set(heatmap?.map((c) => c.documentTypeName) ?? [])];
  const locations = [
    ...new Map(
      heatmap?.map((c) => [
        `${c.schoolId}-${c.branchId ?? ''}`,
        { schoolName: c.schoolName, branchName: c.branchName, schoolId: c.schoolId, branchId: c.branchId },
      ]) ?? [],
    ).values(),
  ];

  const handleExport = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';
    const params = new URLSearchParams();
    if (schoolId) params.set('schoolId', schoolId);
    window.open(`${backendUrl}/export/audit-zip?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Compliance Overview
        </h2>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-1 h-4 w-4" /> Export Audit Pack
        </Button>
      </div>

      {/* Audit Readiness Score */}
      <div className="rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Audit Readiness
          </h3>
        </div>
        {readinessLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : readiness ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                    strokeDasharray={`${readiness.score}, 100`}
                    className={readiness.score >= 90 ? 'stroke-green-500' : readiness.score >= 70 ? 'stroke-yellow-500' : 'stroke-red-500'}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
                  {readiness.score}%
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {readiness.totalValid} of {readiness.totalRequired} mandatory documents are valid
                </p>
                {readiness.missing.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {readiness.missing.map((m) => (
                      <div key={m.documentTypeName} className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {m.documentTypeName}: no valid documents
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Risk Heatmap */}
      <div className="rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Risk Heatmap
        </h3>
        {heatmapLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : heatmap && heatmap.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Location
                  </th>
                  {docTypeNames.map((name) => (
                    <th key={name} className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {locations.map((loc) => (
                  <tr key={`${loc.schoolId}-${loc.branchId ?? ''}`}>
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                      {loc.schoolName}
                      {loc.branchName && <span className="text-gray-400"> / {loc.branchName}</span>}
                    </td>
                    {docTypeNames.map((dtName) => {
                      const cell = heatmap.find(
                        (c) =>
                          c.schoolId === loc.schoolId &&
                          c.branchId === loc.branchId &&
                          c.documentTypeName === dtName,
                      );
                      const pct = cell?.compliancePercent ?? 0;
                      return (
                        <td key={dtName} className="px-3 py-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={`h-6 w-12 rounded ${getComplianceColor(pct)}`}
                              title={`${pct}% (${cell?.valid ?? 0}/${cell?.total ?? 0} valid)`}
                            />
                            <span className={`text-xs font-medium ${getComplianceTextColor(pct)}`}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-green-500" /> &gt;90%</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-yellow-500" /> 70-90%</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-500" /> &lt;70%</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-gray-300 dark:bg-gray-700" /> No data</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No compliance data available yet.</p>
        )}
      </div>
    </div>
  );
}
