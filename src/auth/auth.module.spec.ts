import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';

describe('AuthModule', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
  });

  it('registers the controller and service with Nest dependency injection', () => {
    expect(controller).toBeInstanceOf(AuthController);
    expect(service).toBeInstanceOf(AuthService);
  });

  it('returns an empty list until authentication behavior is implemented', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('delegates authentication retrieval from the controller to the service', () => {
    const findAll = jest.spyOn(service, 'findAll');

    expect(controller.findAll()).toEqual([]);
    expect(findAll).toHaveBeenCalledTimes(1);
  });
});
