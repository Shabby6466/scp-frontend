import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RenewalPeriod, UserRole } from '@prisma/client';

export class CreateDocumentTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(UserRole)
  targetRole!: UserRole;

  @IsOptional()
  @IsEnum(RenewalPeriod)
  renewalPeriod?: RenewalPeriod;

  @IsOptional()
  @IsString()
  schoolId?: string;

  /** Platform admin only: scope to a branch (must belong to `schoolId`). */
  @IsOptional()
  @IsString()
  branchId?: string;
}
