import { Test, TestingModule } from '@nestjs/testing';
import { LearningPathsController } from './learning-paths.controller';
import { LearningPathsModule } from './learning-paths.module';
import { LearningPathsService } from './learning-paths.service';

describe('LearningPathsModule', () => {
  let controller: LearningPathsController;
  let service: LearningPathsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LearningPathsModule],
    }).compile();

    controller = module.get(LearningPathsController);
    service = module.get(LearningPathsService);
  });

  it('registers the controller and service with Nest dependency injection', () => {
    expect(controller).toBeInstanceOf(LearningPathsController);
    expect(service).toBeInstanceOf(LearningPathsService);
  });

  it('returns an empty list until learning path persistence is implemented', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('delegates learning path retrieval from the controller to the service', () => {
    const findAll = jest.spyOn(service, 'findAll');

    expect(controller.findAll()).toEqual([]);
    expect(findAll).toHaveBeenCalledTimes(1);
  });
});
