import { UserRole } from '../database/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const findUserById = jest.fn();
  const usersService = {
    findUserById,
  } as unknown as jest.Mocked<UsersService>;
  const controller = new UsersController(usersService);

  beforeEach(() => jest.clearAllMocks());

  it('uses the session-authenticated identity for GET /me', async () => {
    const output = {
      id: 'user-id',
      email: 'learner@example.com',
      username: 'learner',
      role: UserRole.LEARNER,
    };
    findUserById.mockResolvedValue(output);

    await expect(
      controller.findUser({ id: 'user-id', role: UserRole.LEARNER }),
    ).resolves.toEqual(output);
    expect(findUserById).toHaveBeenCalledWith('user-id');
  });
});
