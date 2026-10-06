import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { TrainingMaterial } from '../../database/entities/catalog.entity';
import {
  PersonalLearningPath,
  PersonalPathItem,
} from '../../database/entities/personal-learning-path.entity';
import { MyLearningRepository } from './my-learning.repository';

function setup() {
  const path = {
    id: 'path-id',
    ownerUserId: 'owner-id',
    title: 'Plan',
    description: 'Notes',
    items: [],
  };
  const paths = {
    create: jest.fn().mockReturnValue(path),
    save: jest
      .fn()
      .mockImplementation((value: unknown) => Promise.resolve(value)),
    findOne: jest.fn().mockResolvedValue(path),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const items = {
    create: jest.fn().mockImplementation((value: unknown) => value),
    save: jest
      .fn()
      .mockImplementation((value: unknown) => Promise.resolve(value)),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    find: jest.fn().mockResolvedValue([{ materialId: 'a', position: 0 }]),
  };
  const materials = { find: jest.fn().mockResolvedValue([{ id: 'a' }]) };
  const getRepository = jest.fn((entity: unknown) => {
    if (entity === PersonalLearningPath) return paths;
    if (entity === PersonalPathItem) return items;
    if (entity === TrainingMaterial) return materials;
    throw new Error('Unexpected entity');
  });
  const committed = jest.fn();
  const transaction = jest.fn(
    async (work: (manager: EntityManager) => Promise<unknown>) => {
      const result = await work({ getRepository } as unknown as EntityManager);
      committed();
      return result;
    },
  );
  const repository = new MyLearningRepository({
    getRepository,
    transaction,
  } as unknown as DataSource);
  return { repository, paths, items, materials, path, transaction, committed };
}

it('scopes detail reads by both path and owner IDs', async () => {
  const { repository, paths } = setup();
  await repository.findById('owner-id', 'path-id');
  expect(paths.findOne).toHaveBeenCalledWith({
    where: { id: 'path-id', ownerUserId: 'owner-id' },
    relations: { items: true },
  });
});

it('creates the path and validated items in one transaction', async () => {
  const { repository, paths, items, materials, committed } = setup();
  const input = { title: 'Plan', items: [{ materialId: 'a', position: 0 }] };
  const result = await repository.create('owner-id', input);
  expect(materials.find).toHaveBeenCalledWith({
    where: { id: In(['a']) },
    select: { id: true },
  });
  expect(paths.create).toHaveBeenCalledWith({
    ownerUserId: 'owner-id',
    title: 'Plan',
    description: null,
  });
  expect(items.create).toHaveBeenCalledWith({
    pathId: 'path-id',
    materialId: 'a',
    position: 0,
  });
  expect(result.items).toEqual(
    input.items.map((item) => ({ ...item, pathId: 'path-id' })),
  );
  expect(committed).toHaveBeenCalledTimes(1);
});

it('creates empty paths without querying materials or saving empty item arrays', async () => {
  const { repository, items, materials } = setup();
  await expect(
    repository.create('owner-id', { title: 'Plan' }),
  ).resolves.toMatchObject({ items: [] });
  expect(materials.find).not.toHaveBeenCalled();
  expect(items.save).not.toHaveBeenCalled();
});

it('rejects unknown materials before creating a path', async () => {
  const { repository, paths, materials, committed } = setup();
  materials.find.mockResolvedValue([]);
  await expect(
    repository.create('owner-id', {
      title: 'Plan',
      items: [{ materialId: 'missing', position: 0 }],
    }),
  ).rejects.toBeInstanceOf(BadRequestException);
  expect(paths.save).not.toHaveBeenCalled();
  expect(committed).not.toHaveBeenCalled();
});

it('locks the owner-scoped path and replaces items atomically', async () => {
  const { repository, paths, items, committed } = setup();
  await repository.update('owner-id', 'path-id', {
    items: [{ materialId: 'a', position: 2 }],
  });
  expect(paths.findOne).toHaveBeenCalledWith({
    where: { id: 'path-id', ownerUserId: 'owner-id' },
    lock: { mode: 'pessimistic_write' },
  });
  expect(items.delete).toHaveBeenCalledWith({ pathId: 'path-id' });
  expect(items.save).toHaveBeenCalledWith([
    { pathId: 'path-id', materialId: 'a', position: 2 },
  ]);
  expect(committed).toHaveBeenCalledTimes(1);
});

it('preserves omitted fields and items when updating only the title', async () => {
  const { repository, items } = setup();
  const result = await repository.update('owner-id', 'path-id', {
    title: 'Changed',
  });
  expect(result).toMatchObject({
    title: 'Changed',
    description: 'Notes',
    items: [{ materialId: 'a', position: 0 }],
  });
  expect(result?.updatedAt).toBeInstanceOf(Date);
  expect(items.delete).not.toHaveBeenCalled();
});

it('clears the description and all items when explicitly requested', async () => {
  const { repository, items } = setup();
  await expect(
    repository.update('owner-id', 'path-id', { description: null, items: [] }),
  ).resolves.toMatchObject({ description: null, items: [] });
  expect(items.delete).toHaveBeenCalledWith({ pathId: 'path-id' });
  expect(items.save).not.toHaveBeenCalled();
});

it('does not mutate a missing or non-owned path', async () => {
  const { repository, paths, items, materials } = setup();
  paths.findOne.mockResolvedValue(null);
  await expect(
    repository.update('owner-id', 'path-id', { items: [] }),
  ).resolves.toBeNull();
  expect(paths.save).not.toHaveBeenCalled();
  expect(items.delete).not.toHaveBeenCalled();
  expect(materials.find).not.toHaveBeenCalled();
});

it('validates replacement materials before deleting existing items', async () => {
  const { repository, items, materials, committed } = setup();
  materials.find.mockResolvedValue([]);
  await expect(
    repository.update('owner-id', 'path-id', {
      items: [{ materialId: 'missing', position: 0 }],
    }),
  ).rejects.toBeInstanceOf(BadRequestException);
  expect(items.delete).not.toHaveBeenCalled();
  expect(committed).not.toHaveBeenCalled();
});

it('does not commit the replacement if saving items fails', async () => {
  const { repository, items, committed } = setup();
  const error = new Error('Database failure');
  items.save.mockRejectedValue(error);
  await expect(
    repository.update('owner-id', 'path-id', {
      items: [{ materialId: 'a', position: 0 }],
    }),
  ).rejects.toBe(error);
  expect(committed).not.toHaveBeenCalled();
});

it('deletes atomically with an owner filter and reports missing paths', async () => {
  const { repository, paths } = setup();
  await expect(repository.delete('owner-id', 'path-id')).resolves.toBe(true);
  expect(paths.delete).toHaveBeenCalledWith({
    id: 'path-id',
    ownerUserId: 'owner-id',
  });
  paths.delete.mockResolvedValue({ affected: 0 });
  await expect(repository.delete('owner-id', 'path-id')).resolves.toBe(false);
});
