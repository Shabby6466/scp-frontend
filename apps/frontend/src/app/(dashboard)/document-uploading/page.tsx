'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  useCompleteDocumentMutation,
  useExportPerFormPdfMutation,
  useGetAssignedSummaryQuery,
  useLazyGetDownloadUrlQuery,
  usePresignMutation,
} from '@/store/features/documentApi';
import { putFileToPresignedUrl } from '@/lib/presigned-upload';
import { toast, toastError } from '@/lib/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentChecklistRow } from '@/components/document-checklist-row';
import { DocumentUploadMetadataDialog } from '@/components/document-upload-metadata-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DocumentUploadingPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, refetch } = useGetAssignedSummaryQuery();
  const [presign] = usePresignMutation();
  const [completeDocument] = useCompleteDocumentMutation();
  const [getDownloadUrl] = useLazyGetDownloadUrlQuery();
  const [exportPdf] = useExportPerFormPdfMutation();

  const [uploadingTypeId, setUploadingTypeId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    documentTypeId: string;
    documentTypeLabel: string;
    file: File;
  } | null>(null);

  const handleUploadWithMeta = async (meta: { issuedAt: string; expiresAt: string | undefined }) => {
    if (!uploadTarget || !user?.id) return;
    setUploadingTypeId(uploadTarget.documentTypeId);
    try {
      const { uploadUrl, s3Key, uploadToken } = await presign({
        ownerUserId: user.id,
        documentTypeId: uploadTarget.documentTypeId,
        fileName: uploadTarget.file.name,
        mimeType: uploadTarget.file.type || 'application/octet-stream',
      }).unwrap();
      const response = await putFileToPresignedUrl(
        uploadUrl,
        uploadTarget.file,
        uploadTarget.file.type || 'application/octet-stream',
        uploadToken,
      );
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      await completeDocument({
        ownerUserId: user.id,
        documentTypeId: uploadTarget.documentTypeId,
        s3Key,
        fileName: uploadTarget.file.name,
        mimeType: uploadTarget.file.type || 'application/octet-stream',
        sizeBytes: uploadTarget.file.size,
        issuedAt: meta.issuedAt,
        ...(meta.expiresAt ? { expiresAt: meta.expiresAt } : {}),
      }).unwrap();
      toast('Document uploaded');
      setUploadTarget(null);
      await refetch();
    } catch (error) {
      toastError(error, 'Upload failed');
    } finally {
      setUploadingTypeId(null);
    }
  };

  const handleDownload = async (docId: string) => {
    const url = await getDownloadUrl(docId).unwrap();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleExport = async (documentTypeId: string) => {
    if (!user?.id) return;
    try {
      const blob = await exportPdf({ ownerUserId: user.id, documentTypeId }).unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${documentTypeId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toastError(error, 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My document requirements</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">Assigned</p>
            <p className="text-2xl font-semibold">{data?.assignedCount ?? 0}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">Uploaded</p>
            <p className="text-2xl font-semibold">{data?.uploadedCount ?? 0}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-2xl font-semibold">{data?.remainingCount ?? 0}</p>
          </div>
        </CardContent>
      </Card>

      <DocumentUploadMetadataDialog
        open={!!uploadTarget}
        onOpenChange={(open) => {
          if (!open) setUploadTarget(null);
        }}
        documentTypeLabel={uploadTarget?.documentTypeLabel ?? ''}
        file={uploadTarget?.file ?? null}
        onSubmit={handleUploadWithMeta}
        isSubmitting={uploadTarget != null && uploadingTypeId === uploadTarget.documentTypeId}
      />

      <Card>
        <CardHeader>
          <CardTitle>Due documents</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="divide-y">
              {data?.items.map((item) => (
                <div key={item.documentType.id} className="space-y-2">
                  <DocumentChecklistRow
                    documentTypeName={item.documentType.name}
                    mandatory={true}
                    doc={item.latestDocument}
                    uploading={uploadingTypeId === item.documentType.id}
                    canVerify={false}
                    onUpload={(file) =>
                      setUploadTarget({
                        documentTypeId: item.documentType.id,
                        documentTypeLabel: item.documentType.name,
                        file,
                      })
                    }
                    onDownload={() => {
                      if (item.latestDocument) {
                        void handleDownload(item.latestDocument.id);
                      }
                    }}
                    onVerify={() => {}}
                  />
                  <div className="flex items-center gap-2 px-4 pb-3">
                    <Link
                      href={`/document-uploading/${item.documentType.id}`}
                      className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                    >
                      Per form view
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleExport(item.documentType.id)}
                    >
                      Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
