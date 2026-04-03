import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CompleteDocumentDto {
  @IsString()
  @IsNotEmpty()
  ownerUserId!: string;

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
  expiresAt?: string;

  /** Issue / issuance date (YYYY-MM-DD or full ISO). */
  @IsOptional()
  @IsString()
  issuedAt?: string;
}
