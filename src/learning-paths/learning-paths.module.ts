import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuratedLearningPath } from '../database/entities/curated-learning-path.entity';
import { LearningPathsController } from './learning-paths.controller';
import { LearningPathsService } from './learning-paths.service';
import { LearningPathsRepository } from './persistence/learning-paths.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CuratedLearningPath])],
  controllers: [LearningPathsController],
  providers: [LearningPathsService, LearningPathsRepository],
})
export class LearningPathsModule {}
