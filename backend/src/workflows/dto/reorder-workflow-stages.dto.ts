import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderWorkflowStagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  stageIdsInOrder!: string[];
}
