import { IsIn, IsOptional, IsString } from 'class-validator';

export class TemplateQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['AGENDA', 'STAFF_REPORT'])
  type?: 'AGENDA' | 'STAFF_REPORT';

  @IsOptional()
  @IsString()
  includeInactive?: string;
}
