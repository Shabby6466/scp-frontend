'use client';

import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { useGetBranchQuery } from '@/store/features/branchApi';
import { InlineLoading } from '@/components/layout/inline-loading';

export default function MyBranchPage() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const branchId = user?.branchId;

  const { data: branch, isLoading } = useGetBranchQuery(branchId ?? '', {
    skip: !branchId,
  });

  if (!branchId) {
    return (
      <div className="text-sm text-muted-foreground">
        You are not assigned to a branch.
      </div>
    );
  }

  if (isLoading) {
    return <InlineLoading />;
  }

  if (branch) {
    router.replace(`/branches/${branchId}`);
    return null;
  }

  return <div className="text-sm text-muted-foreground">Branch not found.</div>;
}
