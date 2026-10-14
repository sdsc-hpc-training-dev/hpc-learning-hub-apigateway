import { UserRole } from '../database/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const registerUser = jest.fn();
  const findUserById = jest.fn();
  const usersService = {
    registerUser,
    findUserById,
  } as unknown as jest.Mocked<UsersService>;
  const controller = new UsersController(usersService);

  beforeEach(() => jest.clearAllMocks());

  it('passes registration input to the user service', async () => {
    const input = {
      email: 'learner@example.com',
      username: 'learner',
      password: 'secure-password',
    };
    const output = {
      id: 'user-id',
      email: input.email,
      username: input.username,
      role: UserRole.LEARNER,
    };
    registerUser.mockResolvedValue(output);

    await expect(controller.registerUser(input)).resolves.toEqual(output);
    expect(registerUser).toHaveBeenCalledWith(input);
  });

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
