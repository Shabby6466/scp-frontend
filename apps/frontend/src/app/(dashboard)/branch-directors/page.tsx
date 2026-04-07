'use client';

import { useAppSelector } from '@/store/hooks';
import { SchoolUsersPanel } from '@/components/users/school-users-panel';
import { InlineLoading } from '@/components/layout/inline-loading';

export default function BranchDirectorsPage() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return <InlineLoading message="Loading…" />;

  if (user.role !== 'ADMIN' && user.role !== 'DIRECTOR') {
    return <p className="text-sm text-muted-foreground">You do not have access to this page.</p>;
  }

  const schoolId = user.role === 'ADMIN' ? '' : (user.schoolId ?? '');

  return (
    <SchoolUsersPanel
      schoolId={schoolId}
      title="Branch directors"
      description="Manage branch directors."
      fixedRole="BRANCH_DIRECTOR"
      allowedCreateRoles={['BRANCH_DIRECTOR']}
    />
  );
}
