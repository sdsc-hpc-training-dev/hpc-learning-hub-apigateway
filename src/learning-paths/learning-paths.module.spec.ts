jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
  TypeOrmModule: {
    forFeature: (entities: unknown): unknown => entities,
  },
}));

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TrainingMaterial } from '../database/entities/catalog.entity';
import {
  CuratedLearningPath,
  CuratedPathItem,
} from '../database/entities/curated-learning-path.entity';
import { SnapshotStatus } from '../database/entities/persistence.enums';
import { LearningPathsController } from './learning-paths.controller';
import { LearningPathsModule } from './learning-paths.module';
import { LearningPathsService } from './learning-paths.service';
import { LearningPathsRepository } from './persistence/learning-paths.repository';

type RepositoryMethods = Pick<
  LearningPathsRepository,
  'findPublished' | 'findPublishedById'
>;

const material = (
  id: string,
  title: string,
  description: string | null,
): TrainingMaterial =>
  Object.assign(new TrainingMaterial(), { id, title, description });

const pathFixture = (): CuratedLearningPath => {
  const path = Object.assign(new CuratedLearningPath(), {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'HPC starter path',
    description: 'Learn the basics in order.',
    audience: 'Beginners',
    prerequisites: null,
    estimatedScope: 'Three sessions',
    isPublished: true,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-02T00:00:00Z'),
  });

  path.items = [
    Object.assign(new CuratedPathItem(), {
      pathId: path.id,
      materialId: 'material-second',
      position: 1,
      path,
      material: material('material-second', 'Second material', null),
    }),
    Object.assign(new CuratedPathItem(), {
      pathId: path.id,
      materialId: 'material-first',
      position: 0,
      path,
      material: material('material-first', 'First material', 'Start here.'),
    }),
  ];

  return path;
};

describe('LearningPathsModule', () => {
  it('registers the controller, service, and repository in the feature module', () => {
    const controllers = Reflect.getMetadata(
      'controllers',
      LearningPathsModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      LearningPathsModule,
    ) as unknown[];

    expect(controllers).toContain(LearningPathsController);
    expect(providers).toEqual(
      expect.arrayContaining([LearningPathsService, LearningPathsRepository]),
    );
  });
});

interface LearningPathsTestContext {
  controller: LearningPathsController;
  service: LearningPathsService;
  repository: jest.Mocked<RepositoryMethods>;
}

const learningPathsTestContext =
  async (): Promise<LearningPathsTestContext> => {
    const repository: jest.Mocked<RepositoryMethods> = {
      findPublished: jest.fn(),
      findPublishedById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LearningPathsController],
      providers: [
        LearningPathsService,
        { provide: LearningPathsRepository, useValue: repository },
      ],
    }).compile();

    return {
      controller: module.get(LearningPathsController),
      service: module.get(LearningPathsService),
      repository,
    };
  };

describe('LearningPathsService', () => {
  let service: LearningPathsService;
  let repository: jest.Mocked<RepositoryMethods>;

  beforeEach(async () => {
    ({ service, repository } = await learningPathsTestContext());
  });

  it('returns published paths as public DTOs with ordered material items', async () => {
    repository.findPublished.mockResolvedValue([pathFixture()]);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: '00000000-0000-4000-8000-000000000001',
        title: 'HPC starter path',
        description: 'Learn the basics in order.',
        audience: 'Beginners',
        prerequisites: null,
        estimatedScope: 'Three sessions',
        items: [
          {
            position: 0,
            material: {
              id: 'material-first',
              title: 'First material',
              description: 'Start here.',
            },
          },
          {
            position: 1,
            material: {
              id: 'material-second',
              title: 'Second material',
              description: null,
            },
          },
        ],
      },
    ]);
  });

  it('returns an empty collection when no published paths exist', async () => {
    repository.findPublished.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);
  });

  it('returns one published path by ID', async () => {
    const path = pathFixture();
    repository.findPublishedById.mockResolvedValue(path);

    await expect(service.findOne(path.id)).resolves.toMatchObject({
      id: path.id,
      title: path.title,
    });
    expect(repository.findPublishedById).toHaveBeenCalledWith(path.id);
  });

  it('returns not found for an unknown or unpublished path', async () => {
    repository.findPublishedById.mockResolvedValue(null);

    await expect(service.findOne('hidden-path')).rejects.toThrow(
      new NotFoundException('Learning path "hidden-path" was not found'),
    );
  });
});

describe('LearningPathsController', () => {
  let controller: LearningPathsController;
  let service: LearningPathsService;

  beforeEach(async () => {
    ({ controller, service } = await learningPathsTestContext());
  });

  it('delegates both public endpoints to the service', async () => {
    const findAll = jest.spyOn(service, 'findAll').mockResolvedValue([]);
    const findOne = jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'path-id',
      title: 'Path',
      description: null,
      audience: null,
      prerequisites: null,
      estimatedScope: null,
      items: [],
    });

    await expect(controller.findAll()).resolves.toEqual([]);
    await expect(controller.findOne('path-id')).resolves.toMatchObject({
      id: 'path-id',
    });
    expect(findAll).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith('path-id');
  });
});

interface QueryBuilderDouble {
  innerJoinAndSelect: jest.Mock;
  innerJoin: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  getMany: jest.Mock;
  getOne: jest.Mock;
}

const queryBuilderDouble = (): QueryBuilderDouble => {
  const builder: QueryBuilderDouble = {
    innerJoinAndSelect: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  builder.innerJoinAndSelect.mockReturnValue(builder);
  builder.innerJoin.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.andWhere.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.addOrderBy.mockReturnValue(builder);

  return builder;
};

describe('LearningPathsRepository', () => {
  let builder: QueryBuilderDouble;
  let repository: LearningPathsRepository;

  beforeEach(() => {
    builder = queryBuilderDouble();
    const paths = {
      createQueryBuilder: jest.fn(
        () => builder as unknown as SelectQueryBuilder<CuratedLearningPath>,
      ),
    } as unknown as Repository<CuratedLearningPath>;

    repository = new LearningPathsRepository(paths);
  });

  it('loads only published paths whose materials belong to the active snapshot', async () => {
    builder.getMany.mockResolvedValue([pathFixture()]);

    await expect(repository.findPublished()).resolves.toHaveLength(1);
    expect(builder.where).toHaveBeenCalledWith(
      'path.isPublished = :isPublished',
      { isPublished: true },
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      'snapshot.status = :snapshotStatus',
      { snapshotStatus: SnapshotStatus.ACTIVE },
    );
    expect(builder.addOrderBy).toHaveBeenCalledWith('item.position', 'ASC');
  });

  it('adds the requested path ID to the public-path query', async () => {
    const path = pathFixture();
    builder.getOne.mockResolvedValue(path);

    await expect(repository.findPublishedById(path.id)).resolves.toBe(path);
    expect(builder.andWhere).toHaveBeenCalledWith('path.id = :pathId', {
      pathId: path.id,
    });
  });
});
