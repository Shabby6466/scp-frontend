export const EXPIRY_WARNING_DAYS = [90, 60, 30] as const;

export const SIGNED_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes

export const SUPABASE_BUCKET = 'documents';

export const JWT_DEFAULTS = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
