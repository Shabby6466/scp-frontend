import { IsBoolean, IsEmail, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateChildDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  /** Login for the student (one user per child record). */
  @IsEmail()
  studentEmail!: string;

  @IsString()
  @IsOptional()
  studentName?: string;

  @IsString()
  @IsOptional()
  guardianName?: string;

  @IsString()
  @IsOptional()
  guardianEmail?: string;

  @IsString()
  @IsOptional()
  guardianPhone?: string;

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
}
