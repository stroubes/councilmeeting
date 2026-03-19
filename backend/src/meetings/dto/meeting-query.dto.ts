import { IsBooleanString, IsIn, IsOptional } from 'class-validator';

const MEETING_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'ADJOURNED', 'CANCELLED', 'COMPLETED'] as const;

export class MeetingQueryDto {
  @IsOptional()
  @IsBooleanString()
  inCamera?: string;

  @IsOptional()
  @IsBooleanString()
  publicOnly?: string;

  @IsOptional()
  @IsIn(MEETING_STATUSES)
  status?: (typeof MEETING_STATUSES)[number];
}
