import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { UserRole } from '../database/entities/user.entity';
import { BookmarksController } from './bookmarks.controller';
import { AddBookmarkDto } from './dto/add-bookmark.dto';
import { MyLearningService } from './my-learning.service';
import { MyLearningRepository } from './persistence/my-learning.repository';

function setup() {
  const bookmark = {
    id: 'bookmark-id',
    userId: 'owner-id',
    materialId: 'material-a',
    createdAt: new Date('2026-10-08T12:00:00Z'),
    user: { passwordHash: 'private' },
    material: { internalMetadata: 'private' },
  };
  const repository = {
    retrieveBookmarks: jest.fn().mockResolvedValue([bookmark]),
    addBookmark: jest.fn().mockResolvedValue(bookmark),
    deleteBookmark: jest.fn().mockResolvedValue(undefined),
  };
  const service = new MyLearningService(
    repository as unknown as MyLearningRepository,
  );
  const controller = new BookmarksController(service);
  const user = { id: 'owner-id', role: UserRole.LEARNER };
  const response = {
    id: bookmark.id,
    materialId: bookmark.materialId,
    createdAt: bookmark.createdAt,
  };
  return { repository, service, controller, user, response };
}

it('requires session authentication on every bookmark route', () => {
  expect(Reflect.getMetadata(PATH_METADATA, BookmarksController)).toBe(
    'me/bookmarks',
  );
  expect(Reflect.getMetadata(GUARDS_METADATA, BookmarksController)).toContain(
    SessionAuthGuard,
  );
  expect(
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Metadata inspection does not invoke the method.
    Reflect.getMetadata(METHOD_METADATA, BookmarksController.prototype.findAll),
  ).toBe(RequestMethod.GET);
  expect(
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Metadata inspection does not invoke the method.
    Reflect.getMetadata(METHOD_METADATA, BookmarksController.prototype.create),
  ).toBe(RequestMethod.POST);
  expect(
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Metadata inspection does not invoke the method.
    Reflect.getMetadata(METHOD_METADATA, BookmarksController.prototype.delete),
  ).toBe(RequestMethod.DELETE);
  expect(
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Metadata inspection does not invoke the method.
    Reflect.getMetadata(PATH_METADATA, BookmarksController.prototype.delete),
  ).toBe(':materialId');
  expect(
    Reflect.getMetadata(
      HTTP_CODE_METADATA,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- Metadata inspection does not invoke the method.
      BookmarksController.prototype.delete,
    ),
  ).toBe(HttpStatus.NO_CONTENT);
});

it.each(Object.values(UserRole))(
  'lists only the current user’s bookmarks for role %s without exposing relations',
  async (role) => {
    const { repository, controller, user, response } = setup();
    await expect(controller.findAll({ ...user, role })).resolves.toEqual([
      response,
    ]);
    expect(repository.retrieveBookmarks).toHaveBeenCalledWith(user.id);
  },
);

it('returns an empty list when nothing has been saved', async () => {
  const { repository, controller, user } = setup();
  repository.retrieveBookmarks.mockResolvedValue([]);
  await expect(controller.findAll(user)).resolves.toEqual([]);
});

it('saves using the current user and returns only public bookmark fields', async () => {
  const { repository, controller, user, response } = setup();
  await expect(
    controller.create(user, { materialId: 'material-a' }),
  ).resolves.toEqual(response);
  expect(repository.addBookmark).toHaveBeenCalledWith(user.id, 'material-a');
});

it.each([
  new NotFoundException('Material not found'),
  new ConflictException('Material is already saved'),
])('preserves material lookup and duplicate errors: %s', async (error) => {
  const { repository, controller, user } = setup();
  repository.addBookmark.mockRejectedValue(error);
  await expect(
    controller.create(user, { materialId: 'material-a' }),
  ).rejects.toBe(error);
});

it('deletes by session owner and material ID and returns no body', async () => {
  const { repository, controller, user } = setup();
  await expect(
    controller.delete(user, { materialId: 'material-a' }),
  ).resolves.toBeUndefined();
  expect(repository.deleteBookmark).toHaveBeenCalledWith(user.id, 'material-a');
});

const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

describe.each(['body', 'param'] as const)('bookmark %s validation', (type) => {
  const metadata = { type, metatype: AddBookmarkDto };

  it('accepts a canonical material ID that is not a UUID', async () => {
    await expect(
      pipe.transform({ materialId: 'sdsc:training:gpu-intro' }, metadata),
    ).resolves.toEqual({ materialId: 'sdsc:training:gpu-intro' });
  });

  it.each([
    {},
    { materialId: null },
    { materialId: '' },
    { materialId: ' \t\n' },
    { materialId: 42 },
    { materialId: ['material-a'] },
    { materialId: 'a'.repeat(255) },
    { materialId: 'material-a', userId: 'other-user' },
    { materialId: 'material-a', id: 'other-bookmark' },
  ])('rejects invalid input or ownership injection: %j', async (input) => {
    await expect(pipe.transform(input, metadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
