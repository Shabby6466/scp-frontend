import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { StorageDriver, PresignedUploadResult } from './storage-driver.interface.js';

export class SupabaseStorageDriver implements StorageDriver {
  private clientInstance: SupabaseClient | undefined;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket =
      this.config.get<string>('SUPABASE_BUCKET') ??
      this.config.get<string>('STORAGE_BUCKET_NAME') ??
      'documents';
  }

  private client(): SupabaseClient {
    if (!this.clientInstance) {
      const url = this.config.get<string>('SUPABASE_URL')?.trim();
      const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim();
      if (!url || !key) {
        throw new Error('Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
      }
      this.clientInstance = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.clientInstance;
  }

  isConfigured(): boolean {
    return !!(
      this.config.get<string>('SUPABASE_URL')?.trim() &&
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim() &&
      this.bucket
    );
  }

  async createPresignedUploadUrl(
    key: string,
    contentType: string,
    _expiresInSeconds = 900,
  ): Promise<PresignedUploadResult> {
    const { data, error } = await this.client().storage
      .from(this.bucket)
      .createSignedUploadUrl(key);

    if (error) {
      throw new Error(`Supabase signed upload URL failed: ${error.message}`);
    }
    if (!data?.signedUrl) {
      throw new Error('Supabase signed upload URL returned no URL');
    }

    return {
      uploadUrl: data.signedUrl,
      uploadToken: data.token,
    };
  }

  async createPresignedDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const { data, error } = await this.client().storage
      .from(this.bucket)
      .createSignedUrl(key, expiresInSeconds);

    if (error) {
      throw new Error(`Supabase signed download URL failed: ${error.message}`);
    }
    if (!data?.signedUrl) {
      throw new Error('Supabase signed download URL returned no URL');
    }
    return data.signedUrl;
  }
}
