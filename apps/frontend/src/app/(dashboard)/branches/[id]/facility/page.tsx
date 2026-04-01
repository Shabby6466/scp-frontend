'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetBranchQuery } from '@/store/features/branchApi';
import { useGetDocumentsByBranchFacilityQuery } from '@/store/features/documentApi';
import { useGetDocumentTypesQuery } from '@/store/features/documentTypeApi';
import { toast, toastError } from '@/lib/toast';
import { putFileToPresignedUrl } from '@/lib/presigned-upload';
import { usePresignMutation, useCompleteDocumentMutation, useLazyGetDownloadUrlQuery, useVerifyDocumentMutation } from '@/store/features/documentApi';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentChecklistRow } from '@/components/document-checklist-row';
import { DocumentUploadMetadataDialog } from '@/components/document-upload-metadata-dialog';
import { PageBackLink } from '@/components/page-back-link';
import { PageHeader } from '@/components/page-header';
import { InlineLoading } from '@/components/inline-loading';

export default function FacilityDocsPage() {
  const params = useParams();
  const branchId = params.id as string;
  const user = useAppSelector((state) => state.auth.user);
  const [uploadingTypeId, setUploadingTypeId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    documentTypeId: string;
    documentTypeLabel: string;
    file: File;
  } | null>(null);

  const { data: branch } = useGetBranchQuery(branchId);
  const { data: documents } = useGetDocumentsByBranchFacilityQuery(branchId);
  const { data: docTypes } = useGetDocumentTypesQuery({ category: 'FACILITY' });
  const [presign] = usePresignMutation();
  const [completeDoc] = useCompleteDocumentMutation();
  const [getDownloadUrl] = useLazyGetDownloadUrlQuery();
  const [verifyDoc] = useVerifyDocumentMutation();

  const canVerify =
    user?.role === 'ADMIN' ||
    user?.role === 'SCHOOL_ADMIN' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'BRANCH_DIRECTOR';

  const docsByType = new Map(documents?.map((d) => [d.documentTypeId, d]) ?? []);

  const handleFileChosen = (documentTypeId: string, documentTypeLabel: string, file: File) => {
    setUploadTarget({ documentTypeId, documentTypeLabel, file });
  };

  const handleUploadWithMeta = async (meta: { issuedAt: string; expiresAt: string | undefined }) => {
    if (!uploadTarget) return;
    const { documentTypeId, file } = uploadTarget;
    setUploadingTypeId(documentTypeId);
    try {
      const { uploadUrl, s3Key, uploadToken } = await presign({
        category: 'FACILITY',
        entityId: branchId,
        documentTypeId,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      }).unwrap();

      const mime = file.type || 'application/octet-stream';
      const res = await putFileToPresignedUrl(uploadUrl, file, mime, uploadToken);
      if (!res.ok) throw new Error('Upload failed');

      await completeDoc({
        category: 'FACILITY',
        entityId: branchId,
        documentTypeId,
        s3Key,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        issuedAt: meta.issuedAt,
        ...(meta.expiresAt ? { expiresAt: meta.expiresAt } : {}),
      }).unwrap();
      setUploadTarget(null);
      toast('Document uploaded');
    } catch (err) {
      toastError(err, 'Upload failed');
    } finally {
      setUploadingTypeId(null);
    }
  };

  const handleDownload = async (docId: string) => {
    const url = (await getDownloadUrl(docId).unwrap()) as string;
    if (url) window.open(url, '_blank');
  };

  if (!branch) return <InlineLoading />;

  return (
    <div className="space-y-6">
      <PageBackLink href={`/branches/${branchId}`} />

      <PageHeader title={`Facility documents – ${branch.name}`} />

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
          <CardTitle className="text-base">Checklist</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
        <div className="divide-y">
          {docTypes?.map((dt) => {
            const doc = docsByType.get(dt.id);
            return (
              <DocumentChecklistRow
                key={dt.id}
                documentTypeName={dt.name}
                mandatory={dt.isMandatory}
                doc={doc}
                uploading={uploadingTypeId === dt.id}
                canVerify={canVerify}
                onUpload={(file) => handleFileChosen(dt.id, dt.name, file)}
                onDownload={() => doc && handleDownload(doc.id)}
                onVerify={() => doc && void verifyDoc(doc.id)}
              />
            );
          })}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
