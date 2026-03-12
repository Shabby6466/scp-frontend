import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import type { Prisma } from '@prisma/client';

export class UpdateDocumentTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  schema?: Prisma.InputJsonValue;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}
