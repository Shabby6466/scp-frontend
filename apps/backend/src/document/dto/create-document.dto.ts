import { IsNotEmpty, IsObject, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentTypeId!: string;

  @IsString()
  @IsNotEmpty()
  schoolId!: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
