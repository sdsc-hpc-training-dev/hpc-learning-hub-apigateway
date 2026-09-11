import { Module } from '@nestjs/common';
import { TrainingLibraryController } from './training-library.controller';
import { TrainingLibraryService } from './training-library.service';

@Module({
  controllers: [TrainingLibraryController],
  providers: [TrainingLibraryService],
})
export class TrainingLibraryModule {}
