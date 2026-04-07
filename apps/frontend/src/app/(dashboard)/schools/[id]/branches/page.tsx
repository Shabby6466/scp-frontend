'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageBackLink } from '@/components/layout/page-back-link';
import { PageHeader } from '@/components/layout/page-header';
import { useGetSchoolQuery } from '@/store/features/schoolApi';
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useGetBranchQuery,
  useUpdateBranchMutation,
} from '@/store/features/branchApi';
import { useGetBranchDirectorCandidatesQuery } from '@/store/features/userApi';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/layout/empty-state';
import { PageSkeleton } from '@/components/layout/page-skeleton';
import { toast, toastError } from '@/lib/toast';
import { Plus, Building2, Pencil } from 'lucide-react';

/** Follow server-assigned branch director until the user changes the select. */
const DIRECTOR_ASSIGN_SYNC = '__director_sync__';

export default function SchoolBranchesPage() {
  const params = useParams();
  const schoolId = params.id as string;
  const user = useAppSelector((state) => state.auth.user);
  const [name, setName] = useState('');
  const [branchDirectorUserId, setBranchDirectorUserId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [branchForDirectorDialog, setBranchForDirectorDialog] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [branchEditName, setBranchEditName] = useState('');
  const [directorAssignUserId, setDirectorAssignUserId] = useState(DIRECTOR_ASSIGN_SYNC);

  const isAdmin = user?.role === 'ADMIN';

  const {
    data: school,
    isLoading: schoolLoading,
    isError: schoolError,
  } = useGetSchoolQuery(schoolId);

  /**
   * Prefer server-authorized school load over Redux `schoolId` alone. Persisted auth can omit
   * `schoolId` while GET /schools/:id still succeeds (JWT has the correct id) — otherwise we skip
   * branch-director candidates and hide Add branch incorrectly.
   */
  const canManageBranches =
    isAdmin ||
    (user?.role === 'DIRECTOR' &&
      !!school &&
      school.id === schoolId);
  const {
    data: branches,
    isLoading: branchesLoading,
    isError: branchesError,
  } = useGetBranchesQuery(schoolId);
  const {
    data: branchDirectorOptions,
    isLoading: directorsLoading,
    isError: directorsError,
    error: directorsErrorPayload,
  } = useGetBranchDirectorCandidatesQuery(schoolId, {
    skip: !schoolId || !user || !canManageBranches,
  });
  const assignableBranchDirectors = useMemo(
    () => (branchDirectorOptions ?? []).filter((u) => !u.branchId),
    [branchDirectorOptions],
  );

  const directorsErrorMessage =
    directorsError && directorsErrorPayload && typeof directorsErrorPayload === 'object' && 'data' in directorsErrorPayload
      ? ((directorsErrorPayload.data as { message?: string })?.message ?? 'Could not load branch directors')
      : directorsError
        ? 'Could not load branch directors'
        : null;
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdatingDirector }] = useUpdateBranchMutation();

  const {
    data: branchDetailForDirector,
    isLoading: branchDetailLoading,
    isError: branchDetailError,
  } = useGetBranchQuery(branchForDirectorDialog?.id ?? '', {
    skip: !branchForDirectorDialog,
  });

  const directorOptionsForAssign = useMemo(() => {
    if (!branchDirectorOptions || !branchForDirectorDialog) return [];
    const bid = branchForDirectorDialog.id;
    return branchDirectorOptions.filter((u) => !u.branchId || u.branchId === bid);
  }, [branchDirectorOptions, branchForDirectorDialog]);

  const resolvedDirectorFromBranch = branchDetailForDirector?.users?.[0]?.id ?? '__none__';
  const directorSelectValue =
    directorAssignUserId === DIRECTOR_ASSIGN_SYNC
      ? resolvedDirectorFromBranch
      : directorAssignUserId;

  const backHref = isAdmin ? '/schools' : '/dashboard';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createBranch({
        schoolId,
        name: name.trim(),
        ...(branchDirectorUserId ? { branchDirectorUserId } : {}),
      }).unwrap();
      setName('');
      setBranchDirectorUserId('');
      setDialogOpen(false);
      toast('Branch created successfully');
    } catch (err) {
      toastError(err, 'Failed to create branch');
    }
  };

  const handleBranchEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForDirectorDialog || !branchEditName.trim()) return;
    const effectiveId =
      directorAssignUserId === DIRECTOR_ASSIGN_SYNC
        ? resolvedDirectorFromBranch
        : directorAssignUserId;
    try {
      await updateBranch({
        branchId: branchForDirectorDialog.id,
        schoolId,
        data: {
          name: branchEditName.trim(),
          branchDirectorUserId: effectiveId === '__none__' ? '' : effectiveId,
        },
      }).unwrap();
      setBranchForDirectorDialog(null);
      setBranchEditName('');
      toast('Branch updated');
    } catch (err) {
      toastError(err, 'Failed to update branch');
    }
  };

  if (schoolError || branchesError) {
    return (
      <div className="space-y-4">
        <PageBackLink href={backHref} />
        <p className="text-sm text-destructive">
          Could not load this school or its branches. Check that you are signed in with the right
          account.
        </p>
      </div>
    );
  }

  if (schoolLoading || !school) {
    return <PageSkeleton cards={4} />;
  }

  const headerDescription =
    canManageBranches && user?.role === 'DIRECTOR'
      ? 'Locations for this school. Add a branch by name; you can link a branch director from Users when ready.'
      : user?.role === 'BRANCH_DIRECTOR'
        ? 'Your branch location for this school.'
        : 'Branches for this school.';

  return (
    <div className="space-y-6">
      <PageBackLink href={backHref} />

      <PageHeader
        title={school.name}
        description={headerDescription}
        actions={
          canManageBranches ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add branch
            </Button>
          ) : null
        }
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setName('');
            setBranchDirectorUserId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md shadow-overlay">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add branch</DialogTitle>
              <DialogDescription>
                School directors and admins can assign a branch director when creating the branch or later
                from each branch card. Invite people from{' '}
                <Link href="/users" className="font-medium text-primary underline-offset-4 hover:underline">
                  Users
                </Link>{' '}
                if needed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="branch-name">Branch name</Label>
                <Input
                  id="branch-name"
                  placeholder="e.g. Main Campus"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-director-user">Branch director (optional)</Label>
                {directorsLoading ? (
                  <div className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />
                ) : directorsErrorMessage ? (
                  <p className="text-sm text-destructive">{directorsErrorMessage}</p>
                ) : assignableBranchDirectors.length > 0 ? (
                  <Select
                    value={branchDirectorUserId || '__none__'}
                    onValueChange={(v) =>
                      setBranchDirectorUserId(v === '__none__' ? '' : (v ?? ''))
                    }
                  >
                    <SelectTrigger id="branch-director-user" className="w-full">
                      <SelectValue placeholder="Assign later" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Assign later</SelectItem>
                      {assignableBranchDirectors.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name ?? u.email} · {u.email}
                          {u.school?.name
                            ? ` · ${u.school.name}`
                            : !u.schoolId && !u.branchId
                              ? ' · not linked to a school yet'
                              : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (branchDirectorOptions?.length ?? 0) > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    All branch directors for this school are already on a branch. Add another from{' '}
                    <Link href="/users" className="font-medium text-primary underline-offset-4 hover:underline">
                      Users
                    </Link>
                    , leave this unset for now, or change assignments from the branch or Users screens.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No branch director accounts for this school yet — skip this and add one from{' '}
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
              <Button type="submit" disabled={isCreating || !name.trim() || directorsLoading}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={branchForDirectorDialog != null}
        onOpenChange={(open) => {
          if (!open) {
            setBranchForDirectorDialog(null);
            setBranchEditName('');
            setDirectorAssignUserId(DIRECTOR_ASSIGN_SYNC);
          }
        }}
      >
        <DialogContent className="sm:max-w-md shadow-overlay">
          <form onSubmit={handleBranchEditSave}>
            <DialogHeader>
              <DialogTitle>Edit branch</DialogTitle>
              <DialogDescription>
                {branchForDirectorDialog
                  ? `Update ${branchForDirectorDialog.name}. You can rename it and assign or unassign a branch director.`
                  : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-branch-name">Branch name</Label>
                <Input
                  id="edit-branch-name"
                  value={branchEditName}
                  onChange={(e) => setBranchEditName(e.target.value)}
                  placeholder="e.g. Main Campus"
                />
              </div>
              {branchDetailLoading ? (
                <div className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />
              ) : branchDetailError ? (
                <p className="text-sm text-destructive">Could not load this branch.</p>
              ) : directorOptionsForAssign.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="assign-branch-director">Branch director</Label>
                  <Select
                    value={directorSelectValue}
                    onValueChange={(v) => setDirectorAssignUserId(v ?? '__none__')}
                  >
                    <SelectTrigger id="assign-branch-director" className="w-full">
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {directorOptionsForAssign.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name ?? u.email} · {u.email}
                          {u.school?.name
                            ? ` · ${u.school.name}`
                            : !u.schoolId && !u.branchId
                              ? ' · not linked to a school yet'
                              : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No branch directors available to assign. Add one from{' '}
                  <Link href="/users" className="font-medium text-primary underline-offset-4 hover:underline">
                    Users
                  </Link>
                  .
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBranchForDirectorDialog(null);
                  setBranchEditName('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isUpdatingDirector ||
                  !branchEditName.trim() ||
                  branchDetailLoading ||
                  branchDetailError
                }
              >
                {isUpdatingDirector ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {branchesLoading ? (
        <PageSkeleton cards={4} />
      ) : !branches?.length ? (
        <EmptyState
          icon={Building2}
          title="No branches yet"
          description={
            canManageBranches
              ? 'Add a branch by name. You can assign a branch director afterward from Users if you prefer.'
              : 'No branches have been added for this school yet.'
          }
          action={
            canManageBranches ? { label: 'Add branch', onClick: () => setDialogOpen(true) } : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className="group relative h-full shadow-elevated transition-colors hover:border-primary/25 hover:bg-muted/30"
            >
              <Link
                href={`/branches/${branch.id}`}
                aria-label={`Open ${branch.name}`}
                className="inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 "
              >
              <CardHeader className="relative z-10 flex flex-row items-center gap-2 space-y-0">
                <Building2 className="h-5 w-5 shrink-0 text-primary" />
                <CardTitle className="min-w-0 flex-1 text-base font-semibold">{branch.name}</CardTitle>
                {canManageBranches ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    aria-label={`Edit ${branch.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDirectorAssignUserId(DIRECTOR_ASSIGN_SYNC);
                      setBranchEditName(branch.name);
                      setBranchForDirectorDialog({ id: branch.id, name: branch.name });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}
              </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
