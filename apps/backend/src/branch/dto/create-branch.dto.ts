import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @MinLength(1)
  name!: string;

  /** If set: existing BRANCH_DIRECTOR for this school with no branch yet (`branchId` null) is assigned to the new branch. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  branchDirectorUserId?: string;
}
