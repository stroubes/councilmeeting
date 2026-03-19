import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAgendaDto {
  @IsString()
  meetingId!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}
