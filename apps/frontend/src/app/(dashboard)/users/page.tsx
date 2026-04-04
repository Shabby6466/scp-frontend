'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { SchoolUsersPanel } from '@/components/users/school-users-panel';
import { InlineLoading } from '@/components/layout/inline-loading';

/** Platform admin only: global user list and invites. School directors use Teachers (and other flows) instead. */
export default function UsersPage() {
  const router = useRouter();
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
      <SchoolUsersPanel schoolId="" />
    </div>
  );
}
