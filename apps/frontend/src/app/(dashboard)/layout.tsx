'use client';

import { AuthGuard } from '@/components/auth-guard';
import { SearchBar } from '@/components/search-bar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/features/authSlice';
import { useLogoutMutation } from '@/store/features/authApi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/documents', label: 'Documents' },
  { href: '/document-types', label: 'Types' },
  { href: '/compliance', label: 'Compliance' },
  { href: '/audit-logs', label: 'Audit' },
];

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
    <header className="border-b bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            School Compliance
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <SearchBar />
          {user && (
            <span className="hidden text-sm text-gray-600 dark:text-gray-400 sm:inline">
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
      </div>
      <nav className="flex gap-1 overflow-x-auto px-6 pb-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
