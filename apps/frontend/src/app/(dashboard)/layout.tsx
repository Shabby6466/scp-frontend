'use client';

import { AuthGuard } from '@/components/auth-guard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/features/authSlice';
import { useLogoutMutation } from '@/store/features/authApi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 bg-gray-50 p-6 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

function DashboardHeader() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    await logoutApi().unwrap().catch(() => {});
    dispatch(logout());
    router.push('/login');
  };

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          School Compliance
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user.name ?? user.email}{' '}
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {user.role}
            </span>
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
