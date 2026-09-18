import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  EventMaterial,
  MaterialInstructor,
  MaterialResource,
  MaterialSystem,
  MaterialTool,
  MaterialTopic,
} from '../database/entities/catalog-relationship.entity';
import { CatalogSnapshot } from '../database/entities/catalog-snapshot.entity';
import {
  ContentResource,
  EventEdition,
  EventSeries,
  Person,
  System,
  Tool,
  Topic,
  TrainingMaterial,
} from '../database/entities/catalog.entity';
import { ResourceType } from '../database/entities/persistence.enums';
import { ActiveSnapshotQuery } from './persistence/active-snapshot.query';
import { TrainingLibraryRepository } from './persistence/training-library.repository';
import { MaterialRecord } from './persistence/training-library.records';
import { TrainingLibraryController } from './training-library.controller';
import { TrainingLibraryModule } from './training-library.module';
import { TrainingLibraryService } from './training-library.service';

type RepositoryMethods = Pick<
  TrainingLibraryRepository,
  | 'findMaterials'
  | 'findMaterialById'
  | 'findResourcesByMaterialId'
  | 'findTopics'
  | 'findTools'
  | 'findSystems'
  | 'findEventSeries'
  | 'findEventSeriesById'
  | 'findEventEditions'
>;

const entity = <T extends object>(
  EntityType: new () => T,
  values: Partial<T>,
): T => Object.assign(new EntityType(), values);

const materialRecord = (): MaterialRecord => ({
  material: entity(TrainingMaterial, {
    id: 'material-1',
    title: 'HPC Basics',
    description: null,
  }),
  eventEditions: [
    entity(EventEdition, {
      id: 'event-1',
      title: 'Workshop',
      description: null,
      startAt: new Date('2026-09-01T10:00:00Z'),
      endAt: null,
      format: 'online',
      location: null,
    }),
  ],
  topics: [entity(Topic, { id: 'topic-z', name: 'Z topic' })],
  tools: [entity(Tool, { id: 'tool-a', name: 'A tool' })],
  systems: [entity(System, { id: 'system-a', name: 'A system' })],
  instructors: [entity(Person, { id: 'person-a', name: 'An Instructor' })],
  resources: [
    entity(ContentResource, {
      id: 'resource-1',
      title: 'Recording',
      resourceType: ResourceType.VIDEO,
      canonicalUrl: 'https://example.org/recording',
      verificationStatus: 'content_verified',
    }),
  ],
});

const repositoryDouble = (): jest.Mocked<RepositoryMethods> => ({
  findMaterials: jest.fn(),
  findMaterialById: jest.fn(),
  findResourcesByMaterialId: jest.fn(),
  findTopics: jest.fn(),
  findTools: jest.fn(),
  findSystems: jest.fn(),
  findEventSeries: jest.fn(),
  findEventSeriesById: jest.fn(),
  findEventEditions: jest.fn(),
});

describe('TrainingLibraryModule', () => {
  it('registers and exports the Training Library providers', () => {
    const controllers = Reflect.getMetadata(
      'controllers',
      TrainingLibraryModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      'providers',
      TrainingLibraryModule,
    ) as unknown[];
    const exports = Reflect.getMetadata(
      'exports',
      TrainingLibraryModule,
    ) as unknown[];

    expect(controllers).toContain(TrainingLibraryController);
    expect(providers).toEqual(
      expect.arrayContaining([
        TrainingLibraryService,
        TrainingLibraryRepository,
        ActiveSnapshotQuery,
      ]),
    );
    expect(exports).toContain(TrainingLibraryService);
  });
});

interface ServiceTestContext {
  repository: jest.Mocked<RepositoryMethods>;
  service: TrainingLibraryService;
}

const serviceTestContext = (): ServiceTestContext => {
  const repository = repositoryDouble();
  return {
    repository,
    service: new TrainingLibraryService(
      repository as unknown as TrainingLibraryRepository,
    ),
  };
};

describe('TrainingLibraryService material listing', () => {
  let repository: jest.Mocked<RepositoryMethods>;
  let service: TrainingLibraryService;

  beforeEach(() => {
    ({ repository, service } = serviceTestContext());
  });

  it('returns a paginated HTTP-02 material projection with safe public fields', async () => {
    repository.findMaterials.mockResolvedValue({
      items: [materialRecord()],
      total: 21,
    });

    await expect(service.findMaterials({})).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 'material-1',
          title: 'HPC Basics',
          description: null,
          resources: [
            {
              id: 'resource-1',
              title: 'Recording',
              type: 'video',
              url: 'https://example.org/recording',
              verificationStatus: 'content_verified',
            },
          ],
        }),
      ],
      page: 1,
      pageSize: 20,
      total: 21,
      totalPages: 2,
    });
  });

  it('normalizes approved filters and pagination before querying', async () => {
    repository.findMaterials.mockResolvedValue({ items: [], total: 0 });

    await service.findMaterials({
      search: '  slurm  ',
      topic: 'topic-1',
      tool: 'tool-1',
      system: 'system-1',
      eventSeries: 'series-1',
      eventEdition: 'edition-1',
      instructor: 'person-1',
      resourceType: 'video',
      page: '2',
      pageSize: '10',
    });

    expect(repository.findMaterials).toHaveBeenCalledWith({
      search: 'slurm',
      topic: 'topic-1',
      tool: 'tool-1',
      system: 'system-1',
      eventSeries: 'series-1',
      eventEdition: 'edition-1',
      instructor: 'person-1',
      resourceType: ResourceType.VIDEO,
      page: 2,
      pageSize: 10,
    });
  });

  it.each([
    [{ page: '0' }, 'page must be a positive integer'],
    [{ page: '1.5' }, 'page must be a positive integer'],
    [
      { pageSize: '101' },
      'pageSize must be a positive integer and at most 100',
    ],
    [{ resourceType: 'book' }, 'resourceType is not supported'],
  ])('rejects an invalid material query', async (query, message) => {
    await expect(service.findMaterials(query)).rejects.toThrow(
      new BadRequestException(message),
    );
  });
});

describe('TrainingLibraryService material detail', () => {
  let repository: jest.Mocked<RepositoryMethods>;
  let service: TrainingLibraryService;

  beforeEach(() => {
    ({ repository, service } = serviceTestContext());
  });

  it('returns material detail and maps dates to ISO strings', async () => {
    repository.findMaterialById.mockResolvedValue(materialRecord());

    await expect(service.findMaterial('material-1')).resolves.toMatchObject({
      id: 'material-1',
      eventEditions: [
        expect.objectContaining({ startAt: '2026-09-01T10:00:00.000Z' }),
      ],
    });
  });

  it('returns not found when material detail is unavailable', async () => {
    repository.findMaterialById.mockResolvedValue(null);
    await expect(service.findMaterial('missing')).rejects.toThrow(
      new NotFoundException('Material "missing" was not found'),
    );
  });

  it('returns resources and rejects a missing material', async () => {
    repository.findResourcesByMaterialId
      .mockResolvedValueOnce(materialRecord().resources)
      .mockResolvedValueOnce(null);

    await expect(service.findResources('material-1')).resolves.toHaveLength(1);
    await expect(service.findResources('missing')).rejects.toThrow(
      new NotFoundException('Material "missing" was not found'),
    );
  });
});

describe('TrainingLibraryService catalog lookups', () => {
  let repository: jest.Mocked<RepositoryMethods>;
  let service: TrainingLibraryService;

  beforeEach(() => {
    ({ repository, service } = serviceTestContext());
  });

  it('maps vocabulary and event lookup records', async () => {
    repository.findTopics.mockResolvedValue([
      entity(Topic, { id: 'topic-1', name: 'Topic' }),
    ]);
    repository.findTools.mockResolvedValue([
      entity(Tool, { id: 'tool-1', name: 'Tool' }),
    ]);
    repository.findSystems.mockResolvedValue([
      entity(System, { id: 'system-1', name: 'System' }),
    ]);
    repository.findEventSeries.mockResolvedValue([
      entity(EventSeries, { id: 'series-1', name: 'Series' }),
    ]);
    repository.findEventEditions.mockResolvedValue(
      materialRecord().eventEditions,
    );

    await expect(service.findTopics()).resolves.toEqual([
      { id: 'topic-1', name: 'Topic' },
    ]);
    await expect(service.findTools()).resolves.toEqual([
      { id: 'tool-1', name: 'Tool' },
    ]);
    await expect(service.findSystems()).resolves.toEqual([
      { id: 'system-1', name: 'System' },
    ]);
    await expect(service.findEventSeries()).resolves.toEqual([
      { id: 'series-1', name: 'Series' },
    ]);
    await expect(service.findEventEditions()).resolves.toHaveLength(1);
  });

  it('returns one event series as a public DTO', async () => {
    repository.findEventSeriesById.mockResolvedValue(
      entity(EventSeries, {
        id: 'series-1',
        name: 'Series',
        reviewStatus: 'internal',
      }),
    );

    await expect(service.findEventSeriesById('series-1')).resolves.toEqual({
      id: 'series-1',
      name: 'Series',
    });
    expect(repository.findEventSeriesById).toHaveBeenCalledWith('series-1');
  });

  it('returns not found when an event series is unavailable', async () => {
    repository.findEventSeriesById.mockResolvedValue(null);

    await expect(service.findEventSeriesById('missing')).rejects.toThrow(
      new NotFoundException('Series "missing" was not found'),
    );
  });
});

describe('TrainingLibraryController', () => {
  it('delegates every HTTP-01 catalog operation to the service', async () => {
    const methods = {
      findMaterials: jest.fn().mockResolvedValue({ items: [] }),
      findMaterial: jest.fn().mockResolvedValue({ id: 'material-1' }),
      findResources: jest.fn().mockResolvedValue([]),
      findTopics: jest.fn().mockResolvedValue([]),
      findTools: jest.fn().mockResolvedValue([]),
      findSystems: jest.fn().mockResolvedValue([]),
      findEventSeries: jest.fn().mockResolvedValue([]),
      findEventSeriesById: jest.fn().mockResolvedValue({ id: 'series-1' }),
      findEventEditions: jest.fn().mockResolvedValue([]),
    };
    const controller = new TrainingLibraryController(
      methods as unknown as TrainingLibraryService,
    );

    await controller.findMaterials({ search: 'hpc' });
    await controller.findMaterial('material-1');
    await controller.findResources('material-1');
    await controller.findTopics();
    await controller.findTools();
    await controller.findSystems();
    await controller.findEventSeries();
    await controller.findEventSeriesById('series-1');
    await controller.findEventEditions();

    expect(methods.findMaterials).toHaveBeenCalledWith({ search: 'hpc' });
    expect(methods.findMaterial).toHaveBeenCalledWith('material-1');
    expect(methods.findResources).toHaveBeenCalledWith('material-1');
    expect(methods.findTopics).toHaveBeenCalledTimes(1);
    expect(methods.findTools).toHaveBeenCalledTimes(1);
    expect(methods.findSystems).toHaveBeenCalledTimes(1);
    expect(methods.findEventSeries).toHaveBeenCalledTimes(1);
    expect(methods.findEventSeriesById).toHaveBeenCalledWith('series-1');
    expect(methods.findEventEditions).toHaveBeenCalledTimes(1);
  });
});

interface EntityRepositoryDouble {
  find: jest.Mock;
  findOne: jest.Mock;
  createQueryBuilder: jest.Mock;
}

interface MaterialQueryBuilderDouble {
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
}

const materialQueryBuilderDouble = (): MaterialQueryBuilderDouble => {
  const builder: MaterialQueryBuilderDouble = {
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn(),
  };
  builder.where.mockReturnValue(builder);
  builder.andWhere.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.addOrderBy.mockReturnValue(builder);
  builder.skip.mockReturnValue(builder);
  builder.take.mockReturnValue(builder);
  return builder;
};

const entityRepositoryDouble = (): EntityRepositoryDouble => ({
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

interface RepositoryTestContext {
  repository: TrainingLibraryRepository;
  activeSnapshot: { findId: jest.Mock };
  query: MaterialQueryBuilderDouble;
  repositories: Map<unknown, EntityRepositoryDouble>;
}

const repositoryTestContext = (): RepositoryTestContext => {
  const query = materialQueryBuilderDouble();
  const entityTypes = [
    TrainingMaterial,
    Topic,
    Tool,
    System,
    EventSeries,
    EventEdition,
    MaterialTopic,
    MaterialTool,
    MaterialSystem,
    MaterialInstructor,
    MaterialResource,
    EventMaterial,
  ];
  const repositories: Map<unknown, EntityRepositoryDouble> = new Map(
    entityTypes.map((entityType) => [entityType, entityRepositoryDouble()]),
  );
  repositories.get(TrainingMaterial)?.createQueryBuilder.mockReturnValue(query);
  const getRepository = jest.fn((entityType: unknown) =>
    repositories.get(entityType),
  );
  const activeSnapshot = { findId: jest.fn() };
  const repository = new TrainingLibraryRepository(
    { getRepository } as unknown as DataSource,
    activeSnapshot as unknown as ActiveSnapshotQuery,
  );

  return { repository, activeSnapshot, query, repositories };
};

const repositoryFor = (
  context: RepositoryTestContext,
  entityType: unknown,
): EntityRepositoryDouble => {
  const repository = context.repositories.get(entityType);
  if (!repository) throw new Error('Missing repository double');
  return repository;
};

const setHydrationResults = (
  context: RepositoryTestContext,
  record: MaterialRecord,
): void => {
  const materialId = record.material.id;
  repositoryFor(context, MaterialTopic).find.mockResolvedValue([
    entity(MaterialTopic, { materialId, topic: record.topics[0]! }),
  ]);
  repositoryFor(context, MaterialTool).find.mockResolvedValue([
    entity(MaterialTool, { materialId, tool: record.tools[0]! }),
  ]);
  repositoryFor(context, MaterialSystem).find.mockResolvedValue([
    entity(MaterialSystem, { materialId, system: record.systems[0]! }),
  ]);
  repositoryFor(context, MaterialInstructor).find.mockResolvedValue([
    entity(MaterialInstructor, {
      materialId,
      person: record.instructors[0]!,
    }),
  ]);
  repositoryFor(context, MaterialResource).find.mockResolvedValue([
    entity(MaterialResource, { materialId, resource: record.resources[0]! }),
  ]);
  repositoryFor(context, EventMaterial).find.mockResolvedValue([
    entity(EventMaterial, {
      materialId,
      eventEdition: record.eventEditions[0]!,
    }),
  ]);
};

describe('ActiveSnapshotQuery', () => {
  it('returns the active snapshot ID or null', async () => {
    const snapshots = entityRepositoryDouble();
    const query = new ActiveSnapshotQuery({
      getRepository: jest.fn(() => snapshots),
    } as unknown as DataSource);
    snapshots.findOne
      .mockResolvedValueOnce(entity(CatalogSnapshot, { id: 'snapshot-active' }))
      .mockResolvedValueOnce(null);

    await expect(query.findId()).resolves.toBe('snapshot-active');
    await expect(query.findId()).resolves.toBeNull();
    expect(snapshots.findOne).toHaveBeenCalledWith({
      select: { id: true },
      where: { status: 'ACTIVE' },
    });
  });
});

describe('TrainingLibraryRepository material listing', () => {
  it('returns an empty page when there is no active snapshot', async () => {
    const context = repositoryTestContext();
    context.activeSnapshot.findId.mockResolvedValue(null);

    await expect(
      context.repository.findMaterials({ page: 1, pageSize: 20 }),
    ).resolves.toEqual({ items: [], total: 0 });
  });

  it('applies every explicit relationship filter and hydrates one page', async () => {
    const context = repositoryTestContext();
    const record = materialRecord();
    context.activeSnapshot.findId.mockResolvedValue('snapshot-active');
    context.query.getManyAndCount.mockResolvedValue([[record.material], 1]);
    setHydrationResults(context, record);

    const result = await context.repository.findMaterials({
      search: 'hpc',
      topic: 'topic-1',
      tool: 'tool-1',
      system: 'system-1',
      eventSeries: 'series-1',
      eventEdition: 'event-1',
      instructor: 'person-1',
      resourceType: ResourceType.VIDEO,
      page: 2,
      pageSize: 10,
    });

    expect(result).toEqual({ items: [record], total: 1 });
    expect(context.query.andWhere).toHaveBeenCalledTimes(8);
    expect(context.query.skip).toHaveBeenCalledWith(10);
    expect(context.query.take).toHaveBeenCalledWith(10);
  });

  it('supports an unfiltered empty result without relationship queries', async () => {
    const context = repositoryTestContext();
    context.activeSnapshot.findId.mockResolvedValue('snapshot-active');
    context.query.getManyAndCount.mockResolvedValue([[], 0]);

    await expect(
      context.repository.findMaterials({ page: 1, pageSize: 20 }),
    ).resolves.toEqual({ items: [], total: 0 });
    expect(context.query.andWhere).not.toHaveBeenCalled();
    expect(repositoryFor(context, MaterialTopic).find).not.toHaveBeenCalled();
  });
});

describe('TrainingLibraryRepository material detail', () => {
  it('returns null without an active snapshot or matching material', async () => {
    const context = repositoryTestContext();
    context.activeSnapshot.findId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('snapshot-active');
    repositoryFor(context, TrainingMaterial).findOne.mockResolvedValue(null);

    await expect(
      context.repository.findMaterialById('missing'),
    ).resolves.toBeNull();
    await expect(
      context.repository.findMaterialById('missing'),
    ).resolves.toBeNull();
  });

  it('hydrates detail and returns its attached resources', async () => {
    const context = repositoryTestContext();
    const record = materialRecord();
    context.activeSnapshot.findId.mockResolvedValue('snapshot-active');
    repositoryFor(context, TrainingMaterial).findOne.mockResolvedValue(
      record.material,
    );
    setHydrationResults(context, record);

    await expect(
      context.repository.findMaterialById(record.material.id),
    ).resolves.toEqual(record);
    await expect(
      context.repository.findResourcesByMaterialId(record.material.id),
    ).resolves.toEqual(record.resources);
  });

  it('returns null resources when the material does not exist', async () => {
    const context = repositoryTestContext();
    context.activeSnapshot.findId.mockResolvedValue(null);
    await expect(
      context.repository.findResourcesByMaterialId('missing'),
    ).resolves.toBeNull();
  });
});

describe('TrainingLibraryRepository catalog lookups', () => {
  it('returns empty lookup collections without an active snapshot', async () => {
    const context = repositoryTestContext();
    context.activeSnapshot.findId.mockResolvedValue(null);

    await expect(context.repository.findTopics()).resolves.toEqual([]);
    await expect(context.repository.findTools()).resolves.toEqual([]);
    await expect(context.repository.findSystems()).resolves.toEqual([]);
    await expect(context.repository.findEventSeries()).resolves.toEqual([]);
    await expect(context.repository.findEventEditions()).resolves.toEqual([]);
  });

  it('reads every lookup collection from the active snapshot', async () => {
    const context = repositoryTestContext();
    context.activeSnapshot.findId.mockResolvedValue('snapshot-active');
    for (const entityType of [Topic, Tool, System, EventSeries, EventEdition]) {
      repositoryFor(context, entityType).find.mockResolvedValue([entityType]);
    }

    await expect(context.repository.findTopics()).resolves.toEqual([Topic]);
    await expect(context.repository.findTools()).resolves.toEqual([Tool]);
    await expect(context.repository.findSystems()).resolves.toEqual([System]);
    await expect(context.repository.findEventSeries()).resolves.toEqual([
      EventSeries,
    ]);
    await expect(context.repository.findEventEditions()).resolves.toEqual([
      EventEdition,
    ]);
  });

  it('finds an event series only within the active snapshot', async () => {
    const context = repositoryTestContext();
    const series = entity(EventSeries, { id: 'series-1', name: 'Series' });
    context.activeSnapshot.findId.mockResolvedValue('snapshot-active');
    repositoryFor(context, EventSeries).findOne.mockResolvedValue(series);

    await expect(
      context.repository.findEventSeriesById('series-1'),
    ).resolves.toEqual(series);
    expect(repositoryFor(context, EventSeries).findOne).toHaveBeenCalledWith({
      where: { id: 'series-1', snapshotId: 'snapshot-active' },
    });
  });

  it('does not look up an event series without an active snapshot', async () => {
    const context = repositoryTestContext();
    context.activeSnapshot.findId.mockResolvedValue(null);

    await expect(
      context.repository.findEventSeriesById('series-1'),
    ).resolves.toBeNull();
    expect(repositoryFor(context, EventSeries).findOne).not.toHaveBeenCalled();
  });
});
