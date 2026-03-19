import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @MaxLength(100)
  meetingTypeCode!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsUUID()
  recurrenceGroupId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  recurrenceIndex?: number;
}
