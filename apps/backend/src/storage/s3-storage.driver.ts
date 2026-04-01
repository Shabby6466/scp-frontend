import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageDriver, PresignedUploadResult } from './storage-driver.interface.js';

export class S3StorageDriver implements StorageDriver {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION') ?? 'us-east-1';
    this.bucket = this.config.get<string>('S3_BUCKET_NAME') ?? '';

    this.client = new S3Client({
      region,
      credentials:
        this.config.get<string>('AWS_ACCESS_KEY_ID') &&
        this.config.get<string>('AWS_SECRET_ACCESS_KEY')
          ? {
              accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
              secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
            }
          : undefined,
    });
  }

  isConfigured(): boolean {
    return !!this.bucket && !!this.config.get<string>('AWS_ACCESS_KEY_ID');
  }

  async createPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
    return { uploadUrl };
  }

  async createPresignedDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
