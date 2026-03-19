import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStaffReportDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

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
