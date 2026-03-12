'use client';

import { useState, useRef } from 'react';
import { useGetDocumentsQuery, useUploadDocumentMutation, useLazyGetDownloadUrlQuery } from '@/store/features/documentApi';
import { useGetDocumentTypesQuery } from '@/store/features/documentTypeApi';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  VALID: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  EXPIRED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  ARCHIVED: { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30' },
} as const;

export default function DocumentsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const canUpload = ['SUPERADMIN', 'SCHOOL_ADMIN', 'BRANCH_DIRECTOR'].includes(user?.role ?? '');
  const { data, isLoading } = useGetDocumentsQuery();
  const { data: docTypes } = useGetDocumentTypesQuery();
  const [uploadDoc, { isLoading: uploading }] = useUploadDocumentMutation();
  const [triggerDownload] = useLazyGetDownloadUrlQuery();
  const fileRef = useRef<HTMLInputElement>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [schoolId, setSchoolId] = useState(user?.schoolId ?? '');
  const [expiresAt, setExpiresAt] = useState('');

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !selectedTypeId || !schoolId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentTypeId', selectedTypeId);
    formData.append('schoolId', schoolId);
    if (user?.branchId) formData.append('branchId', user.branchId);
    if (expiresAt) formData.append('expiresAt', expiresAt);

    await uploadDoc(formData);
    setShowUpload(false);
    setSelectedTypeId('');
    setExpiresAt('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDownload = async (id: string) => {
    const result = await triggerDownload(id);
    if (result.data?.url) window.open(result.data.url, '_blank');
  };

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading documents...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {data?.total ?? 0} total documents
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="mr-1 h-4 w-4" /> Upload
          </Button>
        )}
      </div>

      {showUpload && (
        <div className="space-y-4 rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white">Upload Document</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select type...</option>
                {docTypes?.map((dt) => (
                  <option key={dt.id} value={dt.id}>{dt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">School ID</label>
              <input
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expires At</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">File</label>
              <input ref={fileRef} type="file" className="mt-1 block w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Version</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Expires</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Uploaded</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white dark:divide-gray-800 dark:bg-gray-950">
            {data?.items.map((doc) => {
              const cfg = STATUS_CONFIG[doc.status];
              const Icon = cfg.icon;
              return (
                <tr key={doc.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{doc.documentType.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <Icon className="h-3 w-3" /> {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">v{doc.version}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {(!data?.items || data.items.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
