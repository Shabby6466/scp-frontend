import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAppSettingsDto {
  @IsOptional()
  @IsBoolean()
  otpEmailVerificationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  selfRegistrationEnabled?: boolean;
}
