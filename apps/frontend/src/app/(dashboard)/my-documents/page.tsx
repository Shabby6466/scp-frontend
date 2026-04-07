'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { InlineLoading } from '@/components/layout/inline-loading';
import { AssignedDocumentsPanel } from '@/components/documents/assigned-documents-panel';
import { PageBackLink } from '@/components/layout/page-back-link';
import { PageHeader } from '@/components/layout/page-header';
import { sanitizeFromPath } from '@/lib/safe-from-path';

function MyDocumentsContent() {
  const user = useAppSelector((state) => state.auth.user);
  const searchParams = useSearchParams();
  const detailType = searchParams.get('type');
  const fromRaw = searchParams.get('from');
  const from = fromRaw ? sanitizeFromPath(fromRaw) : null;

  if (!user?.id) {
    return <InlineLoading message="Loading…" />;
  }

  return (
    <div className="space-y-6">
      {from ? <PageBackLink href={from} /> : null}
      <PageHeader
        title="My documents"
        description="Requirements assigned to you by your school. Upload files for each item below."
      />
      <AssignedDocumentsPanel ownerUserId={user.id} detailDocumentTypeId={detailType} />
    </div>
  );
}

export default function MyDocumentsPage() {
  return (
    <Suspense fallback={<InlineLoading message="Loading…" />}>
      <MyDocumentsContent />
    </Suspense>
  );
}
