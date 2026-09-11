import { Test, TestingModule } from '@nestjs/testing';
import { TrainingLibraryModule } from './training-library.module';
import { TrainingLibraryController } from './training-library.controller';
import { TrainingLibraryService } from './training-library.service';

describe('TrainingLibraryModule', () => {
  let controller: TrainingLibraryController;
  let service: TrainingLibraryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrainingLibraryModule],
    }).compile();

    controller = module.get(TrainingLibraryController);
    service = module.get(TrainingLibraryService);
  });

  it('registers the controller and service with Nest dependency injection', () => {
    expect(controller).toBeInstanceOf(TrainingLibraryController);
    expect(service).toBeInstanceOf(TrainingLibraryService);
  });

  it('returns an empty list until training library persistence is implemented', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('delegates training library retrieval from the controller to the service', () => {
    const findAll = jest.spyOn(service, 'findAll');

    expect(controller.findAll()).toEqual([]);
    expect(findAll).toHaveBeenCalledTimes(1);
  });
});
