import { DataSource } from 'typeorm';
import {
  AuthChallenge,
  AuthChallengePurpose,
} from '../../database/entities/auth-challenge.entity';
import { AuthenticationRepository } from './auth.repository';

it('finds a user by either email or username for password verification', async () => {
  const findOne = jest.fn().mockResolvedValue({ id: 'user-id' });
  const repository = new AuthenticationRepository({
    getRepository: jest.fn().mockReturnValue({ findOne }),
  } as unknown as DataSource);

  await expect(
    repository.findUserByNameOrEmail('learner@example.com'),
  ).resolves.toEqual({ id: 'user-id' });
  expect(findOne).toHaveBeenCalledWith({
    where: [
      { email: 'learner@example.com' },
      { username: 'learner@example.com' },
    ],
  });
});

it('persists a hashed code as a login challenge', async () => {
  const challenge = { id: 'challenge-id' } as AuthChallenge;
  const create = jest.fn().mockReturnValue(challenge);
  const save = jest.fn().mockResolvedValue(challenge);
  const getRepository = jest.fn().mockReturnValue({ create, save });
  const repository = new AuthenticationRepository({
    getRepository,
  } as unknown as DataSource);
  const expiresAt = new Date('2026-10-05T12:10:00.000Z');

  await expect(
    repository.createLoginChallenge({
      userId: 'user-id',
      codeHash: 'hashed-code',
      expiresAt,
    }),
  ).resolves.toEqual(challenge);
  expect(getRepository).toHaveBeenCalledWith(AuthChallenge);
  expect(create).toHaveBeenCalledWith({
    userId: 'user-id',
    codeHash: 'hashed-code',
    expiresAt,
    purpose: AuthChallengePurpose.LOGIN,
  });
  expect(save).toHaveBeenCalledWith(challenge);
});
