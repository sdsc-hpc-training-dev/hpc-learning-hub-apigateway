/* eslint-disable max-lines-per-function -- Integration fixture setup and assertions stay together for review. */
import { DataSource } from 'typeorm';
import { persistenceEntities } from '../../database/entities/persistence.entities';
import { TrainingLibraryRepository } from './training-library.repository';
import { ActiveSnapshotQuery } from './active-snapshot.query';
import { TrainingLibraryService } from '../training-library.service';
import { ResourceType } from '../../database/entities/persistence.enums';

// Opt-in, disposable LOCAL database only. No cloud credentials are accepted.
const integration = process.env.TRAINING_LIBRARY_TEST_PORT
  ? describe
  : describe.skip;
integration('Training Library PostgreSQL ranking and pagination', () => {
  let ds: DataSource;
  let repository: TrainingLibraryRepository;
  let service: TrainingLibraryService;
  const schema = 'training_library_ranking_test';
  const catalogTables = [
    'training_materials',
    'content_resources',
    'event_editions',
    'event_series',
    'topics',
    'tools',
    'systems',
    'people',
    'material_resources',
    'event_materials',
    'event_series_editions',
    'material_topics',
    'material_tools',
    'material_systems',
    'material_instructors',
  ];

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      host: '127.0.0.1',
      port: Number(process.env.TRAINING_LIBRARY_TEST_PORT),
      username: 'postgres',
      password: 'local-ranking-test',
      database: 'ranking_test',
      entities: [...persistenceEntities],
      schema,
      extra: { options: `-c search_path=${schema}` },
      synchronize: false,
    });
    await ds.initialize();
    await ds.query(`CREATE SCHEMA ${schema}`);
    for (const metadata of ds.entityMetadatas.filter((meta) =>
      catalogTables.includes(meta.tableName),
    )) {
      const definitions = metadata.columns.map(
        (column) =>
          `"${column.databaseName}" ${column.type === 'enum' ? 'text' : String(column.type)}`,
      );
      await ds.query(
        `CREATE TABLE "${metadata.tableName}" (${definitions.join(', ')})`,
      );
    }
    repository = new TrainingLibraryRepository(ds, {
      findId: () => Promise.resolve('s'),
    } as ActiveSnapshotQuery);
    service = new TrainingLibraryService(repository);
  });

  afterAll(async () => {
    if (ds?.isInitialized) {
      await ds.query(`DROP SCHEMA ${schema} CASCADE`);
      await ds.destroy();
    }
  });

  beforeEach(async () => {
    for (const table of catalogTables) await ds.query(`TRUNCATE ${table}`);
  });

  async function material(
    id: string,
    {
      title = 'Slurm training',
      description = 'Learn how to schedule parallel computing jobs with Slurm.',
      date = '2025-01-01',
      url = 'https://example.org/training',
      verification = 'content_verified',
      status = 'available',
      resourceType = 'VIDEO',
      snapshot = 's',
    }: {
      title?: string | null;
      description?: string | null;
      date?: string | null;
      url?: string | null;
      verification?: string;
      status?: string;
      resourceType?: string;
      snapshot?: string;
    } = {},
  ) {
    await ds.query(
      'INSERT INTO training_materials (id, snapshot_id, title, description) VALUES ($1, $2, $3, $4)',
      [id, snapshot, title, description],
    );
    if (url !== null) {
      await ds.query(
        'INSERT INTO content_resources (id, snapshot_id, resource_type, canonical_url, verification_status, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, snapshot, resourceType, url, verification, status],
      );
      await ds.query(
        'INSERT INTO material_resources (relationship_id, snapshot_id, material_id, resource_id) VALUES ($1, $2, $1, $1)',
        [id, snapshot],
      );
    }
    if (date !== null) {
      await ds.query(
        'INSERT INTO event_editions (id, snapshot_id, start_at) VALUES ($1, $2, $3)',
        [id, snapshot, date],
      );
      await ds.query(
        'INSERT INTO event_materials (relationship_id, snapshot_id, material_id, event_edition_id) VALUES ($1, $2, $1, $1)',
        [id, snapshot],
      );
    }
  }
  const ids = async (page = 1, pageSize = 10) =>
    (await repository.findMaterials({ page, pageSize })).items.map(
      (item) => item.material.id,
    );

  it('preserves Gateway websearch semantics and the frontend phrase-within-one-field search', async () => {
    await material('cross-field', { title: 'Batch', description: 'Computing' });
    expect(
      (
        await repository.findMaterials({
          search: 'batch computing',
          page: 1,
          pageSize: 10,
        })
      ).total,
    ).toBe(1);
    expect(
      (
        await repository.findMaterials({
          search: 'batch computing',
          searchMode: 'phrase',
          page: 1,
          pageSize: 10,
        })
      ).total,
    ).toBe(0);
  });

  it('ranks complete usable verified resources first, then recency, missing dates, incomplete content, unverified and unusable resources', async () => {
    await material('recent');
    await material('old', { date: '2019-01-01' });
    await material('missing-date', { date: null });
    await material('incomplete', {
      title: null,
      description: null,
      date: '2026-01-01',
    });
    await material('unverified', {
      verification: 'normalized_unverified',
      date: '2026-01-01',
    });
    await material('no-resource', { url: null });
    await material('broken', { status: 'error', date: '2030-01-01' });
    await material('unknown-path', {
      url: 'https://github.com/a/b/tree/unknown/x',
      date: '2031-01-01',
    });
    await material('metadata-only', {
      resourceType: 'CATALOG_METADATA',
      date: '2032-01-01',
    });
    const ordered = await ids();
    expect(ordered.slice(0, 5)).toEqual([
      'recent',
      'old',
      'missing-date',
      'incomplete',
      'unverified',
    ]);
    expect(new Set(ordered.slice(5))).toEqual(
      new Set(['no-resource', 'broken', 'unknown-path', 'metadata-only']),
    );
  });

  it('uses metadata coverage and then title/ID for stable ties without multiplying records for multiple relationships', async () => {
    await material('b', { title: 'Beta training' });
    await material('a2', { title: 'Alpha training' });
    await material('a1', { title: 'Alpha training' });
    await material('metadata', { title: 'Zulu training' });
    await ds.query(
      "INSERT INTO topics (id, snapshot_id, name) VALUES ('t', 's', 'Batch Computing')",
    );
    await ds.query(
      "INSERT INTO material_topics (relationship_id, snapshot_id, material_id, topic_id) VALUES ('mt', 's', 'metadata', 't')",
    );
    expect(await ids()).toEqual(['metadata', 'a1', 'a2', 'b']);
    expect(await ids()).toEqual(await ids());
  });

  it('returns ten hydrated records per full page, correct counts and disjoint stable pages', async () => {
    for (let i = 0; i < 25; i++)
      await material(`m${String(i).padStart(2, '0')}`);
    await material('other-snapshot', { snapshot: 'other' });
    const first = await service.findMaterials({});
    const second = await service.findMaterials({ page: 2 });
    const third = await service.findMaterials({ page: 3 });
    expect(first).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      sort: 'recommended',
      rankingVersion: 'recommended-v1',
    });
    expect(first.items).toHaveLength(10);
    expect(second.items).toHaveLength(10);
    expect(third.items).toHaveLength(5);
    expect(
      new Set(
        [...first.items, ...second.items, ...third.items].map(
          (item) => item.id,
        ),
      ).size,
    ).toBe(25);
    expect((await service.findMaterials({ page: 4 })).items).toEqual([]);
  });

  it('applies search and all relationship/resource/date filters before counting and paging; supports legacy names and IDs', async () => {
    await ds.query(
      "INSERT INTO topics (id, snapshot_id, name) VALUES ('t', 's', 'Batch Computing')",
    );
    await ds.query(
      "INSERT INTO tools (id, snapshot_id, name) VALUES ('tool', 's', 'Slurm')",
    );
    await ds.query(
      "INSERT INTO systems (id, snapshot_id, name) VALUES ('system', 's', 'Expanse')",
    );
    await ds.query(
      "INSERT INTO people (id, snapshot_id, name) VALUES ('person', 's', 'Teacher')",
    );
    await ds.query(
      "INSERT INTO event_series (id, snapshot_id, name) VALUES ('series', 's', 'Program')",
    );
    for (let i = 0; i < 12; i++) {
      const id = `match${i}`;
      await material(id);
      for (const [table, column, value] of [
        ['material_topics', 'topic_id', 't'],
        ['material_tools', 'tool_id', 'tool'],
        ['material_systems', 'system_id', 'system'],
        ['material_instructors', 'person_id', 'person'],
      ]) {
        await ds.query(
          `INSERT INTO ${table} (relationship_id, snapshot_id, material_id, ${column}) VALUES ($1, 's', $2, $3)`,
          [id, id, value],
        );
      }
      await ds.query(
        "INSERT INTO event_series_editions (relationship_id, snapshot_id, event_edition_id, event_series_id) VALUES ($1, 's', $1, 'series')",
        [id],
      );
    }
    await material('excluded', { title: 'Unrelated content' });
    const filters = {
      search: 'Slurm',
      searchMode: 'phrase' as const,
      topic: 'batch computing',
      tool: 'tool',
      system: 'expanse',
      instructor: 'person',
      eventSeries: 'series',
      resourceType: ResourceType.VIDEO,
      date: '2025-01-01',
    };
    const first = await repository.findMaterials({
      ...filters,
      page: 1,
      pageSize: 10,
    });
    const second = await repository.findMaterials({
      ...filters,
      page: 2,
      pageSize: 10,
    });
    expect(first.total).toBe(12);
    expect(first.items).toHaveLength(10);
    expect(second.items).toHaveLength(2);
    expect(
      new Set([...first.items, ...second.items].map((item) => item.material.id))
        .size,
    ).toBe(12);
    expect(
      (
        await repository.findMaterials({
          ...filters,
          eventEdition: 'match0',
          page: 1,
          pageSize: 10,
        })
      ).total,
    ).toBe(1);
    expect(
      (
        await repository.findMaterials({
          ...filters,
          date: '2024-01-01',
          page: 1,
          pageSize: 10,
        })
      ).total,
    ).toBe(0);
  });

  it('ranks title matches ahead of description matches and treats search wildcards literally', async () => {
    await material('description', {
      title: 'A batch tutorial',
      date: '2026-01-01',
    });
    await material('title', { title: 'Slurm tutorial', date: '2019-01-01' });
    await material('exact', { title: 'Slurm' });
    const matches = await repository.findMaterials({
      search: 'Slurm',
      searchMode: 'phrase' as const,
      page: 1,
      pageSize: 10,
    });
    expect(matches.items.map((item) => item.material.id)).toEqual([
      'exact',
      'title',
      'description',
    ]);
    expect(
      (
        await repository.findMaterials({
          search: '%',
          searchMode: 'phrase',
          page: 1,
          pageSize: 10,
        })
      ).total,
    ).toBe(0);
    await material('literal', { title: '100% Slurm_training' });
    expect(
      (
        await repository.findMaterials({
          search: '% Slurm_',
          searchMode: 'phrase',
          page: 1,
          pageSize: 10,
        })
      ).total,
    ).toBe(1);
    expect(
      (
        await repository.findMaterials({ sort: 'title', page: 1, pageSize: 10 })
      ).items.map((item) => item.material.id),
    ).toEqual(['literal', 'description', 'exact', 'title']);
  });
});
