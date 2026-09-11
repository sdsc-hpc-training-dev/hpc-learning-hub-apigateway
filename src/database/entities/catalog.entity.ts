import {
  Column,
  Check,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { CatalogSnapshot } from './catalog-snapshot.entity';
import { ResourceType } from './persistence.enums';

abstract class SnapshotCatalogEntity {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'snapshot_id' })
  snapshotId!: string;

  @ManyToOne(() => CatalogSnapshot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'snapshot_id' })
  snapshot!: CatalogSnapshot;
}

@Entity({ name: 'event_series' })
@Index('IDX_event_series_snapshot_id', ['snapshotId'])
export class EventSeries extends SnapshotCatalogEntity {
  @Column('text')
  name!: string;

  @Column('text', { name: 'review_status', nullable: true })
  reviewStatus!: string | null;

  @Column('text', { nullable: true })
  source!: string | null;
}

@Entity({ name: 'event_editions' })
@Index('IDX_event_editions_snapshot_id', ['snapshotId'])
@Index('IDX_event_editions_start_at', ['startAt'])
@Index('IDX_event_editions_search', { synchronize: false })
export class EventEdition extends SnapshotCatalogEntity {
  @Column('text')
  title!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('timestamptz', { name: 'start_at', nullable: true })
  startAt!: Date | null;

  @Column('timestamptz', { name: 'end_at', nullable: true })
  endAt!: Date | null;

  @Column('text', { nullable: true })
  format!: string | null;

  @Column('text', { nullable: true })
  location!: string | null;

  @Column('text', { name: 'source_event_id', nullable: true })
  sourceEventId!: string | null;

  @Column('text', { name: 'source_date_text', nullable: true })
  sourceDateText!: string | null;

  @Column('text', { name: 'source_time_text', nullable: true })
  sourceTimeText!: string | null;

  @Column('text', { name: 'source_file', nullable: true })
  sourceFile!: string | null;
}

@Entity({ name: 'training_materials' })
@Index('IDX_training_materials_snapshot_id', ['snapshotId'])
@Index('IDX_training_materials_search', { synchronize: false })
export class TrainingMaterial extends SnapshotCatalogEntity {
  @Column('text')
  title!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('text', { name: 'source_repository', nullable: true })
  sourceRepository!: string | null;

  @Column('text', { name: 'source_commit', nullable: true })
  sourceCommit!: string | null;

  @Column('text', { name: 'grouping_method', nullable: true })
  groupingMethod!: string | null;

  @Column('text', { name: 'grouping_note', nullable: true })
  groupingNote!: string | null;
}

@Entity({ name: 'content_resources' })
@Index('IDX_content_resources_snapshot_id', ['snapshotId'])
@Index('IDX_content_resources_type_status', ['resourceType', 'status'])
@Check(
  'CHK_content_resources_file_counts',
  '("source_file_count" IS NULL OR "source_file_count" >= 0) AND ("indexed_file_count" IS NULL OR "indexed_file_count" >= 0) AND ("excluded_file_count" IS NULL OR "excluded_file_count" >= 0)',
)
export class ContentResource extends SnapshotCatalogEntity {
  @Column('enum', {
    name: 'resource_type',
    enum: ResourceType,
    enumName: 'resource_type_enum',
  })
  resourceType!: ResourceType;

  @Column('text')
  title!: string;

  @Column('text', { name: 'canonical_url', nullable: true })
  canonicalUrl!: string | null;

  @Column('text', { name: 'original_url', nullable: true })
  originalUrl!: string | null;

  @Column('text', { nullable: true })
  source!: string | null;

  @Column('text', { name: 'source_document', nullable: true })
  sourceDocument!: string | null;

  @Column('text', { nullable: true })
  status!: string | null;

  @Column('text', { name: 'verification_status', nullable: true })
  verificationStatus!: string | null;

  @Column('text', { name: 'extraction_status', nullable: true })
  extractionStatus!: string | null;

  @Column('text', { name: 'content_hash', nullable: true })
  contentHash!: string | null;

  @Column('text', { name: 'session_key', nullable: true })
  sessionKey!: string | null;

  @Column('text', { name: 'text_selection_policy', nullable: true })
  textSelectionPolicy!: string | null;

  @Column('integer', { name: 'source_file_count', nullable: true })
  sourceFileCount!: number | null;

  @Column('integer', { name: 'indexed_file_count', nullable: true })
  indexedFileCount!: number | null;

  @Column('integer', { name: 'excluded_file_count', nullable: true })
  excludedFileCount!: number | null;

  @Column('jsonb', { name: 'excluded_by_reason', nullable: true })
  excludedByReason!: Record<string, unknown> | null;

  @Column('boolean', { name: 'requires_ocr', nullable: true })
  requiresOcr!: boolean | null;
}

@Entity({ name: 'people' })
@Index('IDX_people_snapshot_id', ['snapshotId'])
@Index('IDX_people_normalized_name', { synchronize: false })
export class Person extends SnapshotCatalogEntity {
  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  source!: string | null;
}

@Entity({ name: 'topics' })
@Index('IDX_topics_snapshot_id', ['snapshotId'])
@Index('IDX_topics_normalized_name', { synchronize: false })
export class Topic extends SnapshotCatalogEntity {
  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('text', { name: 'review_status', nullable: true })
  reviewStatus!: string | null;

  @Column('text', { nullable: true })
  source!: string | null;
}

@Entity({ name: 'tools' })
@Index('IDX_tools_snapshot_id', ['snapshotId'])
@Index('IDX_tools_normalized_name', { synchronize: false })
export class Tool extends SnapshotCatalogEntity {
  @Column('text')
  name!: string;

  @Column('text', { name: 'review_status', nullable: true })
  reviewStatus!: string | null;

  @Column('text', { nullable: true })
  source!: string | null;
}

@Entity({ name: 'systems' })
@Index('IDX_systems_snapshot_id', ['snapshotId'])
@Index('IDX_systems_normalized_name', { synchronize: false })
export class System extends SnapshotCatalogEntity {
  @Column('text')
  name!: string;

  @Column('text', { name: 'review_status', nullable: true })
  reviewStatus!: string | null;

  @Column('text', { nullable: true })
  source!: string | null;
}

@Entity({ name: 'content_resource_files' })
@Index('IDX_content_resource_files_resource_id', ['resourceId'])
@Check('CHK_content_resource_files_position', '"position" >= 0')
export class ContentResourceFile {
  @PrimaryColumn('text', { name: 'resource_id' })
  resourceId!: string;

  @PrimaryColumn('text')
  path!: string;

  @Column('text', { name: 'content_hash' })
  contentHash!: string;

  @Column('integer')
  position!: number;

  @ManyToOne(() => ContentResource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resource_id' })
  resource!: ContentResource;
}
