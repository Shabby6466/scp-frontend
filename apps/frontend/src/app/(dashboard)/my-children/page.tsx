'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { PageHeader } from '@/components/page-header';

/** Legacy "child" enrollment was replaced by student users. */
export default function MyChildrenPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      router.replace('/document-uploading');
    } else {
      router.replace('/dashboard');
    }
  }, [router, user?.role]);

  return (
    <div className="space-y-6">
      <PageHeader title="My student" description="Redirecting…" />
    </div>
  );
}
