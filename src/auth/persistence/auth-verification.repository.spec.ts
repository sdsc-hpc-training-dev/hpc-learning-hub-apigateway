import { DataSource, EntityManager, IsNull, LessThan, MoreThan } from 'typeorm';
import {
  AuthChallenge,
  AuthChallengePurpose,
} from '../../database/entities/auth-challenge.entity';
import { AuthSession } from '../../database/entities/auth-session.entity';
import { AuthenticationRepository } from './auth.repository';

function setup() {
  const findOne = jest.fn().mockResolvedValue(null);
  const increment = jest.fn().mockResolvedValue({ affected: 1 });
  const update = jest.fn().mockResolvedValue({ affected: 1 });
  const save = jest.fn().mockResolvedValue({ id: 'session-id' });
  const getRepository = jest
    .fn()
    .mockReturnValue({ findOne, increment, update, save });
  const manager = { getRepository } as unknown as EntityManager;
  const transaction = jest
    .fn()
    .mockImplementation((work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager),
    );
  const repository = new AuthenticationRepository({
    getRepository,
    transaction,
  } as unknown as DataSource);
  return {
    repository,
    manager,
    findOne,
    increment,
    update,
    save,
    getRepository,
  };
}

function filters() {
  return {
    id: 'challenge-id',
    purpose: AuthChallengePurpose.LOGIN,
    consumedAt: IsNull(),
    expiresAt: MoreThan(new Date()),
    attempts: LessThan(5),
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-06T12:00:00Z'));
});
afterEach(() => jest.useRealTimers());

it('filters out consumed, expired, and exhausted login challenges', async () => {
  const { repository, findOne, getRepository } = setup();
  await expect(
    repository.findActiveLoginChallenge('challenge-id'),
  ).resolves.toBeNull();
  expect(getRepository).toHaveBeenCalledWith(AuthChallenge);
  expect(findOne).toHaveBeenCalledWith({ where: filters() });
});

it('locks the challenge using the transaction manager', async () => {
  const { repository, manager, findOne } = setup();
  await repository.withTransaction(async (transactionManager) => {
    expect(transactionManager).toBe(manager);
    return repository.findActiveLoginChallenge(
      'challenge-id',
      transactionManager,
    );
  });
  expect(findOne).toHaveBeenCalledWith({
    where: filters(),
    lock: { mode: 'pessimistic_write' },
  });
});

it.each([1, 0, undefined])(
  'reports whether an attempt was incremented (%s affected)',
  async (affected) => {
    const { repository, increment, manager } = setup();
    increment.mockResolvedValue({ affected });
    await expect(
      repository.incrementChallengeAttempts('challenge-id', manager),
    ).resolves.toBe(affected === 1);
    expect(increment).toHaveBeenCalledWith(filters(), 'attempts', 1);
  },
);

it.each([1, 0, undefined])(
  'reports whether a challenge was consumed (%s affected)',
  async (affected) => {
    const { repository, update, manager } = setup();
    update.mockResolvedValue({ affected });
    await expect(
      repository.consumeChallenge('challenge-id', manager),
    ).resolves.toBe(affected === 1);
    expect(update).toHaveBeenCalledWith(filters(), { consumedAt: new Date() });
  },
);

it('creates an unrevoked session using the same transaction manager', async () => {
  const { repository, manager, save, getRepository } = setup();
  const input = {
    userId: 'user-id',
    tokenHash: 'hashed-token',
    expiresAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };
  await expect(repository.createSession(input, manager)).resolves.toEqual({
    id: 'session-id',
  });
  expect(getRepository).toHaveBeenCalledWith(AuthSession);
  expect(save).toHaveBeenCalledWith({
    ...input,
    revokedAt: null,
    lastSeenAt: new Date(),
  });
});

it('propagates transaction failures to the caller', async () => {
  const { repository } = setup();
  const failure = new Error('Session insert failed');
  await expect(
    repository.withTransaction(() => Promise.reject(failure)),
  ).rejects.toBe(failure);
});
