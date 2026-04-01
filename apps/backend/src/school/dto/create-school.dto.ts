import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  @MinLength(1)
  name!: string;

  /** If set, must be an existing user with role DIRECTOR; they are linked to this school. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  directorUserId?: string;
}
