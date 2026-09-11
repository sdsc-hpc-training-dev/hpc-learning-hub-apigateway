import { Module } from '@nestjs/common';
import { MyLearningController } from './my-learning.controller';
import { MyLearningService } from './my-learning.service';

@Module({
  controllers: [MyLearningController],
  providers: [MyLearningService],
})
export class MyLearningModule {}
