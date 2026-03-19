import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTemplateSectionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sectionType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  itemType?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
