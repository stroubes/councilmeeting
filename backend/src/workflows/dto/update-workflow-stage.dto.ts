import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class UpdateWorkflowStageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[A-Z0-9_]+$/)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  approverRole?: string;

  @IsOptional()
  @IsBoolean()
  requireOnlyOneApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  isOrdered?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumApprovals?: number;
}
