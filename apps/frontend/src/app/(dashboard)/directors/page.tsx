'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { SchoolUsersPanel } from '@/components/users/school-users-panel';
import { InlineLoading } from '@/components/layout/inline-loading';

export default function DirectorsPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router, user]);

  if (!user) return <InlineLoading message="Loading…" />;
  if (user.role !== 'ADMIN') return <p className="text-sm text-muted-foreground">Redirecting…</p>;

  return (
    <SchoolUsersPanel
      schoolId=""
      title="Directors"
      description="Manage school directors."
      fixedRole="DIRECTOR"
      allowedCreateRoles={['DIRECTOR']}
    />
  );
}
