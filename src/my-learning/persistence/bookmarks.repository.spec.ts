import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { Bookmark } from '../../database/entities/bookmark.entity';
import { TrainingMaterial } from '../../database/entities/catalog.entity';
import { MyLearningRepository } from './my-learning.repository';

function setup() {
  const bookmarks = {
    find: jest.fn().mockResolvedValue([]),
    save: jest
      .fn()
      .mockImplementation((value: Bookmark) =>
        Promise.resolve({ ...value, id: 'bookmark-id', createdAt: new Date() }),
      ),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const materials = {
    findOne: jest.fn().mockResolvedValue({ id: 'material-a' }),
  };
  const getRepository = jest.fn((entity: unknown) => {
    if (entity === Bookmark) return bookmarks;
    if (entity === TrainingMaterial) return materials;
    throw new Error('Unexpected entity');
  });
  const repository = new MyLearningRepository({
    getRepository,
  } as unknown as DataSource);
  return { repository, bookmarks, materials };
}

it('filters by user ID and lists newest saves first with a stable tie breaker', async () => {
  const { repository, bookmarks } = setup();
  await expect(repository.retrieveBookmarks('owner-id')).resolves.toEqual([]);
  expect(bookmarks.find).toHaveBeenCalledWith({
    where: { userId: 'owner-id' },
    order: { createdAt: 'DESC', id: 'ASC' },
  });
});

it('checks the canonical material and persists only its ID and session owner', async () => {
  const { repository, bookmarks, materials } = setup();
  await expect(
    repository.addBookmark('owner-id', 'material-a'),
  ).resolves.toMatchObject({
    id: 'bookmark-id',
    userId: 'owner-id',
    materialId: 'material-a',
  });
  expect(materials.findOne).toHaveBeenCalledWith({
    where: { id: 'material-a' },
    select: { id: true },
  });
  expect(bookmarks.save).toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'owner-id', materialId: 'material-a' }),
  );
});

it('rejects a missing material without saving a bookmark', async () => {
  const { repository, bookmarks, materials } = setup();
  materials.findOne.mockResolvedValue(null);
  await expect(
    repository.addBookmark('owner-id', 'missing'),
  ).rejects.toBeInstanceOf(NotFoundException);
  expect(bookmarks.save).not.toHaveBeenCalled();
});

it('maps duplicate saves from the unique user/material constraint to 409', async () => {
  const { repository, bookmarks } = setup();
  const error = new QueryFailedError(
    'INSERT',
    [],
    Object.assign(new Error('duplicate'), {
      code: '23505',
      constraint: 'UQ_bookmarks_user_material',
    }),
  );
  bookmarks.save.mockRejectedValue(error);
  await expect(
    repository.addBookmark('owner-id', 'material-a'),
  ).rejects.toBeInstanceOf(ConflictException);
});

it.each([
  new Error('Database unavailable'),
  new QueryFailedError(
    'INSERT',
    [],
    Object.assign(new Error('unrelated duplicate'), {
      code: '23505',
      constraint: 'other_constraint',
    }),
  ),
  new QueryFailedError(
    'INSERT',
    [],
    Object.assign(new Error('foreign key'), {
      code: '23503',
      constraint: 'UQ_bookmarks_user_material',
    }),
  ),
])('propagates unrelated database errors: %s', async (error) => {
  const { repository, bookmarks } = setup();
  bookmarks.save.mockRejectedValue(error);
  await expect(repository.addBookmark('owner-id', 'material-a')).rejects.toBe(
    error,
  );
});

it.each([1, 0])(
  'deletes only the user/material pair even when %i rows match',
  async (affected) => {
    const { repository, bookmarks, materials } = setup();
    bookmarks.delete.mockResolvedValue({ affected });
    await expect(
      repository.deleteBookmark('owner-id', 'material-a'),
    ).resolves.toBeUndefined();
    expect(bookmarks.delete).toHaveBeenCalledWith({
      userId: 'owner-id',
      materialId: 'material-a',
    });
    expect(materials.findOne).not.toHaveBeenCalled();
  },
);

it('waits for deletion and propagates failures instead of returning 204 early', async () => {
  const { repository, bookmarks } = setup();
  let rejectDelete!: (error: Error) => void;
  bookmarks.delete.mockReturnValue(
    new Promise((_, reject) => {
      rejectDelete = reject;
    }),
  );
  const finished = jest.fn();
  const result = repository.deleteBookmark('owner-id', 'material-a');
  void result.then(finished, finished);
  await Promise.resolve();
  expect(finished).not.toHaveBeenCalled();
  const error = new Error('Database failure');
  rejectDelete(error);
  await expect(result).rejects.toBe(error);
});
