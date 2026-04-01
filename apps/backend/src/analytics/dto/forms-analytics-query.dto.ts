import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export type FormsBucket = 'day' | 'week' | 'month';

export class FormsAnalyticsQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsEnum(['day', 'week', 'month'])
  bucket!: FormsBucket;

  @IsOptional()
  @IsString()
  documentTypeId?: string;
}
