import {
  NotFoundException,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PasswordService } from '../auth/password.service';
import { UserRole } from '../database/entities/user.entity';
import { UsersRepository } from './persistence/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

function setup() {
  const user = {
    id: 'user-id',
    email: 'user@example.org',
    username: 'user',
    role: UserRole.ADMIN,
    passwordHash: 'private',
    sessions: ['private-token'],
  };
  const repository = {
    findAllUsers: jest.fn().mockResolvedValue([user]),
    updateRole: jest.fn().mockResolvedValue(user),
  };
  const service = new UsersService(
    repository as unknown as UsersRepository,
    {} as PasswordService,
  );
  return { repository, service, controller: new UsersController(service) };
}

it('runs session authentication before administrator authorization on both routes', () => {
  for (const handler of [
    // Inspect decorator metadata without invoking the controller method.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    UsersController.prototype.findAllUsers,
    // eslint-disable-next-line @typescript-eslint/unbound-method
    UsersController.prototype.updateRole,
  ]) {
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
      SessionAuthGuard,
      AdminAuthGuard,
    ]);
  }
  expect(
    Reflect.getMetadata(
      GUARDS_METADATA,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      UsersController.prototype.registerUser,
    ),
  ).toBeUndefined();
});

it('lists public user summaries without credentials or sessions', async () => {
  const { controller, repository } = setup();
  await expect(controller.findAllUsers()).resolves.toEqual([
    {
      id: 'user-id',
      email: 'user@example.org',
      username: 'user',
      role: UserRole.ADMIN,
    },
  ]);
  expect(repository.findAllUsers).toHaveBeenCalledTimes(1);
});

it('returns an empty array when there are no users', async () => {
  const { controller, repository } = setup();
  repository.findAllUsers.mockResolvedValue([]);
  await expect(controller.findAllUsers()).resolves.toEqual([]);
});

it('passes the authenticated actor and returns a safe updated account summary', async () => {
  const { controller, repository } = setup();
  await expect(
    controller.updateRole(
      { id: 'actor-id', role: UserRole.ADMIN },
      { role: UserRole.ADMIN },
      'user-id',
    ),
  ).resolves.toEqual({
    id: 'user-id',
    email: 'user@example.org',
    username: 'user',
    role: UserRole.ADMIN,
  });
  expect(repository.updateRole).toHaveBeenCalledWith(
    'actor-id',
    'user-id',
    UserRole.ADMIN,
  );
});

it('returns 404 when the target user does not exist', async () => {
  const { service, repository } = setup();
  repository.updateRole.mockResolvedValue(null);
  await expect(
    service.updateRole('actor-id', 'missing-id', { role: UserRole.LEARNER }),
  ).rejects.toBeInstanceOf(NotFoundException);
});

it('rejects a malformed user UUID', async () => {
  await expect(
    new ParseUUIDPipe().transform('bad-id', { type: 'param' }),
  ).rejects.toBeInstanceOf(BadRequestException);
});
