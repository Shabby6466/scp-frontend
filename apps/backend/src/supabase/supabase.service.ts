import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const key = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket = this.config.get<string>('SUPABASE_BUCKET') ?? 'documents';

    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  async uploadFile(
    path: string,
    file: Buffer,
    contentType: string,
    bucketOverride?: string,
  ) {
    const bucket = bucketOverride ?? this.bucket;
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: false, // never overwrite — versioning is handled at the app level
      });

    if (error) {
      this.logger.error(`Upload failed for ${path}: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getSignedUrl(
    path: string,
    expiresInSeconds = 900,
    bucketOverride?: string,
  ): Promise<string> {
    const bucket = bucketOverride ?? this.bucket;
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      this.logger.error(`Signed URL failed for ${path}: ${error.message}`);
      throw error;
    }

    return data.signedUrl;
  }

  async deleteFile(path: string, bucketOverride?: string) {
    const bucket = bucketOverride ?? this.bucket;
    const { error } = await this.client.storage.from(bucket).remove([path]);

    if (error) {
      this.logger.error(`Delete failed for ${path}: ${error.message}`);
      throw error;
    }
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
