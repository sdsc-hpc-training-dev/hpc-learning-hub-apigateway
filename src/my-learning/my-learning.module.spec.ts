import { Test, TestingModule } from '@nestjs/testing';
import { MyLearningController } from './my-learning.controller';
import { MyLearningModule } from './my-learning.module';
import { MyLearningService } from './my-learning.service';

describe('MyLearningModule', () => {
  let controller: MyLearningController;
  let service: MyLearningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MyLearningModule],
    }).compile();

    controller = module.get(MyLearningController);
    service = module.get(MyLearningService);
  });

  it('registers the controller and service with Nest dependency injection', () => {
    expect(controller).toBeInstanceOf(MyLearningController);
    expect(service).toBeInstanceOf(MyLearningService);
  });

  it('returns an empty list until personal learning behavior is implemented', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('delegates personal learning retrieval from controller to service', () => {
    const findAll = jest.spyOn(service, 'findAll');

    expect(controller.findAll()).toEqual([]);
    expect(findAll).toHaveBeenCalledTimes(1);
  });
});
