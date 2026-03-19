import { IsString } from 'class-validator';

export class SetLivePresentationDto {
  @IsString()
  presentationId!: string;
}
