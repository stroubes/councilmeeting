import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
