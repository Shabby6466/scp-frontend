'use client';

import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MyDocumentStats } from '@/components/documents/my-document-stats';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, GraduationCap, FileText, ChevronRight, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DashboardAnalytics } from '@/components/data/dashboard-analytics';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

const ANALYTICS_ROLES = new Set(['ADMIN', 'SCHOOL_ADMIN', 'DIRECTOR', 'BRANCH_DIRECTOR']);
const PERSONAL_DOC_ROLES = new Set(['TEACHER', 'STUDENT']);

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isBranchDirector = user?.role === 'BRANCH_DIRECTOR';
  const branchId = user?.branchId ?? null;

  const roleLinks =
    user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN'
      ? [
        {
          href: '/schools',
          label: 'Schools',
          description: 'Manage schools and branches',
          icon: Building2,
        },
        {
          href: '/users',
          label: 'Users',
          description: 'Manage all platform users',
          icon: Users,
        },
      ]
      : user?.role === 'DIRECTOR'
        ? [
          {
            href: '/branches',
            label: 'Branches',
            description: 'Locations, teachers, and compliance for your school',
            icon: Building2,
          },
          {
            href: '/school/teachers',
            label: 'Teachers',
            description: 'Invite teachers by branch',
            icon: GraduationCap,
          },
        ]
        : isBranchDirector && branchId
          ? [
            {
              href: `/branches/${branchId}`,
              label: 'My Branch',
              description: 'Children, teachers, and facility documents',
              icon: Building2,
            },
            {
              href: '/school/teachers',
              label: 'Teachers',
              description: 'Invite teachers for your branch',
              icon: GraduationCap,
            },
          ]
          : user?.role === 'TEACHER'
            ? [
              {
                href: '/my-branch',
                label: 'My Branch',
                description: 'View your class and students',
                icon: Building2,
              },
              {
                href: '/my-staff-file',
                label: 'My Documents',
                description: 'Upload required compliance documents',
                icon: FileText,
              },
            ]
            : user?.role === 'STUDENT'
              ? [
                {
                  href: '/my-children',
                  label: 'My Profile',
                  description: 'Your enrollment and documents',
                  icon: Building2,
                },
                {
                  href: '/document-uploading',
                  label: 'Upload Documents',
                  description: 'Submit required compliance documents',
                  icon: FileText,
                },
              ]
              : [];

  const branchDirectorAwaitingBranch = isBranchDirector && !branchId;
  const showAnalytics = user?.role && ANALYTICS_ROLES.has(user.role);
  const showPersonalDocs = user?.role && PERSONAL_DOC_ROLES.has(user.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name ?? user?.email}`}
      />

      {/* Role Context Banner */}
      <div className={cn(
        "relative overflow-hidden rounded-[2rem] border p-8 shadow-sm transition-all duration-500",
        user?.role === 'ADMIN' && "bg-slate-950 text-white border-white/10",
        (user?.role === 'SCHOOL_ADMIN' || user?.role === 'DIRECTOR') && "bg-indigo-600 text-white border-indigo-500",
        user?.role === 'BRANCH_DIRECTOR' && "bg-emerald-600 text-white border-emerald-500",
        (user?.role === 'TEACHER' || user?.role === 'STUDENT') && "bg-secondary/50 border-border"
      )}>
        <div className="relative z-10 flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {user?.role === 'ADMIN' && "Platform Command Center"}
            {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'DIRECTOR') && "School Oversight"}
            {user?.role === 'BRANCH_DIRECTOR' && "Branch Management"}
            {(user?.role === 'TEACHER' || user?.role === 'STUDENT') && "Personal Portal"}
          </h2>
          <p className={cn(
            "text-sm font-medium max-w-lg",
            (user?.role === 'ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'BRANCH_DIRECTOR') 
              ? "text-white/80" 
              : "text-muted-foreground"
          )}>
            {user?.role === 'ADMIN' && "Manage global schools, users, and platform-wide compliance standards."}
            {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'DIRECTOR') && "Monitor branch performance, staff compliance, and enrollment health."}
            {user?.role === 'BRANCH_DIRECTOR' && `Overseeing ${user.branchId ? 'your branch' : 'assigned branch'} documents and local staff.`}
            {user?.role === 'TEACHER' && "Submit your compliance documents and view your class assignments."}
            {user?.role === 'STUDENT' && "Manage your enrollment documents and profile details."}
          </p>
        </div>
        <div className="absolute -right-8 -top-8 h-32 w-32 rotate-12 opacity-10">
          {user?.role === 'ADMIN' && <Shield className="h-full w-full" />}
          {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'DIRECTOR') && <Building2 className="h-full w-full" />}
          {user?.role === 'BRANCH_DIRECTOR' && <Users className="h-full w-full" />}
          {(user?.role === 'TEACHER' || user?.role === 'STUDENT') && <FileText className="h-full w-full" />}
        </div>
      </div>

      {branchDirectorAwaitingBranch ? (
        <Alert>
          <AlertDescription>
            Your account is a branch director but no branch has been assigned yet. Your school
            director will assign you when they create or configure a branch for you.
          </AlertDescription>
        </Alert>
      ) : null}

      {showPersonalDocs ? <MyDocumentStats /> : null}
      {showAnalytics ? <DashboardAnalytics /> : null}

      {roleLinks.length > 0 ? (
        <div>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">Shortcuts</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roleLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="h-full transition-all hover:scale-[1.02] hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
                      <div className="rounded-2xl bg-secondary p-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <CardTitle className="text-lg font-serif transition-colors group-hover:text-primary">
                          {item.label}
                        </CardTitle>
                        {item.description && (
                          <CardDescription className="text-sm leading-relaxed">
                            {item.description}
                          </CardDescription>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {roleLinks.length === 0 && !branchDirectorAwaitingBranch ? (
        <Card className="bg-secondary/50 shadow-none">
          <CardHeader>
            <CardDescription className="py-8 text-center text-base">
              No actions available for your role.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
