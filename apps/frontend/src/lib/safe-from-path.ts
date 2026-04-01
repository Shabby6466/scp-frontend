/** Accepts only same-origin paths (prevents open redirects). */
export function sanitizeFromPath(raw: string | null): string | null {
  if (!raw) return null;
  let p: string;
  try {
    p = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
  if (!p.startsWith('/') || p.startsWith('//')) return null;
  if (p.includes('://')) return null;
  return p;
}

/**
 * Human-readable name for the page at `href` (used as the back-link label: “where you’re going”).
 */
export function pageTitleForDestinationHref(href: string): string {
  const pathOnly = href.split('?')[0] ?? href;
  const normalized = pathOnly.replace(/\/$/, '') || '/';
  const parts = normalized.split('/').filter(Boolean);
  const [a, b, c] = parts;

  if (normalized === '/' || normalized === '/dashboard') return 'Dashboard';

  if (a === 'schools' && parts.length === 1) return 'Schools';
  if (a === 'schools' && b && !c) return 'School';
  if (a === 'schools' && b && c === 'branches') return 'Branches';
  if (a === 'schools' && b && c === 'users') return 'Users';
  if (a === 'schools' && b && c === 'teachers') return 'Teachers';

  if (a === 'school' && b === 'teachers') return 'Teachers';

  if (a === 'branches' && parts.length === 1) return 'Branches';
  if (a === 'branches' && b) return 'Branch overview';

  if (a === 'children' && b && !c) return 'Child profile';
  if (a === 'staff' && b && !c) return 'Teacher documents';

  if (a === 'profile') return 'My profile';
  if (a === 'settings') return 'Settings';
  if (a === 'users' && parts.length === 1) return 'Users';
  if (a === 'teachers' && parts.length === 1) return 'Teachers';

  if (a === 'my-branch') return 'My branch';
  if (a === 'my-children') return 'My student';
  if (a === 'my-staff-file') return 'My documents';

  return 'Previous page';
}
