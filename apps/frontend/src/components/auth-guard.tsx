'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { InlineLoading } from '@/components/inline-loading';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <InlineLoading message="Loading…" />
      </div>
    );
  }

  return <>{children}</>;
}
