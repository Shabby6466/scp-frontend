import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { DocumentCategory } from '@prisma/client';

export class CompleteDocumentDto {
  @IsEnum(DocumentCategory)
  category!: DocumentCategory;

  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @IsString()
  @IsNotEmpty()
  documentTypeId!: string;

  @IsString()
  @IsNotEmpty()
  s3Key!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsOptional()
  @IsString()
  expiresAt?: string; // ISO date string

  /** Issue / issuance date (YYYY-MM-DD or full ISO). */
  @IsOptional()
  @IsString()
  issuedAt?: string;
}
