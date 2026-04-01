import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentCategory } from '@prisma/client';

export class PresignDto {
  @IsEnum(DocumentCategory)
  category!: DocumentCategory;

  @IsString()
  @IsNotEmpty()
  entityId!: string; // childId, staffId (userId), or branchId

  @IsString()
  @IsNotEmpty()
  documentTypeId!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}
