import { Module } from '@nestjs/common';
import { BylawsController } from './bylaws.controller';
import { BylawsService } from './bylaws.service';
import { BylawsRepository } from './bylaws.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BylawsController],
  providers: [BylawsService, BylawsRepository],
  exports: [BylawsService],
})
export class BylawsModule {}
