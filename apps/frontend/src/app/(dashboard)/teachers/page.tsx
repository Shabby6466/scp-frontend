'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { InlineLoading } from '@/components/inline-loading';

/** @deprecated Use `/school/teachers` (directors) or `/schools/[schoolId]/teachers` (admins). */
export default function TeachersLegacyRedirectPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (user.role === 'DIRECTOR' || user.role === 'BRANCH_DIRECTOR') {
      router.replace(`/school/teachers${search}`);
    } else if (user.role === 'SCHOOL_ADMIN' && user.schoolId) {
      router.replace(`/schools/${user.schoolId}/teachers`);
    } else {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (!user) {
    return <InlineLoading message="Loading…" />;
  }

  return <p className="text-sm text-muted-foreground">Redirecting…</p>;
}
