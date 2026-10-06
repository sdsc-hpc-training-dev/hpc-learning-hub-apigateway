import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { AuthenticationRepository } from './persistence/auth.repository';

describe('AuthModule', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(AuthenticationRepository)
      .useValue({})
      .compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
  });

  it('registers the controller and service with Nest dependency injection', () => {
    expect(controller).toBeInstanceOf(AuthController);
    expect(service).toBeInstanceOf(AuthService);
  });
});
