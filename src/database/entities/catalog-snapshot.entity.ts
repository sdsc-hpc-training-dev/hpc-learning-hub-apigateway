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

  @Column('text', { name: 'code_version' })
  codeVersion!: string;

  @Column('text', { name: 'pipeline_code_hash' })
  pipelineCodeHash!: string;

  @Column('text', { name: 'configuration_hash' })
  configurationHash!: string;

  @Column('text', { name: 'curation_version' })
  curationVersion!: string;

  @Column('text', { name: 'id_registry_version' })
  idRegistryVersion!: string;

  @Column('text', { name: 'dataset_scope' })
  datasetScope!: string;

  @Column('boolean', { name: 'source_tree_dirty' })
  sourceTreeDirty!: boolean;

  @Column('timestamptz', { name: 'generated_at' })
  generatedAt!: Date;

  @Column('text', { name: 'bucket_object_key', unique: true })
  bucketObjectKey!: string;

  @Column('text', { name: 'object_sha256' })
  objectSha256!: string;

  @Column('jsonb', { name: 'file_checksums' })
  fileChecksums!: Record<string, unknown>;

  @Column('jsonb', { name: 'source_hashes' })
  sourceHashes!: Record<string, unknown>;

  @Column('jsonb', { name: 'entity_counts' })
  entityCounts!: Record<string, unknown>;

  @Column('jsonb', { name: 'relationship_counts' })
  relationshipCounts!: Record<string, unknown>;

  @Column('jsonb', { name: 'projection_manifests' })
  projectionManifests!: Record<string, unknown>;

  @Column('jsonb', { name: 'vocabulary_versions' })
  vocabularyVersions!: Record<string, unknown>;

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
