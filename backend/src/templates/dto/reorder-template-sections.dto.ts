import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderTemplateSectionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  sectionIdsInOrder!: string[];
}
