import { IsOptional, IsString, IsUUID, IsObject } from 'class-validator';

export class CreateBylawDto {
  @IsString()
  bylawNumber!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  contentJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  adoptedAt?: string;
}
