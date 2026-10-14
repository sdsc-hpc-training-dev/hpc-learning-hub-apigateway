import { DataSource, EntityManager } from 'typeorm';
import { OidcLoginTransaction } from '../../database/entities/oidc-login-transaction.entity';
import { AuthenticationRepository } from './auth.repository';

function creationSetup() {
  const input = {
    stateHash: 'state-hash',
    nonce: 'nonce',
    pkceVerifier: 'verifier',
    browserBindingHash: 'browser-hash',
    returnTo: null,
    expiresAt: new Date('2026-10-14T12:10:00Z'),
  };
  const saved = Object.assign(new OidcLoginTransaction(), input, {
    id: 'generated-id',
    createdAt: new Date(),
    consumedAt: null,
  });
  const create = jest.fn((value: unknown) => value);
  const save = jest.fn().mockResolvedValue(saved);
  const getRepository = jest.fn().mockReturnValue({ create, save });
  const repository = new AuthenticationRepository({
    getRepository,
  } as unknown as DataSource);
  return { repository, input, saved, create, save, getRepository };
}

it('returns the saved attempt with database-generated ID and creation time', async () => {
  const { repository, input, saved, create, save, getRepository } =
    creationSetup();
  await expect(repository.createLoginTransaction(input)).resolves.toBe(saved);
  expect(getRepository).toHaveBeenCalledWith(OidcLoginTransaction);
  expect(create).toHaveBeenCalledWith({ ...input, consumedAt: null });
  expect(save).toHaveBeenCalledWith({ ...input, consumedAt: null });
});

it('waits for insertion and propagates failures', async () => {
  const { repository, input, save } = creationSetup();
  let failSave!: (error: Error) => void;
  save.mockReturnValue(
    new Promise((_, reject) => {
      failSave = reject;
    }),
  );
  const finished = jest.fn();
  const pending = repository.createLoginTransaction(input);
  void pending.then(finished, finished);
  await Promise.resolve();
  expect(finished).not.toHaveBeenCalled();
  const error = new Error('Insert failed');
  failSave(error);
  await expect(pending).rejects.toBe(error);
});

function consumptionSetup() {
  const attempt = Object.assign(new OidcLoginTransaction(), {
    id: 'attempt-id',
    pkceVerifier: 'private-verifier',
    consumedAt: null,
  });
  const query = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(attempt),
  };
  const update = jest.fn().mockResolvedValue({ affected: 1 });
  const getRepository = jest.fn().mockReturnValue({
    createQueryBuilder: jest.fn().mockReturnValue(query),
    update,
  });
  const manager = { getRepository } as unknown as EntityManager;
  const committed = jest.fn();
  const transaction = jest.fn(
    async (work: (manager: EntityManager) => Promise<unknown>) => {
      const result = await work(manager);
      committed();
      return result;
    },
  );
  const repository = new AuthenticationRepository({
    transaction,
  } as unknown as DataSource);
  return {
    repository,
    attempt,
    query,
    update,
    getRepository,
    transaction,
    manager,
    committed,
  };
}

it('matches state and browser, excludes expired or consumed attempts, and locks the row', async () => {
  const { repository, query, update, attempt, getRepository, committed } =
    consumptionSetup();
  await expect(
    repository.consumeLoginTransaction('state-hash', 'browser-hash'),
  ).resolves.toBe(attempt);
  expect(getRepository).toHaveBeenCalledWith(OidcLoginTransaction);
  expect(query.addSelect).toHaveBeenCalledWith('attempt.pkceVerifier');
  expect(query.where).toHaveBeenCalledWith('attempt.stateHash = :stateHash', {
    stateHash: 'state-hash',
  });
  expect(query.andWhere).toHaveBeenCalledWith(
    'attempt.browserBindingHash = :browserBindingHash',
    { browserBindingHash: 'browser-hash' },
  );
  expect(query.andWhere).toHaveBeenCalledWith('attempt.consumedAt IS NULL');
  expect(query.andWhere).toHaveBeenCalledWith('attempt.expiresAt > now()');
  expect(query.setLock).toHaveBeenCalledWith('pessimistic_write');
  expect(update).toHaveBeenCalledWith(attempt.id, {
    consumedAt: expect.any(Date) as Date,
  });
  expect(attempt.consumedAt).toBeInstanceOf(Date);
  expect(committed).toHaveBeenCalledTimes(1);
});

it('returns null without mutating anything when no eligible attempt matches', async () => {
  const { repository, query, update } = consumptionSetup();
  query.getOne.mockResolvedValue(null);
  await expect(
    repository.consumeLoginTransaction('wrong-state', 'wrong-browser'),
  ).resolves.toBeNull();
  expect(update).not.toHaveBeenCalled();
});

it('does not commit or report consumption if the update fails', async () => {
  const { repository, update, attempt, committed } = consumptionSetup();
  const error = new Error('Update failed');
  update.mockRejectedValue(error);
  await expect(
    repository.consumeLoginTransaction('state', 'browser'),
  ).rejects.toBe(error);
  expect(attempt.consumedAt).toBeNull();
  expect(committed).not.toHaveBeenCalled();
});

it('consumes an attempt only once across competing transactions', async () => {
  const { repository, transaction, manager, query, attempt, update } =
    consumptionSetup();
  // Model the serialization provided by PostgreSQL's row lock.
  let queue: Promise<unknown> = Promise.resolve();
  transaction.mockImplementation(
    (work: (manager: EntityManager) => Promise<unknown>) => {
      const result = queue.then(() => work(manager));
      queue = result.catch(() => undefined);
      return result;
    },
  );
  query.getOne.mockImplementation(() =>
    Promise.resolve(attempt.consumedAt ? null : attempt),
  );
  const results = await Promise.all([
    repository.consumeLoginTransaction('state', 'browser'),
    repository.consumeLoginTransaction('state', 'browser'),
  ]);
  expect(results.filter((result) => result !== null)).toHaveLength(1);
  expect(results.filter((result) => result === null)).toHaveLength(1);
  expect(update).toHaveBeenCalledTimes(1);
});
