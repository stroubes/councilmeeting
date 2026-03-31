import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import type { MinutesContent } from '../minutes-content';

export class CreateMinutesDto {
  @IsString()
  meetingId!: string;

  @IsOptional()
  @IsObject()
  contentJson?: MinutesContent;

  @IsOptional()
  @IsBoolean()
  isInCamera?: boolean;
}
