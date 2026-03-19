import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAgendaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}
