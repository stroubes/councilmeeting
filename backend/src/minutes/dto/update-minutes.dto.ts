import { IsObject, IsOptional, IsString } from 'class-validator';
import type { MinutesContent } from '../minutes-content';

export class UpdateMinutesDto {
  @IsOptional()
  @IsObject()
  contentJson?: MinutesContent;

  @IsOptional()
  @IsString()
  note?: string;
}
