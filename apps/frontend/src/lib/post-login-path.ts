/** Where to send the user immediately after login or email verification. */
export function getPostLoginPath(
  role: string,
  user?: { branchId?: string | null },
): string {
  if (role === 'ADMIN') {
    return '/dashboard';
  }
  // Pool branch directors (no branch yet) go to dashboard until a school director assigns a branch.
  if (role === 'BRANCH_DIRECTOR' && user?.branchId) {
    return `/branches/${user.branchId}`;
  }
  if (role === 'DIRECTOR') {
    return '/branches';
  }
  if (role === 'BRANCH_DIRECTOR') {
    return '/teachers';
  }
  if (role === 'TEACHER') {
    return '/my-documents';
  }
  if (role === 'STUDENT') {
    return '/my-documents';
  }
  return '/dashboard';
}
