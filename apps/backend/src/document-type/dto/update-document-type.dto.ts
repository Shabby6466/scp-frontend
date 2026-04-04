import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { RenewalPeriod, UserRole } from '@prisma/client';

export class UpdateDocumentTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(RenewalPeriod)
  renewalPeriod?: RenewalPeriod;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  targetRole?: UserRole;
}
