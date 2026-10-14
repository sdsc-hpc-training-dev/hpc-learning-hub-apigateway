import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { SnapshotImportRun } from './snapshot-import-run.entity';
import { SnapshotStatus } from './persistence.enums';

@Entity({ name: 'catalog_snapshots' })
@Index('UQ_catalog_snapshots_one_active', ['status'], {
  unique: true,
  where: `"status" = 'ACTIVE'`,
})
@Check(
  'CHK_catalog_snapshots_activated_status',
  '"activated_at" IS NULL OR "status" IN (\'ACTIVE\', \'RETIRED\')',
)
export class CatalogSnapshot {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'schema_version' })
  schemaVersion!: string;

  @Column('text', { name: 'code_version', nullable: true })
  codeVersion!: string | null;

  @Column('text', { name: 'pipeline_code_hash', nullable: true })
  pipelineCodeHash!: string | null;

  @Column('text', { name: 'configuration_hash', nullable: true })
  configurationHash!: string | null;

  @Column('text', { name: 'curation_version', nullable: true })
  curationVersion!: string | null;

  @Column('text', { name: 'id_registry_version', nullable: true })
  idRegistryVersion!: string | null;

  @Column('text', { name: 'dataset_scope', nullable: true })
  datasetScope!: string | null;

  @Column('boolean', { name: 'source_tree_dirty', nullable: true })
  sourceTreeDirty!: boolean | null;

  @Column('timestamptz', { name: 'generated_at', nullable: true })
  generatedAt!: Date | null;

  @Column('text', { name: 'bucket_object_key', unique: true })
  bucketObjectKey!: string;

  @Column('text', { name: 'object_sha256' })
  objectSha256!: string;

  @Column('text', { name: 'manifest_sha256', nullable: true })
  manifestSha256!: string | null;

  @Column('jsonb', { name: 'file_checksums' })
  fileChecksums!: Record<string, unknown>;

  @Column('jsonb', { name: 'source_hashes', nullable: true })
  sourceHashes!: Record<string, unknown> | null;

  @Column('jsonb', { name: 'entity_counts' })
  entityCounts!: Record<string, unknown>;

  @Column('jsonb', { name: 'relationship_counts' })
  relationshipCounts!: Record<string, unknown>;

  @Column('jsonb', { name: 'projection_manifests', nullable: true })
  projectionManifests!: Record<string, unknown> | null;

  @Column('jsonb', { name: 'vocabulary_versions', nullable: true })
  vocabularyVersions!: Record<string, unknown> | null;

  @Column('enum', {
    enum: SnapshotStatus,
    enumName: 'snapshot_status_enum',
  })
  status!: SnapshotStatus;

  @Column('timestamptz', { name: 'validated_at', nullable: true })
  validatedAt!: Date | null;

  @Column('timestamptz', { name: 'activated_at', nullable: true })
  activatedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => SnapshotImportRun, (run) => run.snapshot)
  importRuns!: SnapshotImportRun[];
}
