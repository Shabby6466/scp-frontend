/** Aligned with `NEAR_EXPIRY_DAYS` in branch-dashboard.service.ts */
export const NEAR_EXPIRY_DAYS = 30;

export type DocumentExpiryStatus = 'active' | 'near_expiry' | 'expired' | 'no_expiry';

export function getDocumentExpiryStatus(
  expiresAt: string | null | undefined,
  now = new Date(),
): DocumentExpiryStatus {
  if (expiresAt == null || expiresAt === '') return 'no_expiry';
  const exp = new Date(expiresAt);
  if (Number.isNaN(exp.getTime())) return 'no_expiry';

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  if (expiryDay < startOfToday) return 'expired';

  const nearLimit = new Date(startOfToday);
  nearLimit.setDate(nearLimit.getDate() + NEAR_EXPIRY_DAYS);
  if (exp <= nearLimit) return 'near_expiry';
  return 'active';
}

export function formatDocumentDate(iso: string | null | undefined): string {
  if (iso == null || iso === '') return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function expiryStatusLabel(status: DocumentExpiryStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'near_expiry':
      return 'Near expiry';
    case 'expired':
      return 'Expired';
    case 'no_expiry':
      return 'No expiry';
    default:
      return '—';
  }
}
