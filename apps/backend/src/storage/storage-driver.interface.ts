/**
 * Pluggable object storage. Implementations: Supabase Storage (default) and S3.
 * Switch with env `STORAGE_PROVIDER=supabase` | `s3`.
 */
export type PresignedUploadResult = {
  uploadUrl: string;
  /** Supabase signed upload URLs require `Authorization: Bearer <token>` on PUT. */
  uploadToken?: string;
};

export interface StorageDriver {
  isConfigured(): boolean;
  createPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<PresignedUploadResult>;
  createPresignedDownloadUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string>;
}
