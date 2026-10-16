import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { AuthIdentity } from '../../database/entities/auth-identity.entity';
import { AuthSession } from '../../database/entities/auth-session.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { AuthenticationRepository } from './auth.repository';

const input = {
  issuer: 'https://cilogon.org',
  subject: 'provider-subject',
  email: 'learner@example.org',
  displayName: 'Learner',
  identityProvider: null,
  tokenHash: 'hashed-token',
  expiresAt: new Date('2026-10-16T12:00:00Z'),
  ipAddress: null,
  userAgent: null,
};

function setup() {
  const users = {
    create: jest.fn((value: unknown) => value),
    save: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const identities = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((value: unknown) => value),
    save: jest.fn().mockResolvedValue({}),
  };
  const sessions = { save: jest.fn().mockResolvedValue({}) };
  const getRepository = jest.fn((entity: unknown) => {
    if (entity === User) return users;
    if (entity === AuthIdentity) return identities;
    if (entity === AuthSession) return sessions;
    throw new Error('Unexpected entity');
  });
  const query = jest.fn().mockResolvedValue(undefined);
  const manager = { getRepository, query } as unknown as EntityManager;
  const committed = jest.fn();
  const transaction = jest.fn(
    async (
      _isolation: string,
      work: (manager: EntityManager) => Promise<void>,
    ) => {
      await work(manager);
      committed();
    },
  );
  const repository = new AuthenticationRepository({
    transaction,
  } as unknown as DataSource);
  return {
    repository,
    users,
    identities,
    sessions,
    query,
    manager,
    transaction,
    committed,
  };
}

it('creates a learner, its identity, and a hashed local session in one transaction', async () => {
  const { repository, users, identities, sessions, query, committed } = setup();
  await repository.establishCilogonSession(input);
  expect(query).toHaveBeenCalledWith(
    'SELECT pg_advisory_xact_lock(hashtext($1))',
    [JSON.stringify([input.issuer, input.subject])],
  );
  const created = users.create.mock.calls[0]?.[0] as User;
  expect(created.id).toMatch(/^[\da-f-]{36}$/);
  expect(created.username).toBe(`user_${created.id.replaceAll('-', '')}`);
  expect(created.role).toBe(UserRole.LEARNER);
  expect(created.lastLoginAt).toBeInstanceOf(Date);
  expect(identities.create).toHaveBeenCalledWith({
    userId: created.id,
    issuer: input.issuer,
    subject: input.subject,
    identityProvider: null,
    institution: null,
  });
  expect(sessions.save).toHaveBeenCalledWith(
    expect.objectContaining({
      userId: created.id,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
    }),
  );
  expect(committed).toHaveBeenCalledTimes(1);
});

it('reuses the identity owner and changes only lastLoginAt, preserving local roles and profile', async () => {
  const { repository, identities, users, sessions } = setup();
  identities.findOne.mockResolvedValue({ userId: 'existing-admin' });
  await repository.establishCilogonSession(input);
  expect(identities.findOne).toHaveBeenCalledWith({
    where: { issuer: input.issuer, subject: input.subject },
  });
  expect(users.create).not.toHaveBeenCalled();
  expect(identities.save).not.toHaveBeenCalled();
  expect(users.update).toHaveBeenCalledWith(
    { id: 'existing-admin' },
    { lastLoginAt: expect.any(Date) as Date },
  );
  expect(sessions.save).toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'existing-admin' }),
  );
});

it('waits for the identity lock before reading identity records', async () => {
  const { repository, query, identities } = setup();
  let release!: () => void;
  query.mockReturnValue(
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  const pending = repository.establishCilogonSession(input);
  await Promise.resolve();
  expect(identities.findOne).not.toHaveBeenCalled();
  release();
  await pending;
  expect(identities.findOne).toHaveBeenCalledTimes(1);
});

it('allows missing email and display name for a new identity', async () => {
  const { repository, users } = setup();
  await repository.establishCilogonSession({
    ...input,
    email: null,
    displayName: null,
  });
  expect(users.create).toHaveBeenCalledWith(
    expect.objectContaining({ email: null, displayName: null }),
  );
});

it('rejects email collisions without linking to an existing account or committing', async () => {
  const { repository, users, identities, sessions, committed } = setup();
  users.save.mockRejectedValue(
    new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate'), {
        code: '23505',
        constraint: 'UQ_users_email',
      }),
    ),
  );
  await expect(
    repository.establishCilogonSession(input),
  ).rejects.toBeInstanceOf(ConflictException);
  expect(identities.save).not.toHaveBeenCalled();
  expect(sessions.save).not.toHaveBeenCalled();
  expect(committed).not.toHaveBeenCalled();
});

it('does not create a session for an identity whose local account disappeared', async () => {
  const { repository, identities, users, sessions } = setup();
  identities.findOne.mockResolvedValue({ userId: 'deleted-user' });
  users.update.mockResolvedValue({ affected: 0 });
  await expect(
    repository.establishCilogonSession(input),
  ).rejects.toBeInstanceOf(UnauthorizedException);
  expect(sessions.save).not.toHaveBeenCalled();
});

it.each(['identity', 'session'])(
  'rolls back if saving the %s fails',
  async (stage) => {
    const { repository, identities, sessions, committed } = setup();
    const error = new Error('Database failure');
    (stage === 'identity' ? identities.save : sessions.save).mockRejectedValue(
      error,
    );
    await expect(repository.establishCilogonSession(input)).rejects.toBe(error);
    expect(committed).not.toHaveBeenCalled();
  },
);

it('reuses the first account for competing first sign-ins of the same identity', async () => {
  const { repository, identities, users, sessions, manager, transaction } =
    setup();
  let linked: { userId: string } | null = null;
  identities.findOne.mockImplementation(() => Promise.resolve(linked));
  identities.save.mockImplementation((value: unknown) => {
    linked = value as { userId: string };
    return Promise.resolve({});
  });
  // Model the serialization provided by the per-identity advisory lock.
  let queue = Promise.resolve();
  transaction.mockImplementation(
    (_isolation: string, work: (manager: EntityManager) => Promise<void>) => {
      const result = queue.then(() => work(manager));
      queue = result.catch(() => undefined);
      return result;
    },
  );
  await Promise.all([
    repository.establishCilogonSession(input),
    repository.establishCilogonSession({
      ...input,
      tokenHash: 'second-session-hash',
    }),
  ]);
  expect(users.save).toHaveBeenCalledTimes(1);
  expect(identities.save).toHaveBeenCalledTimes(1);
  expect(sessions.save).toHaveBeenCalledTimes(2);
  const created = users.create.mock.calls[0]?.[0] as User;
  expect(sessions.save).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ userId: created.id, tokenHash: input.tokenHash }),
  );
  expect(sessions.save).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      userId: created.id,
      tokenHash: 'second-session-hash',
    }),
  );
});
