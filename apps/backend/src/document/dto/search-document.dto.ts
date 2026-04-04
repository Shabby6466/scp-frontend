import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';

export class SearchDocumentDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  documentTypeId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || (value === 'false' || value === false ? false : undefined))
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  ownerRole?: UserRole;
}
