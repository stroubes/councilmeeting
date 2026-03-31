import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class StandingItemDto {
  @IsString()
  itemType!: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isInCamera?: boolean;

  @IsOptional()
  @IsBoolean()
  carryForwardToNext?: boolean;
}

class MeetingTypeWizardConfigDto {
  @IsOptional()
  @IsString()
  defaultAgendaTemplateId?: string;

  @IsOptional()
  @IsString()
  defaultWorkflowCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  publishWindowHours?: number;

  @IsOptional()
  @IsBoolean()
  carryForwardEnabled?: boolean;
}

export class UpdateMeetingTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isInCamera?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => MeetingTypeWizardConfigDto)
  wizardConfig?: MeetingTypeWizardConfigDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StandingItemDto)
  standingItems?: StandingItemDto[];
}
