jest.mock('dotenv/config', () => {
  process.env.DB_USERNAME = 'test_gateway';
  process.env.DB_PASSWORD = 'test_password';
  process.env.DB_DATABASE = 'test_learning_hub';
  return {};
});

import { DataSource, EntityMetadata } from 'typeorm';
import dataSource, {
  parseDatabasePort,
  requireDatabaseSetting,
} from '../data-source';
import { persistenceEntities } from './persistence.entities';
import {
  ChunkSourceKind,
  ImportRunStatus,
  ResourceType,
  SnapshotStatus,
} from './persistence.enums';

class MetadataDataSource extends DataSource {
  buildMetadata(): Promise<void> {
    return this.buildMetadatas();
  }
}

const expectedTables = [
  'catalog_snapshots',
  'chunk_embeddings',
  'content_chunks',
  'content_resource_files',
  'content_resources',
  'event_editions',
  'event_materials',
  'event_series',
  'event_series_aliases',
  'event_series_editions',
  'material_instructors',
  'material_resources',
  'material_systems',
  'material_tools',
  'material_topics',
  'people',
  'snapshot_import_errors',
  'snapshot_import_runs',
  'system_aliases',
  'systems',
  'tool_aliases',
  'tools',
  'topic_aliases',
  'topics',
  'training_materials',
];

let metadata: EntityMetadata[];

beforeAll(async () => {
  const metadataSource = new MetadataDataSource({
    type: 'postgres',
    database: 'metadata_test',
    entities: [...persistenceEntities],
  });

  await metadataSource.buildMetadata();
  metadata = metadataSource.entityMetadatas;
});

const table = (name: string): EntityMetadata => {
  const entity = metadata.find((item) => item.tableName === name);
  if (!entity) throw new Error(`Missing entity metadata for ${name}`);
  return entity;
};

describe('persistence entity registration', () => {
  it('registers every ingestion persistence table exactly once', () => {
    const actualTables = metadata.map((item) => item.tableName).sort();

    expect(actualTables).toEqual(expectedTables);
    expect(new Set(persistenceEntities).size).toBe(persistenceEntities.length);
  });

  it('allows TypeORM to construct every entity without application arguments', () => {
    const instances = persistenceEntities.map((EntityType) => new EntityType());

    expect(instances).toHaveLength(expectedTables.length);
    expect(instances.map((instance) => instance.constructor)).toEqual(
      persistenceEntities,
    );
  });

  it('maps catalog snapshot identity, lifecycle, and audit columns', () => {
    const snapshot = table('catalog_snapshots');
    const columns = new Map(
      snapshot.columns.map((column) => [column.databaseName, column]),
    );

    expect([...columns.keys()]).toEqual(
      expect.arrayContaining([
        'id',
        'schema_version',
        'bucket_object_key',
        'object_sha256',
        'status',
        'validated_at',
        'activated_at',
        'created_at',
      ]),
    );
    expect(columns.get('id')?.isPrimary).toBe(true);
    expect(
      snapshot.uniques.some((unique) =>
        unique.columns.some(
          (column) => column.databaseName === 'bucket_object_key',
        ),
      ),
    ).toBe(true);
    expect(columns.get('status')?.enum).toEqual(Object.values(SnapshotStatus));
    expect(snapshot.indices.map((index) => index.givenName)).toContain(
      'UQ_catalog_snapshots_one_active',
    );
    expect(snapshot.checks.map((check) => check.name)).toContain(
      'CHK_catalog_snapshots_activated_status',
    );
  });
});

describe('retrieval persistence metadata', () => {
  it('maps chunk evidence and pgvector embedding metadata', () => {
    const chunks = table('content_chunks');
    const embeddings = table('chunk_embeddings');
    const chunkColumns = new Map(
      chunks.columns.map((column) => [column.databaseName, column]),
    );
    const embeddingColumns = new Map(
      embeddings.columns.map((column) => [column.databaseName, column]),
    );

    expect(chunkColumns.get('source_kind')?.enum).toEqual(
      Object.values(ChunkSourceKind),
    );
    expect(chunkColumns.get('text')?.isNullable).toBe(false);
    expect(chunkColumns.get('event_edition_id')?.isNullable).toBe(true);
    expect(embeddingColumns.get('embedding')?.type).toBe('vector');
    expect(embeddingColumns.get('dimensions')?.type).toBe('integer');
    expect(embeddings.uniques.map((unique) => unique.name)).toContain(
      'UQ_chunk_embeddings_model',
    );
    expect(embeddings.checks.map((check) => check.name)).toEqual(
      expect.arrayContaining([
        'CHK_chunk_embeddings_dimensions_positive',
        'CHK_chunk_embeddings_vector_dimensions',
      ]),
    );
  });

  it('defines cascade relations for snapshot-owned and joined records', () => {
    const materialResources = table('material_resources');
    const relationTargets = new Map(
      materialResources.relations.map((relation) => [
        relation.propertyName,
        relation.inverseEntityMetadata.tableName,
      ]),
    );

    expect(relationTargets).toEqual(
      new Map([
        ['snapshot', 'catalog_snapshots'],
        ['material', 'training_materials'],
        ['resource', 'content_resources'],
      ]),
    );
    expect(
      materialResources.relations.every(
        (relation) => relation.onDelete === 'CASCADE',
      ),
    ).toBe(true);
  });
});

describe('persistence contract enumerations', () => {
  it('keeps all persisted enum values aligned with the ingestion contract', () => {
    expect(Object.values(SnapshotStatus)).toEqual([
      'RECEIVED',
      'VALIDATED',
      'ACTIVE',
      'REJECTED',
      'RETIRED',
    ]);
    expect(Object.values(ImportRunStatus)).toEqual([
      'PENDING',
      'RUNNING',
      'SUCCEEDED',
      'FAILED',
    ]);
    expect(Object.values(ResourceType)).toEqual([
      'CATALOG_METADATA',
      'REPOSITORY',
      'REPOSITORY_SESSION',
      'SLIDES',
      'TRANSCRIPT',
      'VIDEO',
      'WEBPAGE',
    ]);
  });
});

describe('TypeORM data source safety', () => {
  it('uses PostgreSQL migrations without destructive schema synchronization', () => {
    const options = dataSource.options;
    if (options.type !== 'postgres') {
      throw new Error('The persistence data source must use PostgreSQL');
    }

    expect(options.synchronize).toBe(false);
    expect(options.dropSchema).toBe(false);
    expect(options.uuidExtension).toBe('pgcrypto');
    expect(options.entities).toEqual(
      expect.arrayContaining([expect.stringContaining('*.entity')]),
    );
    expect(options.migrations).toEqual(
      expect.arrayContaining([expect.stringContaining('migrations')]),
    );
  });

  it('uses the standard PostgreSQL port when DB_PORT is absent', () => {
    expect(parseDatabasePort(undefined)).toBe(5432);
  });

  it.each(['0', '65536', '1.5', 'not-a-number'])(
    'rejects invalid standalone migration port %s',
    (port) => {
      expect(() => parseDatabasePort(port)).toThrow(
        'DB_PORT must be an integer between 1 and 65535',
      );
    },
  );

  it('requires credentials used by the standalone migration CLI', () => {
    expect(requireDatabaseSetting('DB_USERNAME', 'gateway')).toBe('gateway');
    expect(() => requireDatabaseSetting('DB_USERNAME', undefined)).toThrow(
      'DB_USERNAME is required',
    );
  });
});
