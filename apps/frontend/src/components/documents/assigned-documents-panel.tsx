'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  useCompleteDocumentMutation,
  useExportPerFormPdfMutation,
  useGetAssignedSummaryQuery,
  useGetPerFormDetailQuery,
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

interface AssignedDocumentsPanelProps {
  ownerUserId: string;
  /** When set, show per-form detail (same data as legacy `/document-uploading/[type]`). */
  detailDocumentTypeId?: string | null;
}

export function AssignedDocumentsPanel({
  ownerUserId,
  detailDocumentTypeId,
}: AssignedDocumentsPanelProps) {
  const { data, isLoading, refetch } = useGetAssignedSummaryQuery();
  const [presign] = usePresignMutation();
  const [completeDocument] = useCompleteDocumentMutation();
  const [getDownloadUrl] = useLazyGetDownloadUrlQuery();
  const [exportPdf] = useExportPerFormPdfMutation();

  const { data: perFormDetail, isLoading: perFormLoading } = useGetPerFormDetailQuery(
    { ownerUserId, documentTypeId: detailDocumentTypeId ?? '' },
    { skip: !detailDocumentTypeId },
  );

  const [uploadingTypeId, setUploadingTypeId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    documentTypeId: string;
    documentTypeLabel: string;
    file: File;
  } | null>(null);

  const handleUploadWithMeta = async (meta: { issuedAt: string; expiresAt: string | undefined }) => {
    if (!uploadTarget || !ownerUserId) return;
    setUploadingTypeId(uploadTarget.documentTypeId);
    try {
      const { uploadUrl, s3Key, uploadToken } = await presign({
        ownerUserId,
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
        ownerUserId,
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
    try {
      const blob = await exportPdf({ ownerUserId, documentTypeId }).unwrap();
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

      {detailDocumentTypeId ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Form detail</CardTitle>
            <Link href="/my-documents" className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }))}>
              Close detail
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {perFormLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">Form</p>
                    <p className="font-medium">{perFormDetail?.documentType?.name ?? 'Unknown'}</p>
                  </div>
                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">File</p>
                    <p className="font-medium">
                      {perFormDetail?.latestDocument?.fileName ?? 'No upload yet'}
                    </p>
                  </div>
                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">Uploaded date</p>
                    <p className="font-medium">
                      {perFormDetail?.uploadedDate
                        ? new Date(perFormDetail.uploadedDate).toLocaleDateString()
                        : 'Not uploaded'}
                    </p>
                  </div>
                  <div className="rounded-md border p-4">
                    <p className="text-xs text-muted-foreground">Due date</p>
                    <p className="font-medium">
                      {perFormDetail?.dueDate
                        ? new Date(perFormDetail.dueDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-md border p-4 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Remaining time to expire</p>
                    <p className="font-medium">
                      {perFormDetail?.remainingDays == null
                        ? 'N/A'
                        : `${perFormDetail.remainingDays} day(s)`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void handleExport(detailDocumentTypeId)}>
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      perFormDetail?.latestDocument &&
                      void handleDownload(perFormDetail.latestDocument.id)
                    }
                    disabled={!perFormDetail?.latestDocument}
                  >
                    Open uploaded file
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

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
                  <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
                    <Link
                      href={`/my-documents?type=${encodeURIComponent(item.documentType.id)}`}
                      className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                    >
                      Form detail
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
