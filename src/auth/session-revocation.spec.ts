import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { AuthenticationRepository } from './persistence/auth.repository';

it('does not finish revocation until the database update completes', async () => {
  let resolveUpdate: () => void = () => {};
  const update = jest.fn().mockReturnValue(
    new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    }),
  );
  const repository = new AuthenticationRepository({
    getRepository: () => ({ update }),
  } as unknown as DataSource);
  const completed = jest.fn();
  const pending = repository.revokeSession('session-id').then(completed);
  await Promise.resolve();
  expect(completed).not.toHaveBeenCalled();
  resolveUpdate();
  await pending;
  expect(completed).toHaveBeenCalledTimes(1);
});

it('propagates revocation failure instead of completing logout successfully', async () => {
  const error = new Error('Database unavailable');
  const revokeSession = jest.fn().mockRejectedValue(error);
  const service = new AuthService(
    { revokeSession } as unknown as AuthenticationRepository,
    {} as PasswordService,
    { sendLoginCode: jest.fn() },
  );
  await expect(service.logoutUser('session-id')).rejects.toBe(error);
});
