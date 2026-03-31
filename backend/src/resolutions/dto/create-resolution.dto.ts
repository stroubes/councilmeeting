import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateResolutionDto {
  @IsString()
  meetingId!: string;

  @IsOptional()
  @IsString()
  agendaItemId?: string;

  @IsOptional()
  @IsString()
  motionId?: string;

  @IsString()
  @MaxLength(100)
  resolutionNumber!: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsString()
  body!: string;

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
  @IsBoolean()
  isActionRequired?: boolean;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
