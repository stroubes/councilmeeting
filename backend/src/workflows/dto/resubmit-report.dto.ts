import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResubmitReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;
}
