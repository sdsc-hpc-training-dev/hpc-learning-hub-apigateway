import { Module } from '@nestjs/common';
import { ActiveSnapshotQuery } from './persistence/active-snapshot.query';
import { TrainingLibraryRepository } from './persistence/training-library.repository';
import { TrainingLibraryController } from './training-library.controller';
import { TrainingLibraryService } from './training-library.service';

@Module({
  controllers: [TrainingLibraryController],
  providers: [
    TrainingLibraryService,
    TrainingLibraryRepository,
    ActiveSnapshotQuery,
  ],
  exports: [TrainingLibraryService],
})
export class TrainingLibraryModule {}
