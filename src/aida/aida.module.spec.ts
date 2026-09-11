import { Test, TestingModule } from '@nestjs/testing';
import { AidaController } from './aida.controller';
import { AidaModule } from './aida.module';
import { AidaService } from './aida.service';

describe('AidaModule', () => {
  let controller: AidaController;
  let service: AidaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AidaModule],
    }).compile();

    controller = module.get(AidaController);
    service = module.get(AidaService);
  });

  it('registers the controller and service with Nest dependency injection', () => {
    expect(controller).toBeInstanceOf(AidaController);
    expect(service).toBeInstanceOf(AidaService);
  });

  it('returns an empty list until AIDA behavior is implemented', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('delegates AIDA retrieval from the controller to the service', () => {
    const findAll = jest.spyOn(service, 'findAll');

    expect(controller.findAll()).toEqual([]);
    expect(findAll).toHaveBeenCalledTimes(1);
  });
});
