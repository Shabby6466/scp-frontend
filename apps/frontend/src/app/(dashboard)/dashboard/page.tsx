'use client';

import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { DashboardAnalytics } from '@/components/data/dashboard-analytics';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, GraduationCap, FileText, ChevronRight } from 'lucide-react';

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
            description: 'Manage schools and branches; add people from Users in the sidebar',
            icon: Building2,
          },
        ]
      : user?.role === 'DIRECTOR'
        ? [
            {
              href: '/branches',
              label: 'Branches',
              description: 'Locations, children, teachers, and compliance for your school',
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
                label: 'My branch',
                description: 'Children, teachers, and facility documents for your location',
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
                description: 'Upload required documents',
                icon: FileText,
              },
            ]
          : user?.role === 'STUDENT'
            ? [
                {
                  href: '/my-children',
                  label: 'My student',
                  description: 'Your enrollment, profile, and documents',
                  icon: Building2,
                },
              ]
            : [];

  const branchDirectorAwaitingBranch = isBranchDirector && !branchId;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name ?? user?.email}`}
      />

      {branchDirectorAwaitingBranch ? (
        <Alert>
          <AlertDescription>
            Your account is a branch director but no branch has been assigned yet. Your school director
            will assign you when they create or configure a branch for you.
          </AlertDescription>
        </Alert>
      ) : null}

      <DashboardAnalytics />

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
                          <CardDescription className="text-sm leading-relaxed">{item.description}</CardDescription>
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
