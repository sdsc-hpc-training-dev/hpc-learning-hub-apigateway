import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { EntityManager } from 'typeorm';
import { AuthService } from './auth.service';
import { AuthenticationRepository } from './persistence/auth.repository';
import { PasswordService } from './password.service';

function setup() {
  const manager = {} as EntityManager;
  const findActiveLoginChallenge = jest.fn().mockResolvedValue({
    id: 'challenge-id',
    userId: 'user-id',
    codeHash: createHash('sha256').update('123456').digest('base64url'),
  });
  const incrementChallengeAttempts = jest.fn().mockResolvedValue(true);
  const consumeChallenge = jest.fn().mockResolvedValue(true);
  const createSession = jest.fn().mockResolvedValue({});
  const committed = jest.fn();
  const withTransaction = jest
    .fn()
    .mockImplementation(
      async (work: (manager: EntityManager) => Promise<unknown>) => {
        const result = await work(manager);
        committed();
        return result;
      },
    );
  const service = new AuthService(
    {
      findActiveLoginChallenge,
      incrementChallengeAttempts,
      consumeChallenge,
      createSession,
      withTransaction,
    } as unknown as AuthenticationRepository,
    {} as PasswordService,
    { sendLoginCode: jest.fn() },
  );
  return {
    service,
    manager,
    findActiveLoginChallenge,
    incrementChallengeAttempts,
    consumeChallenge,
    createSession,
    committed,
  };
}

it('stores the token hash and returns the same expiration for the cookie', async () => {
  const { service, manager, createSession, committed } = setup();
  const result = await service.verifyLogin(
    { challengeId: 'challenge-id', code: '123456' },
    null,
    null,
  );
  expect(result.token).toMatch(/^[\w-]{43}$/);
  expect(createSession).toHaveBeenCalledWith(
    {
      userId: 'user-id',
      tokenHash: createHash('sha256').update(result.token).digest('base64url'),
      expiresAt: result.expiresAt,
      ipAddress: null,
      userAgent: null,
    },
    manager,
  );
  expect(committed).toHaveBeenCalledTimes(1);
});

it('expires the session exactly 24 hours after verification and saves request metadata', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-06T12:00:00Z'));
  try {
    const { service, createSession, manager } = setup();
    const result = await service.verifyLogin(
      { challengeId: 'challenge-id', code: '123456' },
      '192.0.2.1',
      'test-browser',
    );
    expect(result.expiresAt).toEqual(new Date('2026-10-07T12:00:00Z'));
    expect(createSession).toHaveBeenCalledWith(
      {
        userId: 'user-id',
        tokenHash: createHash('sha256')
          .update(result.token)
          .digest('base64url'),
        expiresAt: result.expiresAt,
        ipAddress: '192.0.2.1',
        userAgent: 'test-browser',
      },
      manager,
    );
  } finally {
    jest.useRealTimers();
  }
});

it('commits an incorrect-code attempt before returning an authentication error', async () => {
  const {
    service,
    manager,
    incrementChallengeAttempts,
    createSession,
    committed,
  } = setup();
  await expect(
    service.verifyLogin(
      { challengeId: 'challenge-id', code: '654321' },
      null,
      null,
    ),
  ).rejects.toBeInstanceOf(UnauthorizedException);
  expect(incrementChallengeAttempts).toHaveBeenCalledWith(
    'challenge-id',
    manager,
  );
  expect(committed).toHaveBeenCalledTimes(1);
  expect(createSession).not.toHaveBeenCalled();
});

it('does not commit when creating the session fails', async () => {
  const { service, createSession, committed } = setup();
  const error = new Error('Database unavailable');
  createSession.mockRejectedValue(error);
  await expect(
    service.verifyLogin(
      { challengeId: 'challenge-id', code: '123456' },
      null,
      null,
    ),
  ).rejects.toBe(error);
  expect(committed).not.toHaveBeenCalled();
});

it('rejects an inactive challenge without creating a session', async () => {
  const { service, findActiveLoginChallenge, createSession } = setup();
  findActiveLoginChallenge.mockResolvedValue(null);
  await expect(
    service.verifyLogin(
      { challengeId: 'challenge-id', code: '123456' },
      null,
      null,
    ),
  ).rejects.toBeInstanceOf(UnauthorizedException);
  expect(createSession).not.toHaveBeenCalled();
});

it('rejects a challenge that could not be consumed', async () => {
  const { service, consumeChallenge, createSession, committed } = setup();
  consumeChallenge.mockResolvedValue(false);
  await expect(
    service.verifyLogin(
      { challengeId: 'challenge-id', code: '123456' },
      null,
      null,
    ),
  ).rejects.toBeInstanceOf(UnauthorizedException);
  expect(createSession).not.toHaveBeenCalled();
  expect(committed).not.toHaveBeenCalled();
});

it('rejects a malformed stored code hash safely', async () => {
  const {
    service,
    findActiveLoginChallenge,
    incrementChallengeAttempts,
    createSession,
  } = setup();
  findActiveLoginChallenge.mockResolvedValue({
    id: 'challenge-id',
    codeHash: 'broken',
  });
  await expect(
    service.verifyLogin(
      { challengeId: 'challenge-id', code: '123456' },
      null,
      null,
    ),
  ).rejects.toBeInstanceOf(UnauthorizedException);
  expect(incrementChallengeAttempts).toHaveBeenCalledTimes(1);
  expect(createSession).not.toHaveBeenCalled();
});

it('propagates an attempt-update failure without committing', async () => {
  const { service, incrementChallengeAttempts, committed } = setup();
  const error = new Error('Attempt update failed');
  incrementChallengeAttempts.mockRejectedValue(error);
  await expect(
    service.verifyLogin(
      { challengeId: 'challenge-id', code: '654321' },
      null,
      null,
    ),
  ).rejects.toBe(error);
  expect(committed).not.toHaveBeenCalled();
});

it('rejects a challenge when its failed attempt could not be recorded', async () => {
  const { service, incrementChallengeAttempts, committed, createSession } =
    setup();
  incrementChallengeAttempts.mockResolvedValue(false);
  await expect(
    service.verifyLogin(
      { challengeId: 'challenge-id', code: '654321' },
      null,
      null,
    ),
  ).rejects.toBeInstanceOf(UnauthorizedException);
  expect(committed).not.toHaveBeenCalled();
  expect(createSession).not.toHaveBeenCalled();
});
