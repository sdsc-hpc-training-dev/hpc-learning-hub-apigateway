import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CatalogSnapshot } from './catalog-snapshot.entity';
import { ImportRunStatus } from './persistence.enums';
import { SnapshotImportError } from './snapshot-import-error.entity';

@Entity({ name: 'snapshot_import_runs' })
@Index('IDX_snapshot_import_runs_snapshot_id', ['snapshotId'])
@Check(
  'CHK_snapshot_import_runs_counts',
  '"source_chunk_count" >= 0 AND "imported_chunk_count" >= 0 AND "embedding_count" >= 0 AND "error_count" >= 0',
)
export class SnapshotImportRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { name: 'snapshot_id' })
  snapshotId!: string;

  @Column('text', { name: 'importer_version' })
  importerVersion!: string;

  @Column('text', { name: 'mapping_version', nullable: true })
  mappingVersion!: string | null;

  @Column('enum', {
    enum: ImportRunStatus,
    enumName: 'import_run_status_enum',
  })
  status!: ImportRunStatus;

  @Column('timestamptz', { name: 'started_at', default: () => 'now()' })
  startedAt!: Date;

  @Column('timestamptz', { name: 'completed_at', nullable: true })
  completedAt!: Date | null;

  @Column('jsonb', { name: 'source_entity_counts', default: {} })
  sourceEntityCounts!: Record<string, unknown>;

  @Column('jsonb', { name: 'imported_entity_counts', default: {} })
  importedEntityCounts!: Record<string, unknown>;

  @Column('jsonb', { name: 'source_relationship_counts', default: {} })
  sourceRelationshipCounts!: Record<string, unknown>;

  @Column('jsonb', { name: 'imported_relationship_counts', default: {} })
  importedRelationshipCounts!: Record<string, unknown>;

  @Column('integer', { name: 'source_chunk_count', default: 0 })
  sourceChunkCount!: number;

  @Column('integer', { name: 'imported_chunk_count', default: 0 })
  importedChunkCount!: number;

  @Column('integer', { name: 'embedding_count', default: 0 })
  embeddingCount!: number;

  @Column('integer', { name: 'error_count', default: 0 })
  errorCount!: number;

  @Column('boolean', { name: 'validation_passed', default: false })
  validationPassed!: boolean;

  @Column('text', { name: 'validation_report_key', nullable: true })
  validationReportKey!: string | null;

  @ManyToOne(() => CatalogSnapshot, (snapshot) => snapshot.importRuns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'snapshot_id' })
  snapshot!: CatalogSnapshot;

  @OneToMany(() => SnapshotImportError, (error) => error.importRun)
  errors!: SnapshotImportError[];
}
