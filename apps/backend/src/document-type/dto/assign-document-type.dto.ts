import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignDocumentTypeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  userIds!: string[];
}
