import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMotionDto {
  @IsString()
  meetingId!: string;

  @IsOptional()
  @IsString()
  agendaItemId?: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsString()
  body!: string;
}
