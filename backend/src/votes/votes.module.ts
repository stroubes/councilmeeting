import { Module } from '@nestjs/common';
import { MotionsModule } from '../motions/motions.module';
import { ConflictDeclarationsModule } from '../conflict-declarations/conflict-declarations.module';
import { VotesController } from './votes.controller';
import { VotesRepository } from './votes.repository';
import { VotesService } from './votes.service';

@Module({
  imports: [MotionsModule, ConflictDeclarationsModule],
  controllers: [VotesController],
  providers: [VotesRepository, VotesService],
  exports: [VotesService, VotesRepository],
})
export class VotesModule {}