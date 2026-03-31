import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ImportDocxReportDto {
  @IsString()
  agendaItemId!: string;

  @IsString()
  @MaxLength(500)
  fileName!: string;

  @IsOptional()
  @IsString()
  contentBase64?: string;

  @IsOptional()
  @IsString()
  sharePointSiteId?: string;

  @IsOptional()
  @IsString()
  sharePointDriveId?: string;

  @IsOptional()
  @IsString()
  sharePointItemId?: string;

  @IsOptional()
  @IsString()
  sharePointWebUrl?: string;

  @IsOptional()
  @IsString()
  workflowConfigId?: string;
}
