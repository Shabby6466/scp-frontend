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
  if (role === 'DIRECTOR' || role === 'SCHOOL_ADMIN') {
    return '/branches';
  }
  if (role === 'STUDENT') {
    return '/my-children';
  }
  return '/dashboard';
}
