import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const MEETING_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'ADJOURNED', 'CANCELLED', 'COMPLETED'] as const;

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  meetingTypeCode?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsIn(MEETING_STATUSES)
  status?: (typeof MEETING_STATUSES)[number];

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
