import {
  BadRequestException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '../database/entities/user.entity';
import { MyLearningController } from './my-learning.controller';
import { MyLearningService } from './my-learning.service';
import { MyLearningRepository } from './persistence/my-learning.repository';

function setup() {
  const path = {
    id: 'path-id',
    title: 'Plan',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };
  const repository = {
    findById: jest.fn().mockResolvedValue(path),
    create: jest.fn().mockResolvedValue(path),
    update: jest.fn().mockResolvedValue(path),
    delete: jest.fn().mockResolvedValue(true),
  };
  const service = new MyLearningService(
    repository as unknown as MyLearningRepository,
  );
  const controller = new MyLearningController(service);
  const user = { id: 'owner-id', role: UserRole.LEARNER };
  return { path, repository, service, controller, user };
}

it('creates using the session owner and returns the complete path', async () => {
  const { controller, repository, path, user } = setup();
  const input = { title: 'Plan' };
  await expect(controller.create(user, input)).resolves.toEqual(path);
  expect(repository.create).toHaveBeenCalledWith(user.id, input);
});

it('reads details scoped to the session owner', async () => {
  const { controller, repository, path, user } = setup();
  await expect(controller.findOne(user, path.id)).resolves.toEqual(path);
  expect(repository.findById).toHaveBeenCalledWith(user.id, path.id);
});

it('passes partial updates, including clearing fields, with the session owner', async () => {
  const { controller, repository, path, user } = setup();
  const input = { description: null, items: [] };
  await expect(controller.update(user, path.id, input)).resolves.toEqual(path);
  expect(repository.update).toHaveBeenCalledWith(user.id, path.id, input);
});

it('deletes only the current owner’s path and returns no body', async () => {
  const { controller, repository, path, user } = setup();
  await expect(controller.delete(user, path.id)).resolves.toBeUndefined();
  expect(repository.delete).toHaveBeenCalledWith(user.id, path.id);
});

it('rejects empty updates before performing a mutation', async () => {
  const { service, repository } = setup();
  await expect(
    service.update('owner-id', 'path-id', {}),
  ).rejects.toBeInstanceOf(BadRequestException);
  expect(repository.update).not.toHaveBeenCalled();
});

it('returns 404 for missing or non-owned path details', async () => {
  const { service, repository } = setup();
  repository.findById.mockResolvedValue(null);
  await expect(service.findOne('owner-id', 'path-id')).rejects.toBeInstanceOf(
    NotFoundException,
  );
});

it('returns 404 for missing or non-owned paths on update', async () => {
  const { service, repository } = setup();
  repository.update.mockResolvedValue(null);
  await expect(
    service.update('owner-id', 'path-id', { title: 'Changed' }),
  ).rejects.toBeInstanceOf(NotFoundException);
});

it('returns 404 for missing or non-owned paths on delete', async () => {
  const { service, repository } = setup();
  repository.delete.mockResolvedValue(false);
  await expect(service.delete('owner-id', 'path-id')).rejects.toBeInstanceOf(
    NotFoundException,
  );
});

it('rejects malformed path UUIDs', async () => {
  await expect(
    new ParseUUIDPipe().transform('bad-id', { type: 'param' }),
  ).rejects.toBeInstanceOf(BadRequestException);
});
