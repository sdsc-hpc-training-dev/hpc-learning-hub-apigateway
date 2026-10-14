import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { UserRole } from '../database/entities/user.entity';
import { MyLearningController } from './my-learning.controller';
import { MyLearningModule } from './my-learning.module';
import { MyLearningService } from './my-learning.service';
import { BookmarksController } from './bookmarks.controller';

const updatedAt = new Date('2026-10-06T12:00:00Z');
const path = {
  id: 'path-id',
  ownerUserId: 'owner-id',
  title: 'My GPU plan',
  description: null,
  createdAt: updatedAt,
  updatedAt,
  owner: { passwordHash: 'private' },
  items: [
    { pathId: 'path-id', materialId: 'material-b', position: 1 },
    { pathId: 'path-id', materialId: 'material-a', position: 0 },
  ],
};

describe('MyLearningModule', () => {
  let module: TestingModule;
  let controller: MyLearningController;
  const find = jest.fn();
  const getRepository = jest.fn().mockReturnValue({ find });

  beforeEach(async () => {
    jest.clearAllMocks();
    find.mockResolvedValue([]);
    module = await Test.createTestingModule({ imports: [MyLearningModule] })
      .useMocker((provider) => {
        if (provider === DataSource) return { getRepository };
        return undefined;
      })
      .compile();
    controller = module.get(MyLearningController);
  });

  afterEach(async () => {
    await module.close();
  });

  it('registers the controller and service with Nest dependency injection', () => {
    expect(controller).toBeInstanceOf(MyLearningController);
    expect(module.get(MyLearningService)).toBeInstanceOf(MyLearningService);
    expect(module.get(BookmarksController)).toBeInstanceOf(BookmarksController);
  });

  it('requires session authentication for the personal learning paths route', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MyLearningController)).toBe(
      'me/learning-paths',
    );
    expect(
      Reflect.getMetadata(GUARDS_METADATA, MyLearningController),
    ).toContain(SessionAuthGuard);
  });

  it('returns an empty array and filters by the authenticated owner', async () => {
    await expect(
      controller.findAll({ id: 'owner-id', role: UserRole.LEARNER }),
    ).resolves.toEqual([]);
    expect(find).toHaveBeenCalledWith({
      where: { ownerUserId: 'owner-id' },
      relations: { items: true },
      order: { updatedAt: 'DESC', id: 'ASC' },
    });
  });

  it('returns ordered items and empty paths without exposing owner data', async () => {
    find.mockResolvedValue([path, { ...path, id: 'empty-path', items: [] }]);
    const expected = {
      id: path.id,
      title: path.title,
      description: null,
      createdAt: updatedAt,
      updatedAt,
      items: [
        { materialId: 'material-a', position: 0 },
        { materialId: 'material-b', position: 1 },
      ],
    };
    await expect(
      controller.findAll({ id: 'owner-id', role: UserRole.LEARNER }),
    ).resolves.toEqual([
      expected,
      { ...expected, id: 'empty-path', items: [] },
    ]);
    expect(path.items[0]?.position).toBe(1);
  });
});
