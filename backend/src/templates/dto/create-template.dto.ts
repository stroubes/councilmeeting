import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsIn(['AGENDA', 'STAFF_REPORT'])
  type!: 'AGENDA' | 'STAFF_REPORT';

  @IsString()
  @MaxLength(120)
  code!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
