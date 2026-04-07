import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, StaffPosition } from '@prisma/client';
import { Transform } from 'class-transformer';

export class SearchUserDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsEnum(StaffPosition)
  staffPosition?: StaffPosition;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  staffClearanceActive?: boolean;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;
}
