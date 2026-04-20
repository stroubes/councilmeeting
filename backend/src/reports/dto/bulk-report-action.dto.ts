import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class BulkReportActionDto {
  @IsArray()
  @IsString({ each: true })
  reportIds!: string[];

  @IsIn(['SUBMIT', 'RESUBMIT', 'PUBLISH'])
  action!: 'SUBMIT' | 'RESUBMIT' | 'PUBLISH';

  @IsOptional()
  @IsString()
  @MinLength(3)
  comments?: string;
}
