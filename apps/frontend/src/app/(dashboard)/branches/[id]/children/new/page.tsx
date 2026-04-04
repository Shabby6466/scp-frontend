'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageBackLink } from '@/components/layout/page-back-link';

export default function NewChildRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/school/students');
  }, [router]);
  return (
    <div className="space-y-4">
      <PageBackLink href="/dashboard" />
      <p className="text-sm text-muted-foreground">
        Student accounts are managed from the school directory. Redirecting…
      </p>
    </div>
  );
}
