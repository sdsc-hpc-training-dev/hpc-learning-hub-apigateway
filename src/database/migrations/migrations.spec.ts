import type { QueryRunner } from 'typeorm';
import { EnablePgvector1788856392276 } from './1788856392276-EnablePgvector';
import { CreateIngestionPersistence1788893479707 } from './1788893479707-CreateIngestionPersistence';
import { CreateCuratedLearningPaths1789142400000 } from './1789142400000-CreateCuratedLearningPaths';

interface QueryRunnerStub {
  queries: string[];
  queryRunner: QueryRunner;
}

function queryRunnerStub(): QueryRunnerStub {
  const queries: string[] = [];
  const query = (statement: string): Promise<void> => {
    queries.push(statement);
    return Promise.resolve();
  };

  return {
    queries,
    queryRunner: { query } as unknown as QueryRunner,
  };
}

function normalizeStatements(queries: readonly string[]): string[] {
  return queries.map((statement) => statement.replaceAll(/\s+/g, ' ').trim());
}

describe('pgvector migration', () => {
  it('enables and removes pgvector', async () => {
    const migration = new EnablePgvector1788856392276();
    const { queries, queryRunner } = queryRunnerStub();

    await migration.up(queryRunner);
    await migration.down(queryRunner);

    expect(queries).toEqual([
      'CREATE EXTENSION IF NOT EXISTS vector',
      'DROP EXTENSION IF EXISTS vector',
    ]);
  });
});

describe('ingestion persistence migration', () => {
  it('creates the complete ingestion persistence schema', async () => {
    const migration = new CreateIngestionPersistence1788893479707();
    const { queries, queryRunner } = queryRunnerStub();

    await migration.up(queryRunner);

    expect(normalizeStatements(queries)).toEqual(
      expect.arrayContaining([
        'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
        expect.stringContaining('CREATE TABLE "catalog_snapshots"'),
        expect.stringContaining('CREATE TABLE "training_materials"'),
        expect.stringContaining('CREATE TABLE "content_resources"'),
        expect.stringContaining('CREATE TABLE "content_chunks"'),
        expect.stringContaining('CREATE TABLE "chunk_embeddings"'),
        expect.stringContaining('CREATE TABLE "event_materials"'),
        expect.stringContaining(
          'CREATE UNIQUE INDEX "UQ_catalog_snapshots_one_active"',
        ),
        expect.stringContaining('CREATE INDEX "IDX_event_editions_search"'),
      ]),
    );
    expect(queries).toHaveLength(127);
  });

  it('drops the ingestion persistence schema in dependency-safe order', async () => {
    const migration = new CreateIngestionPersistence1788893479707();
    const { queries, queryRunner } = queryRunnerStub();

    await migration.down(queryRunner);

    const sql = normalizeStatements(queries);
    expect(sql).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'ALTER TABLE "event_materials" DROP CONSTRAINT',
        ),
        'DROP TABLE "chunk_embeddings"',
        'DROP TABLE "content_chunks"',
        'DROP TABLE "training_materials"',
        'DROP TABLE "catalog_snapshots"',
      ]),
    );
    expect(sql.indexOf('DROP TABLE "chunk_embeddings"')).toBeLessThan(
      sql.indexOf('DROP TABLE "content_chunks"'),
    );
    expect(sql.indexOf('DROP TABLE "content_chunks"')).toBeLessThan(
      sql.indexOf('DROP TABLE "training_materials"'),
    );
    expect(queries).toHaveLength(114);
  });
});

describe('curated learning-path migration', () => {
  it('creates the curated-path tables and their ordering constraints', async () => {
    const migration = new CreateCuratedLearningPaths1789142400000();
    const { queries, queryRunner } = queryRunnerStub();

    await migration.up(queryRunner);

    const sql = normalizeStatements(queries);
    expect(sql).toHaveLength(4);
    expect(sql[0]).toEqual(
      expect.stringContaining('CREATE TABLE "curated_learning_paths"'),
    );
    expect(sql[1]).toEqual(
      expect.stringContaining(
        'CREATE INDEX "IDX_curated_learning_paths_public_order"',
      ),
    );
    expect(sql[2]).toEqual(
      expect.stringContaining('CREATE TABLE "curated_path_items"'),
    );
    expect(sql[2]).toEqual(
      expect.stringContaining(
        'CONSTRAINT "UQ_curated_path_items_position" UNIQUE ("path_id", "position")',
      ),
    );
    expect(sql[2]).toEqual(
      expect.stringContaining(
        'CONSTRAINT "FK_curated_path_items_material" FOREIGN KEY ("material_id")',
      ),
    );
    expect(sql[3]).toEqual(
      expect.stringContaining(
        'CREATE INDEX "IDX_curated_path_items_material_id"',
      ),
    );
  });

  it('removes curated-path items before their parent paths', async () => {
    const migration = new CreateCuratedLearningPaths1789142400000();
    const { queries, queryRunner } = queryRunnerStub();

    await migration.down(queryRunner);

    expect(queries).toEqual([
      'DROP TABLE "curated_path_items"',
      'DROP TABLE "curated_learning_paths"',
    ]);
  });
});
