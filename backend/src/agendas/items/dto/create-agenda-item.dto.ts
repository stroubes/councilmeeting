import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const AGENDA_ITEM_TYPES = [
  'SECTION',
  'STAFF_REPORT',
  'MOTION',
  'BYLAW',
  'INFO_ITEM',
  'CONSENT_ITEM',
  'OTHER',
] as const;

export class CreateAgendaItemDto {
  @IsIn(AGENDA_ITEM_TYPES)
  itemType!: (typeof AGENDA_ITEM_TYPES)[number];

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentItemId?: string;

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
}
