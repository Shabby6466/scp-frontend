'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  useGetSchoolsQuery,
  useCreateSchoolMutation,
  useDeleteSchoolMutation,
} from '@/store/features/schoolApi';
import { useGetAllUsersQuery } from '@/store/features/userApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { PageSkeleton } from '@/components/page-skeleton';
import { toast, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/page-header';
import { Building2, Plus, Users, Trash2 } from 'lucide-react';

export default function SchoolsPage() {
  const [name, setName] = useState('');
  const [directorUserId, setDirectorUserId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { data: schools, isLoading } = useGetSchoolsQuery();
  const { data: allUsers, isLoading: usersLoading } = useGetAllUsersQuery(undefined, {
    skip: !dialogOpen,
  });
  const [createSchool, { isLoading: isCreating }] = useCreateSchoolMutation();
  const [deleteSchool, { isLoading: isDeleting }] = useDeleteSchoolMutation();

  const eligibleDirectors = useMemo(() => {
    if (!allUsers?.length) return [];
    return [...allUsers]
      .filter((u) => u.role === 'DIRECTOR')
      .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email, undefined, { sensitivity: 'base' }));
  }, [allUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createSchool({
        name: name.trim(),
        ...(directorUserId ? { directorUserId } : {}),
      }).unwrap();
      setName('');
      setDirectorUserId('');
      setDialogOpen(false);
      toast('School created successfully');
    } catch (err) {
      toastError(err, 'Failed to create school');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSchool(deleteTarget.id).unwrap();
      setDeleteTarget(null);
      toast('School deleted');
    } catch (err) {
      toastError(err, 'Failed to delete school');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schools"
        description="Manage schools and their branches"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add school
          </Button>
        }
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setName('');
            setDirectorUserId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md shadow-overlay">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add school</DialogTitle>
              <DialogDescription>
                Create the school first. You can invite a director and link them later from{' '}
                <Link href="/users" className="font-medium text-primary underline-offset-4 hover:underline">
                  Users
                </Link>
                , or optionally attach an existing director now.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="school-name">School name</Label>
                <Input
                  id="school-name"
                  placeholder="e.g. Sunshine Preschool"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-director-user">Director (optional)</Label>
                {usersLoading ? (
                  <div className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />
                ) : eligibleDirectors.length ? (
                  <Select
                    value={directorUserId || '__none__'}
                    onValueChange={(v) => setDirectorUserId(v === '__none__' ? '' : (v ?? ''))}
                  >
                    <SelectTrigger id="school-director-user" className="w-full">
                      <SelectValue placeholder="Assign later" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Assign later</SelectItem>
                      {eligibleDirectors.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name ?? u.email} · {u.email}
                          {u.school?.name ? ` · ${u.school.name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No director accounts yet — skip this and add one from{' '}
                    <Link href="/users" className="font-medium text-primary underline-offset-4 hover:underline">
                      Users
                    </Link>
                    .
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !name.trim() || usersLoading}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <PageSkeleton cards={6} />
      ) : !schools?.length ? (
        <EmptyState
          icon={Building2}
          title="No schools yet"
          description="Add a school by name. You can assign a director afterward from Users."
          action={{ label: 'Add school', onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools?.map((school) => (
            <Card
              key={school.id}
              className="group relative overflow-hidden shadow-elevated transition-colors hover:bg-muted/30"
            >
              <Link
                href={`/schools/${school.id}/branches`}
                className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`${school.name}: open branches`}
              />
              <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-2 space-y-0 pb-2 pointer-events-none">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Building2 className="h-5 w-5 shrink-0 text-primary" />
                  <CardTitle className="truncate text-base font-semibold">{school.name}</CardTitle>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="pointer-events-auto shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteTarget({ id: school.id, name: school.name })}
                  aria-label={`Delete ${school.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="relative z-10 pointer-events-none">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {school._count?.users ?? 0} users
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {school._count?.branches ?? 0} branches
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete school?"
        description={`This will permanently delete "${deleteTarget?.name}" and all associated branches, users, and data. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
