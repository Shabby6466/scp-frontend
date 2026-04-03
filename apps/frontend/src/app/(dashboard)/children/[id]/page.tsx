'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageBackLink } from '@/components/page-back-link';

/**
 * Legacy route: child records were removed in favor of student users.
 */
export default function LegacyChildPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/school/students');
  }, [router]);
  return (
    <div className="space-y-4">
      <PageBackLink href="/dashboard" />
      <p className="text-sm text-muted-foreground">Redirecting to students…</p>
    </div>
  );
}
