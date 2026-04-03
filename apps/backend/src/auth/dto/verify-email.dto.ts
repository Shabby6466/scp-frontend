import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(32, { message: 'Invalid token' })
  token?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;
}
