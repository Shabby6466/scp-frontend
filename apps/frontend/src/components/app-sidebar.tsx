'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/features/authSlice';
import { useLogoutMutation } from '@/store/features/authApi';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RoleBadge } from '@/components/role-badge';
import type { AuthUser } from '@/store/features/authSlice';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ChevronDown,
  GraduationCap,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react';

const ADMIN_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schools', label: 'Schools', icon: Building2 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const TEACHER_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Building2 },
  { href: '/my-branch', label: 'My Branch', icon: Building2 },
  { href: '/my-staff-file', label: 'My Documents', icon: FileText },
];

const STUDENT_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Building2 },
  { href: '/my-children', label: 'My student', icon: GraduationCap },
];

function schoolOwnerNav(user: AuthUser): { href: string; label: string; icon: LucideIcon }[] {
  const teachersHref =
    user.role === 'SCHOOL_ADMIN' && user.schoolId
      ? `/schools/${user.schoolId}/teachers`
      : '/school/teachers';
  return [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/branches', label: 'Branches', icon: Building2 },
    { href: teachersHref, label: 'Teachers', icon: GraduationCap },
  ];
}

function getNavItems(user: AuthUser | null): { href: string; label: string; icon: LucideIcon }[] {
  if (!user) return [];
  if (user.role === 'ADMIN') return ADMIN_NAV;
  if (user.role === 'DIRECTOR') {
    return schoolOwnerNav(user);
  }
  if (user.role === 'SCHOOL_ADMIN') {
    return schoolOwnerNav(user);
  }
  if (user.role === 'BRANCH_DIRECTOR') {
    return schoolOwnerNav(user);
  }
  if (user.role === 'TEACHER') return TEACHER_NAV;
  if (user.role === 'STUDENT') return STUDENT_NAV;
  return [];
}

export function AppSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [logoutApi] = useLogoutMutation();

  const handleLogout = async () => {
    await logoutApi().unwrap().catch(() => {});
    dispatch(logout());
    router.push('/login');
  };

  const navItems = getNavItems(user);

  return (
    <Sidebar className="border-0 bg-[#0a0a0a] text-white">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0a0a0a] shadow-xl">
            <Shield className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white">
              School System
            </h1>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Platform Admin
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/profile'}
                  tooltip="My profile"
                  className="rounded-[20px] transition-all data-[active=true]:bg-lime-600 data-[active=true]:shadow-lg"
                  render={
                    <Link href="/profile" className="flex w-full items-center gap-4 px-2 py-3 font-bold text-white">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                        pathname === '/profile' ? "bg-white text-lime-600" : "text-white/70"
                      )}>
                        <UserCircle strokeWidth={2.5} className="h-5 w-5" />
                      </div>
                      <span className="text-base">My profile</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>

              {navItems.map((item) => {
                let isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                if (item.href === '/branches') {
                  isActive = isActive || /^\/schools\/[^/]+\/branches(?:\/|$)/.test(pathname);
                }
                if (item.href.includes('/teachers')) {
                  isActive = pathname === '/school/teachers' || pathname.startsWith('/school/teachers/') || /^\/schools\/[^/]+\/teachers(?:\/|$)/.test(pathname);
                }
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      className="rounded-[20px] transition-all data-[active=true]:bg-lime-600 data-[active=true]:shadow-lg"
                      render={
                        <Link href={item.href} className="flex w-full items-center gap-4 px-2 py-3 font-bold text-white">
                          <div className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                            isActive ? "bg-white text-lime-600" : "text-white/70"
                          )}>
                            <Icon strokeWidth={2.5} className="h-5 w-5" />
                          </div>
                          <span className="text-base">{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        {user && (
          <div className="rounded-[24px] bg-white/5 p-2 transition-all hover:bg-white/10">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left outline-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 font-bold text-white">
                  {user.name?.[0] ?? user.email[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 group-data-[state=collapsed]:hidden">
                  <p className="truncate text-sm font-bold text-white">
                    {user.name ?? user.email}
                  </p>
                  <p className="truncate text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-white/30 group-data-[state=collapsed]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56 rounded-2xl bg-[#1a1a1a] text-white border-white/10">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1.5 p-1">
                      <span className="truncate text-sm font-bold text-white">{user.name ?? 'User'}</span>
                      <span className="truncate text-xs text-white/50">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={() => router.push('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  My profile
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="text-red-400 focus:bg-red-400/10 focus:text-red-400" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
