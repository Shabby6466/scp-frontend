import { IsNotEmpty, IsString } from 'class-validator';

export class PresignDto {
  @IsString()
  @IsNotEmpty()
  ownerUserId!: string;

  @IsString()
  @IsNotEmpty()
  documentTypeId!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}
