import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStaffReportDto {
  @IsString()
  agendaItemId!: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  workflowConfigId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reportNumber?: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  department?: string;

  @IsOptional()
  @IsString()
  executiveSummary?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsString()
  financialImpact?: string;

  @IsOptional()
  @IsString()
  legalImpact?: string;
}
