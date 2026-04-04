'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { InlineLoading } from '@/components/layout/inline-loading';
import { SchoolUsersPanel } from '@/components/users/school-users-panel';

export default function StudentsPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'DIRECTOR' || user.role === 'BRANCH_DIRECTOR') {
      router.replace('/school/students');
    }
  }, [router, user]);

  if (!user) return <InlineLoading message="Loading…" />;

  if (user.role === 'DIRECTOR' || user.role === 'BRANCH_DIRECTOR') {
    return <p className="text-sm text-muted-foreground">Redirecting…</p>;
  }

  if (user.role === 'ADMIN') {
    return (
      <SchoolUsersPanel
        schoolId=""
        title="Students"
        description="Manage students across the platform."
        fixedRole="STUDENT"
        allowedCreateRoles={['STUDENT']}
      />
    );
  }

  if (user.role === 'TEACHER') {
    const schoolId = user.schoolId ?? user.school?.id ?? '';
    return (
      <SchoolUsersPanel
        schoolId={schoolId}
        title="Students"
        description="View students in your school."
        fixedRole="STUDENT"
        readOnly
      />
    );
  }

  return <p className="text-sm text-muted-foreground">You do not have access to this page.</p>;
}
