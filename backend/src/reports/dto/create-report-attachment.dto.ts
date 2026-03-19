import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReportAttachmentDto {
  @IsString()
  @MaxLength(500)
  fileName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  sizeBytes?: number;

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
}
