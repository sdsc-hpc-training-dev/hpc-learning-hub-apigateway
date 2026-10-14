import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersModule } from './users.module';
import { AuthenticationRepository } from '../auth/persistence/auth.repository';
import { PasswordService } from '../auth/password.service';
import { UsersRepository } from './persistence/user.repository';
import { UsersService } from './users.service';

describe('UsersModule', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(AuthenticationRepository)
      .useValue({})
      .overrideProvider(PasswordService)
      .useValue({ hash: jest.fn() })
      .overrideProvider(UsersRepository)
      .useValue({})
      .compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('registers the user controller and service with Nest dependency injection', () => {
    expect(controller).toBeInstanceOf(UsersController);
    expect(service).toBeInstanceOf(UsersService);
  });
});
