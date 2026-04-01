import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
