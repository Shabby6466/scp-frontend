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
import type { AuthUser } from '@/store/features/authSlice';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ChevronDown,
  GraduationCap,
  FileText,
  LayoutDashboard,
  LogOut,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Platform Admin',
  SCHOOL_ADMIN: 'School Admin',
  DIRECTOR: 'School Director',
  BRANCH_DIRECTOR: 'Branch Director',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
};

const ADMIN_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schools', label: 'Schools', icon: Building2 },
  { href: '/branches', label: 'Branches', icon: Building2 },
  { href: '/directors', label: 'Directors', icon: Shield },
  { href: '/branch-directors', label: 'Branch directors', icon: Users },
  { href: '/teachers', label: 'Teachers', icon: GraduationCap },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/document-types', label: 'Document types', icon: FileText },
];

const TEACHER_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Building2 },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/my-documents', label: 'My Documents', icon: FileText },
];

const STUDENT_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Building2 },
  { href: '/teachers', label: 'Teachers', icon: GraduationCap },
  { href: '/my-documents', label: 'My Documents', icon: FileText },
];

function schoolOwnerNav(user: AuthUser): { href: string; label: string; icon: LucideIcon }[] {
  if (user.role === 'DIRECTOR') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/branches', label: 'Branches', icon: Building2 },
      { href: '/branch-directors', label: 'Branch directors', icon: Users },
      { href: '/school/teachers', label: 'Teachers', icon: GraduationCap },
      { href: '/school/students', label: 'Students', icon: Users },
      { href: '/document-types', label: 'Document types', icon: FileText },
      { href: '/my-documents', label: 'My Documents', icon: FileText },
    ];
  }

  return [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/school/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/school/students', label: 'Students', icon: Users },
    { href: '/document-types', label: 'Document types', icon: FileText },
    { href: '/my-documents', label: 'My Documents', icon: FileText },
  ];
}

function getNavItems(user: AuthUser | null): { href: string; label: string; icon: LucideIcon }[] {
  if (!user) return [];
  if (user.role === 'ADMIN') return ADMIN_NAV;
  if (user.role === 'DIRECTOR') {
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
                if (item.href.includes('/teachers') || item.href === '/teachers') {
                  isActive =
                    pathname === '/teachers' ||
                    pathname.startsWith('/teachers/') ||
                    pathname === '/school/teachers' ||
                    pathname.startsWith('/school/teachers/') ||
                    /^\/schools\/[^/]+\/teachers(?:\/|$)/.test(pathname);
                }
                if (item.href.includes('/students') || item.href === '/students') {
                  isActive =
                    pathname === '/students' ||
                    pathname.startsWith('/students/') ||
                    pathname === '/school/students' ||
                    pathname.startsWith('/school/students/') ||
                    pathname === '/branches' ||
                    /^\/branches\/[^/]+(?:\/|$)/.test(pathname) ||
                    pathname === '/children' ||
                    /^\/children\/[^/]+(?:\/|$)/.test(pathname);
                }
                if (item.href === '/document-types') {
                  isActive =
                    pathname === '/document-types' ||
                    pathname.startsWith('/document-types/') ||
                    pathname === '/document-requirements/new' ||
                    pathname.startsWith('/document-requirements/');
                }
                if (item.href === '/my-documents') {
                  isActive =
                    pathname === '/my-documents' ||
                    pathname.startsWith('/my-documents/') ||
                    pathname === '/my-staff-file' ||
                    pathname === '/document-uploading' ||
                    pathname.startsWith('/document-uploading/');
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
          <div className="rounded-2xl bg-white/5 p-2 transition-all hover:bg-white/10">
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
