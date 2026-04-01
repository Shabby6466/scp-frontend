'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetSchoolsQuery } from '@/store/features/schoolApi';
import { useAppSelector } from '@/store/hooks';
import { PageSkeleton } from '@/components/page-skeleton';
import { PageBackLink } from '@/components/page-back-link';

/**
 * Resolves the current user's school from the API and opens the branch list.
 * Directors and school admins are not required to have schoolId in client state or the URL.
 */
export default function BranchesHubPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const isSchoolScoped =
    user?.role === 'DIRECTOR' ||
    user?.role === 'SCHOOL_ADMIN' ||
    user?.role === 'BRANCH_DIRECTOR';

  const { data: schools, isLoading, isError } = useGetSchoolsQuery(undefined, {
    skip: !user || !isSchoolScoped,
  });

  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN') {
      router.replace('/schools');
      return;
    }
    if (!isSchoolScoped) {
      router.replace('/dashboard');
    }
  }, [user, router, isSchoolScoped]);

  useEffect(() => {
    if (!isSchoolScoped || isLoading || !schools?.length) return;
    const id = schools[0].id;
    router.replace(`/schools/${id}/branches`);
  }, [isSchoolScoped, isLoading, schools, router]);

  if (!user) {
    return <PageSkeleton cards={2} />;
  }

  if (user.role === 'ADMIN' || !isSchoolScoped) {
    return <PageSkeleton cards={2} />;
  }

  if (isLoading) {
    return <PageSkeleton cards={4} />;
  }

  if (isError || !schools?.length) {
    return (
      <div className="space-y-4">
        <PageBackLink href="/dashboard" />
        <p className="text-sm text-destructive">
          Could not load your school or no school is assigned to your account. If you are a director,
          ask a platform admin to confirm your account is linked to a school.
        </p>
      </div>
    );
  }

  return <PageSkeleton cards={2} />;
}
