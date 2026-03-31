import { IsIn, IsOptional } from 'class-validator';

export class WorkflowConfigQueryDto {
  @IsOptional()
  @IsIn(['REPORT'])
  domain?: 'REPORT';

  @IsOptional()
  @IsIn(['true', 'false', '1', '0'])
  includeInactive?: string;
}
