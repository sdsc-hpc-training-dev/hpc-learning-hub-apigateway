import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { TrainingMaterial } from '../../database/entities/catalog.entity';
import { Bookmark } from '../../database/entities/bookmark.entity';
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
  const bookmarks = {
    find: jest.fn().mockResolvedValue([{ materialId: 'a' }]),
  };
  const getRepository = jest.fn((entity: unknown) => {
    if (entity === PersonalLearningPath) return paths;
    if (entity === PersonalPathItem) return items;
    if (entity === TrainingMaterial) return materials;
    if (entity === Bookmark) return bookmarks;
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
  return {
    repository,
    paths,
    items,
    materials,
    bookmarks,
    path,
    transaction,
    committed,
  };
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
  const { repository, paths, items, materials, bookmarks, committed } = setup();
  const input = { title: 'Plan', items: [{ materialId: 'a', position: 0 }] };
  const result = await repository.create('owner-id', input);
  expect(bookmarks.find).toHaveBeenCalledWith({
    where: { userId: 'owner-id', materialId: In(['a']) },
    select: { materialId: true },
  });
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
  const { repository, items, materials, bookmarks } = setup();
  await expect(
    repository.create('owner-id', { title: 'Plan' }),
  ).resolves.toMatchObject({ items: [] });
  expect(materials.find).not.toHaveBeenCalled();
  expect(bookmarks.find).not.toHaveBeenCalled();
  expect(items.save).not.toHaveBeenCalled();
});

it('rejects unknown materials before creating a path', async () => {
  const { repository, paths, materials, bookmarks, committed } = setup();
  bookmarks.find.mockResolvedValue([{ materialId: 'missing' }]);
  materials.find.mockResolvedValue([]);
  await expect(
    repository.create('owner-id', {
      title: 'Plan',
      items: [{ materialId: 'missing', position: 0 }],
    }),
  ).rejects.toThrow('One or more material IDs are invalid');
  expect(materials.find).toHaveBeenCalledWith({
    where: { id: In(['missing']) },
    select: { id: true },
  });
  expect(paths.save).not.toHaveBeenCalled();
  expect(committed).not.toHaveBeenCalled();
});

it('locks the owner-scoped path and replaces items atomically', async () => {
  const { repository, paths, items, bookmarks, committed } = setup();
  await repository.update('owner-id', 'path-id', {
    items: [{ materialId: 'a', position: 2 }],
  });
  expect(bookmarks.find).toHaveBeenCalledWith({
    where: { userId: 'owner-id', materialId: In(['a']) },
    select: { materialId: true },
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
  const { repository, items, materials, bookmarks } = setup();
  bookmarks.find.mockResolvedValue([]);
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
  expect(bookmarks.find).not.toHaveBeenCalled();
  expect(materials.find).not.toHaveBeenCalled();
});

it('clears the description and all items when explicitly requested', async () => {
  const { repository, items, materials, bookmarks } = setup();
  await expect(
    repository.update('owner-id', 'path-id', { description: null, items: [] }),
  ).resolves.toMatchObject({ description: null, items: [] });
  expect(items.delete).toHaveBeenCalledWith({ pathId: 'path-id' });
  expect(items.save).not.toHaveBeenCalled();
  expect(bookmarks.find).not.toHaveBeenCalled();
  expect(materials.find).not.toHaveBeenCalled();
});

it('does not mutate a missing or non-owned path', async () => {
  const { repository, paths, items, materials, bookmarks } = setup();
  paths.findOne.mockResolvedValue(null);
  await expect(
    repository.update('owner-id', 'path-id', {
      items: [{ materialId: 'a', position: 0 }],
    }),
  ).resolves.toBeNull();
  expect(paths.save).not.toHaveBeenCalled();
  expect(items.delete).not.toHaveBeenCalled();
  expect(materials.find).not.toHaveBeenCalled();
  expect(bookmarks.find).not.toHaveBeenCalled();
});

it('validates replacement materials before deleting existing items', async () => {
  const { repository, paths, items, materials, bookmarks, committed } = setup();
  bookmarks.find.mockResolvedValue([{ materialId: 'missing' }]);
  materials.find.mockResolvedValue([]);
  await expect(
    repository.update('owner-id', 'path-id', {
      items: [{ materialId: 'missing', position: 0 }],
    }),
  ).rejects.toThrow('One or more material IDs are invalid');
  expect(materials.find).toHaveBeenCalledWith({
    where: { id: In(['missing']) },
    select: { id: true },
  });
  expect(items.delete).not.toHaveBeenCalled();
  expect(items.save).not.toHaveBeenCalled();
  expect(paths.save).not.toHaveBeenCalled();
  expect(committed).not.toHaveBeenCalled();
});

describe.each(['create', 'update'] as const)(
  '%s bookmark validation',
  (operation) => {
    it('accepts multiple materials bookmarked by the owner', async () => {
      const { repository, bookmarks, materials, committed } = setup();
      bookmarks.find.mockResolvedValue([
        { materialId: 'a' },
        { materialId: 'b' },
      ]);
      materials.find.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
      const input = {
        title: 'Plan',
        items: [
          { materialId: 'a', position: 0 },
          { materialId: 'b', position: 1 },
        ],
      };
      const result =
        operation === 'create'
          ? await repository.create('owner-id', input)
          : await repository.update('owner-id', 'path-id', input);
      expect(result?.items).toEqual(
        input.items.map((item) => ({ ...item, pathId: 'path-id' })),
      );
      expect(bookmarks.find).toHaveBeenCalledWith({
        where: { userId: 'owner-id', materialId: In(['a', 'b']) },
        select: { materialId: true },
      });
      expect(committed).toHaveBeenCalledTimes(1);
    });

    it.each([
      {
        name: 'no owner bookmark, even if another user bookmarked it',
        ids: ['a'],
        saved: [],
      },
      {
        name: 'a mixture of bookmarked and unbookmarked materials',
        ids: ['a', 'b'],
        saved: [{ materialId: 'a' }],
      },
    ])(
      'rejects $name before catalog checks or mutations',
      async ({ ids, saved }) => {
        const { repository, bookmarks, materials, paths, items, committed } =
          setup();
        bookmarks.find.mockResolvedValue(saved);
        const input = {
          title: 'Plan',
          items: ids.map((materialId, position) => ({ materialId, position })),
        };
        const result =
          operation === 'create'
            ? repository.create('owner-id', input)
            : repository.update('owner-id', 'path-id', input);
        await expect(result).rejects.toBeInstanceOf(BadRequestException);
        await expect(result).rejects.toThrow(
          'Learning paths can only contain your bookmarked materials',
        );
        expect(bookmarks.find).toHaveBeenCalledWith({
          where: { userId: 'owner-id', materialId: In(ids) },
          select: { materialId: true },
        });
        expect(materials.find).not.toHaveBeenCalled();
        expect(paths.create).not.toHaveBeenCalled();
        expect(paths.save).not.toHaveBeenCalled();
        expect(items.delete).not.toHaveBeenCalled();
        expect(items.save).not.toHaveBeenCalled();
        expect(committed).not.toHaveBeenCalled();
      },
    );
  },
);

it('rechecks existing items supplied on update after their bookmark is removed', async () => {
  const { repository, bookmarks, paths, items, path } = setup();
  const originalItems = [{ materialId: 'a', position: 0 }];
  Object.assign(path, { items: originalItems });
  bookmarks.find.mockResolvedValue([]);
  await expect(
    repository.update('owner-id', 'path-id', {
      items: [{ materialId: 'a', position: 0 }],
    }),
  ).rejects.toThrow(
    'Learning paths can only contain your bookmarked materials',
  );
  expect(items.delete).not.toHaveBeenCalled();
  expect(paths.save).not.toHaveBeenCalled();
  expect(path.items).toEqual(originalItems);
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
