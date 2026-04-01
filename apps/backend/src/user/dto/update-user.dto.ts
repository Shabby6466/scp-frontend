import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  name?: string;

  /** When set and non-empty, replaces the account password (min 8 characters). */
  @ValidateIf((o: UpdateUserDto) => typeof o.password === 'string' && o.password.length > 0)
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  /** Platform admin only: link a school director to a school (empty string clears). */
  @IsOptional()
  @IsString()
  schoolId?: string;

  /** Platform admin only: set teacher or branch director branch (empty string clears). */
  @IsOptional()
  @IsString()
  branchId?: string;
}
