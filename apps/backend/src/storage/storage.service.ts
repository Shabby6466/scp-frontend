import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type {
  StorageDriver,
  PresignedUploadResult,
} from './storage-driver.interface.js';
import { S3StorageDriver } from './s3-storage.driver.js';
import { SupabaseStorageDriver } from './supabase-storage.driver.js';

/**
 * Object storage facade. Default provider is **Supabase Storage** (`STORAGE_PROVIDER=supabase`).
 * Set `STORAGE_PROVIDER=s3` and configure `AWS_*` / `S3_BUCKET_NAME` to use S3 instead.
 */
@Injectable()
export class StorageService {
  private readonly driver: StorageDriver;

  constructor(private readonly config: ConfigService) {
    const provider = (
      this.config.get<string>('STORAGE_PROVIDER') ?? 'supabase'
    ).toLowerCase();
    this.driver =
      provider === 's3'
        ? new S3StorageDriver(this.config)
        : new SupabaseStorageDriver(this.config);
  }

  /** Same logical key shape for every provider (stored in `Document.s3Key`). */
  buildDocumentKey(
    schoolId: string,
    branchId: string,
    category: string,
    entityId: string,
    fileName: string,
  ): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uuid = randomUUID();
    return `schools/${schoolId}/branches/${branchId}/${category}/${entityId}/${uuid}-${safeName}`;
  }

  isConfigured(): boolean {
    return this.driver.isConfigured();
  }

  async createPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<PresignedUploadResult> {
    return this.driver.createPresignedUploadUrl(
      key,
      contentType,
      expiresInSeconds,
    );
  }

  async createPresignedDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    return this.driver.createPresignedDownloadUrl(key, expiresInSeconds);
  }
}
