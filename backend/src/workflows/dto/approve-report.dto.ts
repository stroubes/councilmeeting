import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
}
