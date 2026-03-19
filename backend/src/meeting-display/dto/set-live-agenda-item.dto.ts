import { IsString } from 'class-validator';

export class SetLiveAgendaItemDto {
  @IsString()
  agendaItemId!: string;
}
