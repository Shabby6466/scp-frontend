import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  /** School-level managers only: set, change, or clear (empty string) the branch director. */
  @IsOptional()
  @IsString()
  branchDirectorUserId?: string;
}
