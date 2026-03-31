import { IsObject, IsOptional, IsString } from 'class-validator';
import type { MinutesContent } from '../minutes-content';

export class UpdateMinutesDto {
  @IsOptional()
  @IsObject()
  contentJson?: MinutesContent;

  @IsOptional()
  @IsObject()
  richTextSummary?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  note?: string;
}
