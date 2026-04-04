'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { PageBackLink } from '@/components/layout/page-back-link';
import { SchoolUsersPanel } from '@/components/users/school-users-panel';
import { InlineLoading } from '@/components/layout/inline-loading';

/** Platform admin only (same capabilities as /users, scoped to one school). */
export default function SchoolUsersPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role;

  useEffect(() => {
    if (user && role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, role, router]);

  if (!user) {
    return <InlineLoading message="Loading…" />;
  }

  if (role !== 'ADMIN') {
    return <p className="text-sm text-muted-foreground">Redirecting…</p>;
  }

  return (
    <div className="space-y-6">
      <PageBackLink href="/schools" />
      <SchoolUsersPanel schoolId={schoolId} />
    </div>
  );
}
