import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CastVoteDto {
  @IsUUID()
  motionId!: string;

  @IsUUID()
  councilMemberId!: string;

  @IsString()
  voteValue!: 'YEA' | 'NAY' | 'ABSTAIN' | 'ABSENT';

  @IsOptional()
  @IsBoolean()
  isConflictDeclared?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateVoteDto {
  @IsOptional()
  @IsString()
  voteValue?: 'YEA' | 'NAY' | 'ABSTAIN' | 'ABSENT';

  @IsOptional()
  @IsBoolean()
  isConflictDeclared?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}