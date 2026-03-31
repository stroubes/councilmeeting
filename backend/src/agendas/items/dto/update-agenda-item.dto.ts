import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateAgendaItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isInCamera?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublicVisible?: boolean;

  @IsOptional()
  @IsString()
  publishAt?: string;

  @IsOptional()
  @IsString()
  redactionNote?: string;

  @IsOptional()
  @IsBoolean()
  carryForwardToNext?: boolean;

  @IsOptional()
  @IsUUID()
  bylawId?: string;

  @IsOptional()
  @IsString()
  itemNumber?: string;
}
