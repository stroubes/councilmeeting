import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateBylawDto {
  @IsOptional()
  @IsString()
  bylawNumber?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  contentJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';

  @IsOptional()
  @IsString()
  amendedAt?: string;

  @IsOptional()
  @IsString()
  repealingMeetingId?: string;
}
