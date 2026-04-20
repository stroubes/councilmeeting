import { Module } from '@nestjs/common';
import { ConflictDeclarationsController } from './conflict-declarations.controller';
import { ConflictDeclarationsService } from './conflict-declarations.service';
import { ConflictDeclarationsRepository } from './conflict-declarations.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ConflictDeclarationsController],
  providers: [ConflictDeclarationsService, ConflictDeclarationsRepository],
  exports: [ConflictDeclarationsService, ConflictDeclarationsRepository],
})
export class ConflictDeclarationsModule {}