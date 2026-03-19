import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderAgendaItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  itemIdsInOrder!: string[];
}
