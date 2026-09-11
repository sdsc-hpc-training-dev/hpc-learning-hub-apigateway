import { Controller, Get } from '@nestjs/common';
import { MyLearningService } from './my-learning.service';

@Controller('my-learning')
export class MyLearningController {
  constructor(private readonly myLearningService: MyLearningService) {}

  @Get()
  findAll(): [] {
    return this.myLearningService.findAll();
  }
}
