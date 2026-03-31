import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateResolutionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bylawNumber?: string;

  @IsOptional()
  @IsString()
  movedBy?: string;

  @IsOptional()
  @IsString()
  secondedBy?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  voteFor?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  voteAgainst?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  voteAbstain?: number;

  @IsOptional()
  @IsIn(['DRAFT', 'ADOPTED', 'DEFEATED', 'WITHDRAWN'])
  status?: 'DRAFT' | 'ADOPTED' | 'DEFEATED' | 'WITHDRAWN';

  @IsOptional()
  @IsBoolean()
  isActionRequired?: boolean;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
