'use client';

import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';

/** Legacy URL — same as My documents. */
export default function MyStaffFilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  if (user?.id) {
    router.replace('/my-documents');
    return null;
  }

  return <div className="text-sm text-muted-foreground">Not logged in.</div>;
}
