'use client';

import { useParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import {
  useExportPerFormPdfMutation,
  useGetPerFormDetailQuery,
  useLazyGetDownloadUrlQuery,
} from '@/store/features/documentApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageBackLink } from '@/components/page-back-link';
import { toastError } from '@/lib/toast';

export default function PerFormDetailPage() {
  const params = useParams();
  const documentTypeId = params.documentTypeId as string;
  const user = useAppSelector((state) => state.auth.user);
  const [exportPdf] = useExportPerFormPdfMutation();
  const [getDownloadUrl] = useLazyGetDownloadUrlQuery();

  const { data, isLoading } = useGetPerFormDetailQuery(
    { ownerUserId: user?.id ?? '', documentTypeId },
    { skip: !user?.id || !documentTypeId },
  );

  const handleExport = async () => {
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

  const handleDownload = async () => {
    if (!data?.latestDocument?.id) return;
    try {
      const url = await getDownloadUrl(data.latestDocument.id).unwrap();
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toastError(error, 'Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageBackLink href="/document-uploading" />
      <Card>
        <CardHeader>
          <CardTitle>Per form view</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground">Form</p>
                  <p className="font-medium">{data?.documentType?.name ?? 'Unknown'}</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground">File</p>
                  <p className="font-medium">{data?.latestDocument?.fileName ?? 'No upload yet'}</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground">Uploaded date</p>
                  <p className="font-medium">
                    {data?.uploadedDate ? new Date(data.uploadedDate).toLocaleDateString() : 'Not uploaded'}
                  </p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground">Due date</p>
                  <p className="font-medium">
                    {data?.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="rounded-md border p-4 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Remaining time to expire</p>
                  <p className="font-medium">
                    {data?.remainingDays == null ? 'N/A' : `${data.remainingDays} day(s)`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void handleExport()}>
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleDownload()}
                  disabled={!data?.latestDocument}
                >
                  Open uploaded file
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
