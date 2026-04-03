'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { useCreateDocumentTypeMutation } from '@/store/features/documentTypeApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast, toastError } from '@/lib/toast';
import { PageBackLink } from '@/components/page-back-link';
import { buttonVariants } from '@/lib/button-variants';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = ['BRANCH_DIRECTOR', 'TEACHER', 'STUDENT'] as const;

function canAssignTarget(actorRole: string, targetRole: string): boolean {
  if (actorRole === 'ADMIN') return targetRole !== 'ADMIN' && targetRole !== 'SCHOOL_ADMIN';
  if (actorRole === 'DIRECTOR' || actorRole === 'SCHOOL_ADMIN') {
    return targetRole === 'BRANCH_DIRECTOR' || targetRole === 'TEACHER' || targetRole === 'STUDENT';
  }
  if (actorRole === 'BRANCH_DIRECTOR') {
    return targetRole === 'TEACHER' || targetRole === 'STUDENT';
  }
  return false;
}

export default function NewDocumentRequirementPage() {
  const router = useRouter();
  const authUser = useAppSelector((state) => state.auth.user);

  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState<string>('TEACHER');

  const [createDocumentType, { isLoading: creating }] = useCreateDocumentTypeMutation();

  const canManage =
    authUser?.role === 'ADMIN' ||
    authUser?.role === 'SCHOOL_ADMIN' ||
    authUser?.role === 'DIRECTOR' ||
    authUser?.role === 'BRANCH_DIRECTOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    try {
      await createDocumentType({
        name,
        targetRole,
        schoolId: authUser.role === 'ADMIN' ? undefined : authUser.schoolId ?? undefined,
      }).unwrap();
      toast('Document type created');
      router.push('/document-uploading');
    } catch (error) {
      toastError(error, 'Failed to create document type');
    }
  };

  if (!canManage) {
    return (
      <div className="space-y-2">
        <PageBackLink href="/dashboard" />
        <p className="text-sm text-muted-foreground">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBackLink href="/document-uploading" />
      <Card>
        <CardHeader>
          <CardTitle>Create document type</CardTitle>
          <CardDescription>
            Define a name and which role it applies to. To require specific people to upload it, go to{' '}
            <Link href="/school/teachers" className="text-primary underline-offset-4 hover:underline">
              Teachers
            </Link>{' '}
            or{' '}
            <Link href="/school/students" className="text-primary underline-offset-4 hover:underline">
              Students
            </Link>
            , select rows, and assign this document type there.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document type name</Label>
              <Input
                id="doc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Annual ID verification"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-role">Applies to role</Label>
              <select
                id="target-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.filter((role) => canAssignTarget(authUser.role, role)).map((role) => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Only users with this role can be given this requirement from the Teachers or Students
                pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={creating}>
                {creating ? 'Saving…' : 'Create document type'}
              </Button>
              <Link
                href="/school/teachers"
                className={cn(buttonVariants({ variant: 'outline', size: 'default' }))}
              >
                Assign on Teachers
              </Link>
              <Link
                href="/school/students"
                className={cn(buttonVariants({ variant: 'outline', size: 'default' }))}
              >
                Assign on Students
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
