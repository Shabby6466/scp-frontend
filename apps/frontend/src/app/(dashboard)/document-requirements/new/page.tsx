'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useGetAllUsersQuery, useGetSchoolUsersQuery } from '@/store/features/userApi';
import {
  useAssignDocumentTypeUsersMutation,
  useCreateDocumentTypeMutation,
} from '@/store/features/documentTypeApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast, toastError } from '@/lib/toast';
import { PageBackLink } from '@/components/page-back-link';

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
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { data: allUsers = [] } = useGetAllUsersQuery(undefined, {
    skip: !authUser || authUser.role !== 'ADMIN',
  });
  const { data: schoolUsers = [] } = useGetSchoolUsersQuery(authUser?.schoolId ?? '', {
    skip: !authUser || authUser.role === 'ADMIN' || !authUser.schoolId,
  });

  const users = authUser?.role === 'ADMIN' ? allUsers : schoolUsers;
  const assignableUsers = useMemo(
    () =>
      users.filter((user) => {
        if (!authUser) return false;
        if (!canAssignTarget(authUser.role, user.role)) return false;
        if (authUser.role === 'BRANCH_DIRECTOR') {
          return authUser.branchId != null && authUser.branchId === user.branchId;
        }
        return user.role === targetRole;
      }),
    [authUser, users, targetRole],
  );

  const [createDocumentType, { isLoading: creating }] = useCreateDocumentTypeMutation();
  const [assignUsers, { isLoading: assigning }] = useAssignDocumentTypeUsersMutation();

  const canManage =
    authUser?.role === 'ADMIN' ||
    authUser?.role === 'SCHOOL_ADMIN' ||
    authUser?.role === 'DIRECTOR' ||
    authUser?.role === 'BRANCH_DIRECTOR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    try {
      const created = await createDocumentType({
        name,
        targetRole,
        schoolId: authUser.role === 'ADMIN' ? undefined : authUser.schoolId ?? undefined,
      }).unwrap();
      if (selectedUserIds.length > 0) {
        await assignUsers({ documentTypeId: created.id, userIds: selectedUserIds }).unwrap();
      }
      toast('Document type created and assigned');
      router.push('/document-uploading');
    } catch (error) {
      toastError(error, 'Failed to create and assign document type');
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
          <CardTitle>Create and assign document type</CardTitle>
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
              <Label htmlFor="target-role">Target role</Label>
              <select
                id="target-role"
                value={targetRole}
                onChange={(e) => {
                  setTargetRole(e.target.value);
                  setSelectedUserIds([]);
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.filter((role) => canAssignTarget(authUser.role, role)).map((role) => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Assign users</Label>
              <div className="max-h-64 space-y-2 overflow-auto rounded-md border p-3">
                {assignableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users available for this role.</p>
                ) : (
                  assignableUsers.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds((prev) => [...prev, user.id]);
                          } else {
                            setSelectedUserIds((prev) => prev.filter((id) => id !== user.id));
                          }
                        }}
                      />
                      <span>
                        {user.name ?? user.email} ({user.role.replace('_', ' ')})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <Button type="submit" disabled={creating || assigning}>
              {creating || assigning ? 'Saving...' : 'Create and assign'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
