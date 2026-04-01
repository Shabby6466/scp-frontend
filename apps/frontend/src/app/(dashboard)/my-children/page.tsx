'use client';

import Link from 'next/link';
import { useGetMyChildrenQuery } from '@/store/features/childApi';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { GraduationCap } from 'lucide-react';

export default function MyChildrenPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: myChildren = [], isLoading } = useGetMyChildrenQuery(undefined, {
    skip: user?.role !== 'STUDENT',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My student"
        description="Your enrollment and documents for this school"
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      ) : myChildren.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrollment found"
          description="If you should be enrolled, ask your school to link your student account to a child record."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myChildren.map((child) => (
            <Card key={child.id}>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
                <CardTitle className="truncate text-base">
                  {child.firstName} {child.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {child.branch?.name ? (
                  <p className="text-sm text-muted-foreground">Branch: {child.branch.name}</p>
                ) : null}
              </CardContent>
              <CardFooter>
                <Link href={`/children/${child.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full">
                    View documents
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
