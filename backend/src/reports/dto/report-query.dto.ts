import { IsIn, IsOptional, IsString } from 'class-validator';

const REPORT_STATUSES = [
  'DRAFT',
  'PENDING_DIRECTOR_APPROVAL',
  'PENDING_CAO_APPROVAL',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
] as const;

export class ReportQueryDto {
  @IsOptional()
  @IsString()
  agendaItemId?: string;

  @IsOptional()
  @IsIn(REPORT_STATUSES)
  status?: (typeof REPORT_STATUSES)[number];
}
