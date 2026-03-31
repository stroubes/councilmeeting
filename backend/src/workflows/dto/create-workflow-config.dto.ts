import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateWorkflowConfigDto {
  @IsString()
  @MaxLength(120)
  @Matches(/^[A-Z0-9_]+$/)
  code!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['REPORT'])
  domain!: 'REPORT';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
