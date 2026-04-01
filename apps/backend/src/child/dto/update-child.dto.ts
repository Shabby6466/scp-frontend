import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateChildDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsBoolean()
  @IsOptional()
  hasAllergies?: boolean;

  @IsBoolean()
  @IsOptional()
  hasAsthma?: boolean;

  @IsBoolean()
  @IsOptional()
  hasDiabetes?: boolean;

  @IsBoolean()
  @IsOptional()
  hasSeizures?: boolean;

  @IsBoolean()
  @IsOptional()
  takesMedsAtSchool?: boolean;

  @IsString()
  @IsOptional()
  guardianName?: string;

  @IsString()
  @IsOptional()
  guardianEmail?: string;

  @IsString()
  @IsOptional()
  guardianPhone?: string;
}
