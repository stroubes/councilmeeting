import { IsInt, Min } from 'class-validator';

export class SetPresentationSlideDto {
  @IsInt()
  @Min(1)
  slideNumber!: number;
}
