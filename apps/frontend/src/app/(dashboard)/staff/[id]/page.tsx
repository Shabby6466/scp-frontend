'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  useGetDocumentsByStaffQuery,
  usePresignMutation,
  useCompleteDocumentMutation,
  useLazyGetDownloadUrlQuery,
  useVerifyDocumentMutation,
} from '@/store/features/documentApi';
import { useGetDocumentTypesQuery } from '@/store/features/documentTypeApi';
import { toast, toastError } from '@/lib/toast';
import { putFileToPresignedUrl } from '@/lib/presigned-upload';
import { useAppSelector } from '@/store/hooks';
import { DataTable } from '@/components/data/data-table';
import { BulkActionToolbar } from '@/components/data/bulk-action-toolbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentChecklistRow } from '@/components/documents/document-checklist-row';
import { DocumentUploadMetadataDialog } from '@/components/documents/document-upload-metadata-dialog';
import { PageBackLink } from '@/components/layout/page-back-link';
import { PageHeader } from '@/components/layout/page-header';
import { sanitizeFromPath } from '@/lib/safe-from-path';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User as UserIcon, Mail, Building, Briefcase, FileText, CheckCircle2, Clock } from 'lucide-react';
import { RoleBadge } from '@/components/users/role-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function StaffDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherUserId = params.id as string;
  const user = useAppSelector((state) => state.auth.user);
  const from = sanitizeFromPath(searchParams.get('from'));

  const isOwnProfile = Boolean(user?.id && user.id === teacherUserId);

  const [uploadingTypeId, setUploadingTypeId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    documentTypeId: string;
    documentTypeLabel: string;
    file: File;
  } | null>(null);

  useEffect(() => {
    if (isOwnProfile && user?.id) {
      const q = from ? `?from=${encodeURIComponent(from)}` : '';
      router.replace(`/my-documents${q}`);
    }
  }, [isOwnProfile, user?.id, router, from]);

  const { data: documents } = useGetDocumentsByStaffQuery(teacherUserId, {
    skip: isOwnProfile,
  });
  const { data: docTypes } = useGetDocumentTypesQuery(
    { schoolId: user?.schoolId ?? undefined },
    { skip: !user?.schoolId || isOwnProfile },
  );
  const [presign] = usePresignMutation();
  const [completeDoc] = useCompleteDocumentMutation();
  const [getDownloadUrl] = useLazyGetDownloadUrlQuery();
  const [verifyDoc] = useVerifyDocumentMutation();
  const [verifyMany] = useVerifyManyMutation();
  const [nudge] = useNudgeMutation();

  if (isLoadingDetail || !userDetail) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-muted rounded" />
        <div className="h-32 bg-card border rounded-xl" />
        <div className="h-64 bg-card border rounded-xl" />
      </div>
    );
  }

  const canVerify =
    user?.role === 'ADMIN' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'BRANCH_DIRECTOR';
  const isBranchDirector = user?.role === 'BRANCH_DIRECTOR';

  const backHref = from
    ? from
    : isBranchDirector && user?.branchId
      ? `/branches/${user.branchId}`
      : '/dashboard';

  const docsByType = new Map(userDetail.ownerDocuments.map((d) => [d.documentTypeId, d]));

  const handleFileChosen = (documentTypeId: string, documentTypeLabel: string, file: File) => {
    setUploadTarget({ documentTypeId, documentTypeLabel, file });
  };

  const handleUploadWithMeta = async (meta: { issuedAt: string; expiresAt: string | undefined }) => {
    if (!uploadTarget) return;
    const { documentTypeId, file } = uploadTarget;
    setUploadingTypeId(documentTypeId);
    try {
      const { uploadUrl, s3Key, uploadToken } = await presign({
        ownerUserId: teacherUserId,
        documentTypeId,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
      }).unwrap();

      const mime = file.type || 'application/octet-stream';
      const res = await putFileToPresignedUrl(uploadUrl, file, mime, uploadToken);
      if (!res.ok) throw new Error('Upload failed');

      await completeDoc({
        ownerUserId: teacherUserId,
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

  if (isOwnProfile) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Opening My documents…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageBackLink href={backHref} />

      <PageHeader title="Staff documents" />

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

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg px-6">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-6">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="text-primary" size={18} />
                  Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userDetail.teacherProfile && (
                  <>
                    <DetailItem label="Subject Area" value={userDetail.teacherProfile.subjectArea} />
                    <DetailItem label="Employee Code" value={userDetail.teacherProfile.employeeCode} />
                    <DetailItem label="Joining Date" value={userDetail.teacherProfile.joiningDate ? new Date(userDetail.teacherProfile.joiningDate).toLocaleDateString() : '—'} />
                  </>
                )}
                {userDetail.studentProfile && (
                  <>
                    <DetailItem label="Roll Number" value={userDetail.studentProfile.rollNumber} />
                    <DetailItem label="Guardian Name" value={userDetail.studentProfile.guardianName} />
                    <DetailItem label="Guardian Phone" value={userDetail.studentProfile.guardianPhone} />
                  </>
                )}
                {userDetail.staffPosition && <DetailItem label="Position" value={userDetail.staffPosition} />}
                <DetailItem label="Member Since" value={new Date(userDetail.createdAt).toLocaleDateString()} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="text-primary" size={18} />
                  Compliance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">Verification Status</span>
                  <Badge variant={userDetail.ownerDocuments.every(d => d.verifiedAt) && userDetail.requiredDocTypes.length === userDetail.ownerDocuments.length ? "default" : "secondary"}>
                    {userDetail.ownerDocuments.every(d => d.verifiedAt) && userDetail.requiredDocTypes.length === userDetail.ownerDocuments.length ? "Compliant" : "Action Needed"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">Documents Uploaded</span>
                  <span className="text-sm font-medium">{userDetail.ownerDocuments.length} / {userDetail.requiredDocTypes.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="text-primary" size={18} />
                Document Checklist
              </CardTitle>
              <CardDescription>
                Required documents based on role and branch compliance policy.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {!userDetail.requiredDocTypes?.length ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <p className="text-sm font-medium text-muted-foreground">No document requirements assigned</p>
                  <p className="text-xs text-muted-foreground/60">An administrator can assign document types from the school settings.</p>
                </div>
              ) : (
                <DataTable.SelectionProvider dataIds={userDetail.ownerDocuments.filter(d => !d.verifiedAt).map(d => d.id)}>
                   <div className="divide-y divide-border/50">
                    {userDetail.requiredDocTypes.map((dt) => {
                      const doc = docsByType.get(dt.id);
                      return (
                        <div key={dt.id} className="flex items-center gap-2 px-4 group/row">
                          {canVerify && doc && !doc.verifiedAt && (
                            <DataTable.SelectionCell id={doc.id} />
                          )}
                          <div className={cn("flex-1", !canVerify || !doc || doc.verifiedAt ? "" : "pl-0")}>
                            <DocumentChecklistRow
                              documentTypeName={dt.name}
                              mandatory={dt.isMandatory}
                              doc={doc}
                              uploading={uploadingTypeId === dt.id}
                              canVerify={canVerify}
                              onUpload={(file) => handleFileChosen(dt.id, dt.name, file)}
                              onDownload={() => doc && handleDownload(doc.id)}
                              onVerify={() => doc && void verifyDoc(doc.id)}
                              onNudge={canVerify && !doc?.verifiedAt ? () => handleNudge(dt.id, dt.name) : undefined}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <BulkActionToolbar 
                    label="unverified documents" 
                    onVerify={handleVerifyMany} 
                  />
                </DataTable.SelectionProvider>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value?: string | null }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value || '—'}</span>
    </div>
  )
}
