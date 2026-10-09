import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MyLearningController } from './my-learning.controller';
import { MyLearningService } from './my-learning.service';
import { MyLearningRepository } from './persistence/my-learning.repository';
import { BookmarksController } from './bookmarks.controller';

@Module({
  imports: [AuthModule],
  controllers: [MyLearningController, BookmarksController],
  providers: [MyLearningService, MyLearningRepository],
})
export class MyLearningModule {}
