'use client';

import { 
  useGetComplianceSummaryQuery, 
  useGetPendingActionsQuery 
} from '@/store/features/analyticsApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ComplianceScoreDial } from './compliance-score-dial';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  UserX,
  FileSearch
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export function ActionCenterWidget() {
  const { data: summary, isLoading: summaryLoading } = useGetComplianceSummaryQuery();
  const { data: pending, isLoading: pendingLoading } = useGetPendingActionsQuery();

  if (summaryLoading || pendingLoading) {
    return <ActionCenterSkeleton />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-12">
      {/* 1. Overall Health Score */}
      <Card className="md:col-span-4 overflow-hidden border-none shadow-elevated bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Compliance Health
          </CardTitle>
          <CardDescription>Overall organization status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
          <ComplianceScoreDial score={summary?.score ?? 0} size={160} strokeWidth={12} />
          <div className="mt-6 grid grid-cols-2 gap-4 w-full text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{summary?.verifiedCount}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Verified</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{summary?.totalRequired}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Required</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Pending Verifications */}
      <Card className="md:col-span-4 shadow-subtle border-muted/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-500">
              <Clock className="h-4 w-4" />
              Pending Review
            </div>
            {summary?.pendingVerification ? (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">
                {summary.pendingVerification} New
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>Documents awaiting your verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pending?.recentUploads?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <FileSearch className="h-8 w-8 text-muted/40" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.recentUploads.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.documentType.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.ownerUser.name} · {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Link href={`/staff/${doc.ownerUser.id}`}>
                    <Button variant="ghost" size="icon-sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
          {summary?.pendingVerification ? (
             <Link href="/users">
               <Button variant="outline" className="w-full text-xs h-9 bg-background/50">
                 View All Users
               </Button>
             </Link>
          ) : null}
        </CardContent>
      </Card>

      {/* 3. Critical Gaps / At Risk */}
      <Card className="md:col-span-4 shadow-subtle border-muted/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            Action Required
          </CardTitle>
          <CardDescription>Personnel with missing mandatory docs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pending?.atRiskStaff?.length ? (
             <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
                <p className="text-sm text-muted-foreground">Zero critical gaps.</p>
             </div>
          ) : (
            <div className="space-y-3">
              {pending.atRiskStaff.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{staff.name || staff.email}</p>
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className="text-[9px] uppercase h-4 px-1.5 leading-none">
                         {staff.role}
                       </Badge>
                       <p className="text-[10px] text-destructive font-medium uppercase tracking-tight">Missing Docs</p>
                    </div>
                  </div>
                  <Link href={`/staff/${staff.id}`}>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <UserX className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
          <Link href="/users">
            <Button variant="outline" className="w-full text-xs h-9 bg-background/50">
              Manage Personnel
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionCenterSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-12">
      <Skeleton className="md:col-span-4 h-[320px] rounded-xl" />
      <Skeleton className="md:col-span-4 h-[320px] rounded-xl" />
      <Skeleton className="md:col-span-4 h-[320px] rounded-xl" />
    </div>
  );
}
