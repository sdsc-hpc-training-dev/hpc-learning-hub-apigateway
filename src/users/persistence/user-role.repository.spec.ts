import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { UserRole } from '../../database/entities/user.entity';
import { UsersRepository } from './user.repository';

function setup(currentRole = UserRole.LEARNER) {
  const target = {
    id: 'target-id',
    email: 'target@example.org',
    username: 'target',
    role: currentRole,
  };
  const users = {
    findOne: jest
      .fn()
      .mockResolvedValueOnce({ id: 'actor-id' })
      .mockResolvedValueOnce(target),
    countBy: jest.fn().mockResolvedValue(2),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const query = jest.fn().mockResolvedValue([]);
  const manager = { query, getRepository: jest.fn().mockReturnValue(users) };
  const committed = jest.fn();
  const transaction = jest.fn(
    async (
      _isolation: string,
      work: (manager: EntityManager) => Promise<unknown>,
    ) => {
      const result = await work(manager as unknown as EntityManager);
      committed();
      return result;
    },
  );
  const repository = new UsersRepository({
    getRepository: jest.fn().mockReturnValue(users),
    transaction,
  } as unknown as DataSource);
  return { repository, users, query, committed, target };
}

it.each([UserRole.ADMIN, UserRole.MAINTAINER])(
  'promotes a learner to %s under the shared transaction lock',
  async (role) => {
    const { repository, users, query, committed } = setup();
    await expect(
      repository.updateRole('actor-id', 'target-id', role),
    ).resolves.toMatchObject({ role });
    expect(query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      ['hpc-learning-hub:user-role-changes'],
    );
    expect(users.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: 'actor-id', role: UserRole.ADMIN },
      select: { id: true },
    });
    expect(users.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: 'target-id' },
      select: { id: true, email: true, username: true, role: true },
      lock: { mode: 'pessimistic_write' },
    });
    expect(users.update).toHaveBeenCalledWith({ id: 'target-id' }, { role });
    expect(committed).toHaveBeenCalledTimes(1);
  },
);

it('waits for the advisory lock before reading roles', async () => {
  const { repository, users, query } = setup();
  let releaseLock: () => void = () => {};
  query.mockReturnValue(
    new Promise<void>((resolveLock) => {
      releaseLock = resolveLock;
    }),
  );
  const result = repository.updateRole('actor-id', 'target-id', UserRole.ADMIN);
  expect(users.findOne).not.toHaveBeenCalled();
  releaseLock();
  await result;
  expect(users.findOne).toHaveBeenCalledTimes(2);
});

it('rejects an actor demoted while waiting for the lock', async () => {
  const { repository, users, committed } = setup();
  users.findOne.mockReset().mockResolvedValueOnce(null);
  await expect(
    repository.updateRole('actor-id', 'target-id', UserRole.ADMIN),
  ).rejects.toBeInstanceOf(ForbiddenException);
  expect(users.update).not.toHaveBeenCalled();
  expect(committed).not.toHaveBeenCalled();
});

it('reports a missing target without performing a mutation', async () => {
  const { repository, users } = setup();
  users.findOne
    .mockReset()
    .mockResolvedValueOnce({ id: 'actor-id' })
    .mockResolvedValueOnce(null);
  await expect(
    repository.updateRole('actor-id', 'missing-id', UserRole.ADMIN),
  ).resolves.toBeNull();
  expect(users.update).not.toHaveBeenCalled();
});

it.each([UserRole.LEARNER, UserRole.MAINTAINER])(
  'prevents demotion of the final admin to %s',
  async (role) => {
    const { repository, users, committed } = setup(UserRole.ADMIN);
    users.countBy.mockResolvedValue(1);
    await expect(
      repository.updateRole('actor-id', 'target-id', role),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(users.update).not.toHaveBeenCalled();
    expect(committed).not.toHaveBeenCalled();
  },
);

it('allows demotion when another administrator remains', async () => {
  const { repository, users } = setup(UserRole.ADMIN);
  await expect(
    repository.updateRole('actor-id', 'target-id', UserRole.LEARNER),
  ).resolves.toMatchObject({ role: UserRole.LEARNER });
  expect(users.countBy).toHaveBeenCalledWith({ role: UserRole.ADMIN });
});

it('keeps an unchanged role without writing or rejecting the final admin', async () => {
  const { repository, users } = setup(UserRole.ADMIN);
  users.countBy.mockResolvedValue(1);
  await expect(
    repository.updateRole('actor-id', 'target-id', UserRole.ADMIN),
  ).resolves.toMatchObject({ role: UserRole.ADMIN });
  expect(users.update).not.toHaveBeenCalled();
  expect(users.countBy).not.toHaveBeenCalled();
});

it('does not commit when the update fails', async () => {
  const { repository, users, committed } = setup();
  const error = new Error('Database failure');
  users.update.mockRejectedValue(error);
  await expect(
    repository.updateRole('actor-id', 'target-id', UserRole.ADMIN),
  ).rejects.toBe(error);
  expect(committed).not.toHaveBeenCalled();
});

it('allows only one of two concurrent final-admin demotions to succeed', async () => {
  const roles = new Map<string, UserRole>([
    ['admin-a', UserRole.ADMIN],
    ['admin-b', UserRole.ADMIN],
  ]);
  const users = {
    findOne: jest.fn(
      ({ where }: { where: { id: string; role?: UserRole } }) => {
        const role = roles.get(where.id);
        if (!role || (where.role !== undefined && where.role !== role))
          return Promise.resolve(null);
        return Promise.resolve({
          id: where.id,
          email: `${where.id}@example.org`,
          username: where.id,
          role,
        });
      },
    ),
    countBy: jest.fn(() =>
      Promise.resolve(
        [...roles.values()].filter((role) => role === UserRole.ADMIN).length,
      ),
    ),
    update: jest.fn(({ id }: { id: string }, { role }: { role: UserRole }) => {
      roles.set(id, role);
      return Promise.resolve({ affected: 1 });
    }),
  };
  let sharedLock = Promise.resolve();
  const transaction = async (
    _isolation: string,
    work: (manager: EntityManager) => Promise<unknown>,
  ) => {
    let release: () => void = () => {};
    const manager = {
      getRepository: () => users,
      query: async () => {
        const previous = sharedLock;
        sharedLock = new Promise<void>((unlock) => {
          release = unlock;
        });
        await previous;
      },
    };
    try {
      return await work(manager as unknown as EntityManager);
    } finally {
      release();
    }
  };
  const repository = new UsersRepository({
    getRepository: () => users,
    transaction,
  } as unknown as DataSource);
  const results = await Promise.allSettled([
    repository.updateRole('admin-a', 'admin-a', UserRole.LEARNER),
    repository.updateRole('admin-b', 'admin-b', UserRole.MAINTAINER),
  ]);
  expect(
    results.filter((result) => result.status === 'fulfilled'),
  ).toHaveLength(1);
  const rejected = results.find((result) => result.status === 'rejected');
  expect(rejected?.reason).toBeInstanceOf(ConflictException);
  expect(
    [...roles.values()].filter((role) => role === UserRole.ADMIN),
  ).toHaveLength(1);
});
