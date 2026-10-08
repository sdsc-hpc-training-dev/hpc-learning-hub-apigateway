import { ConflictException, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '../database/entities/user.entity';
import { PasswordService } from '../auth/password.service';
import { UsersRepository } from './persistence/user.repository';
import { UsersService } from './users.service';

const user: User = {
  id: 'user-id',
  email: 'learner@example.com',
  username: 'learner',
  passwordHash: 'stored-hash',
  role: UserRole.LEARNER,
  createdAt: new Date(),
  updatedAt: new Date(),
  sessions: [],
  challenges: [],
  personalLearningPaths: [],
  bookmarks: [],
};

describe('UsersService', () => {
  let repository: jest.Mocked<UsersRepository>;
  let passwords: jest.Mocked<PasswordService>;
  let findByEmailOrUsername: jest.Mock;
  let createUser: jest.Mock;
  let findUserById: jest.Mock;
  let hashPassword: jest.Mock;
  let service: UsersService;

  beforeEach(() => {
    findByEmailOrUsername = jest.fn();
    createUser = jest.fn();
    findUserById = jest.fn();
    hashPassword = jest.fn();
    repository = {
      findByEmailOrUsername,
      createUser,
      findUserById,
    } as unknown as jest.Mocked<UsersRepository>;
    passwords = {
      hash: hashPassword,
    } as unknown as jest.Mocked<PasswordService>;
    service = new UsersService(repository, passwords);
  });

  it('creates a normalized learner account without returning its password hash', async () => {
    repository.findByEmailOrUsername.mockResolvedValue(null);
    passwords.hash.mockResolvedValue('stored-hash');
    repository.createUser.mockResolvedValue(user);

    await expect(
      service.registerUser({
        email: ' Learner@Example.com ',
        username: ' Learner ',
        password: 'secure-password',
      }),
    ).resolves.toEqual({
      id: user.id,
      email: user.email,
      username: user.username,
      role: UserRole.LEARNER,
    });

    expect(findByEmailOrUsername).toHaveBeenCalledWith(
      'learner@example.com',
      'learner',
    );
    expect(hashPassword).toHaveBeenCalledWith('secure-password');
    expect(createUser).toHaveBeenCalledWith({
      email: 'learner@example.com',
      username: 'learner',
      passwordHash: 'stored-hash',
    });
  });

  it('rejects registration when the email or username is already used', async () => {
    repository.findByEmailOrUsername.mockResolvedValue(user);

    await expect(
      service.registerUser({
        email: user.email,
        username: user.username,
        password: 'secure-password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(hashPassword).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('returns the current user by the identity established by the session guard', async () => {
    repository.findUserById.mockResolvedValue(user);

    await expect(service.findUserById(user.id)).resolves.toEqual({
      id: user.id,
      email: user.email,
      username: user.username,
      role: UserRole.LEARNER,
    });
  });

  it('returns not found when the session user no longer exists', async () => {
    repository.findUserById.mockResolvedValue(null);

    await expect(service.findUserById('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
