import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import type { Prisma } from '@prisma/client';

export class CreateDocumentTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  schema!: Prisma.InputJsonValue;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}
