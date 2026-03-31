import { Module } from '@nestjs/common';
import { MotionsModule } from '../motions/motions.module';
import { VotesController } from './votes.controller';
import { VotesRepository } from './votes.repository';
import { VotesService } from './votes.service';

@Module({
  imports: [MotionsModule],
  controllers: [VotesController],
  providers: [VotesRepository, VotesService],
  exports: [VotesService, VotesRepository],
})
export class VotesModule {}