import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SnapshotImportRun } from './snapshot-import-run.entity';

@Entity({ name: 'snapshot_import_errors' })
@Index('IDX_snapshot_import_errors_import_run_id', ['importRunId'])
export class SnapshotImportError {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'import_run_id' })
  importRunId!: string;

  @Column('text')
  stage!: string;

  @Column('text', { name: 'entity_type', nullable: true })
  entityType!: string | null;

  @Column('text', { name: 'source_record_id', nullable: true })
  sourceRecordId!: string | null;

  @Column('text', { name: 'source_path', nullable: true })
  sourcePath!: string | null;

  @Column('text', { name: 'error_code' })
  errorCode!: string;

  @Column('text')
  message!: string;

  @Column('jsonb', { nullable: true })
  details!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => SnapshotImportRun, (run) => run.errors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'import_run_id' })
  importRun!: SnapshotImportRun;
}
