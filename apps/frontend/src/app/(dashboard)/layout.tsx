'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AuthUserSync } from '@/components/auth/auth-user-sync';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RoleBadge } from '@/components/users/role-badge';
import { logout } from '@/store/features/authSlice';
import { useLogoutMutation } from '@/store/features/authApi';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    await logoutApi().unwrap().catch(() => {});
    dispatch(logout());
    router.push('/login');
  };

  return (
    <AuthGuard>
      <AuthUserSync />
      <SidebarProvider className="h-svh overflow-hidden flex">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <header className="flex h-16 shrink-0 items-center gap-3 bg-secondary px-6">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <div className="min-w-0 flex-1 overflow-x-auto">
              <Breadcrumbs />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {authUser ? (
                <Link
                  href="/profile"
                  className="hidden min-w-0 items-center gap-2 rounded-2xl bg-background px-4 py-2 text-sm transition-all hover:opacity-80 sm:flex"
                >
                  <span className="max-w-[160px] truncate font-semibold text-primary">
                    {authUser.name ?? authUser.email}
                  </span>
                  <RoleBadge role={authUser.role} />
                </Link>
              ) : null}
              <ModeToggle />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-2xl"
                aria-label="Log out"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          </header>
          <main className="bg-app-main min-h-0 min-w-0 flex-1 overflow-auto p-4 sm:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
