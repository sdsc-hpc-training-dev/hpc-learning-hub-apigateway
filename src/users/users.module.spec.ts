import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';

describe('UsersModule', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    service = module.get(UsersService);
  });

  it('registers the user service with Nest dependency injection', () => {
    expect(service).toBeInstanceOf(UsersService);
  });

  it('returns an empty list until user persistence is implemented', () => {
    expect(service.findAll()).toEqual([]);
  });
});
