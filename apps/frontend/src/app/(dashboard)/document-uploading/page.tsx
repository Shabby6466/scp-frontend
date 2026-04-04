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
import { DocumentChecklistRow } from '@/components/documents/document-checklist-row';
import { DocumentUploadMetadataDialog } from '@/components/documents/document-upload-metadata-dialog';
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
          <CardTitle>My Required Documents</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : !data?.items.length ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm font-medium">No documents assigned yet.</p>
              <p className="text-xs text-muted-foreground">Your administrator hasn&apos;t assigned any document requirements yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.items.map((item) => (
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
