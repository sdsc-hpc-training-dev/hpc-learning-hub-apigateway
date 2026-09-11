import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { CatalogSnapshot } from './catalog-snapshot.entity';
import {
  ContentResource,
  EventEdition,
  TrainingMaterial,
} from './catalog.entity';
import { ChunkEmbedding } from './chunk-embedding.entity';
import { ChunkSourceKind } from './persistence.enums';

@Entity({ name: 'content_chunks' })
@Index('IDX_content_chunks_snapshot_id', ['snapshotId'])
@Index('IDX_content_chunks_material_id', ['materialId'])
@Index('IDX_content_chunks_content_resource_id', ['contentResourceId'])
@Index('IDX_content_chunks_event_edition_id', ['eventEditionId'])
@Index('IDX_content_chunks_source_kind', ['sourceKind'])
@Index('IDX_content_chunks_search', { synchronize: false })
@Index('IDX_content_chunks_resource_position', [
  'contentResourceId',
  'chunkIndex',
  'chunkingVersion',
])
@Check('CHK_content_chunks_word_offsets', '"word_start" <= "word_end"')
@Check(
  'CHK_content_chunks_word_positions',
  '"word_start" >= 0 AND "word_end" >= 0',
)
@Check('CHK_content_chunks_chunk_index', '"chunk_index" >= 0')
export class ContentChunk {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'snapshot_id' })
  snapshotId!: string;

  @Column('text', { name: 'material_id' })
  materialId!: string;

  @Column('text', { name: 'content_resource_id' })
  contentResourceId!: string;

  @Column('text', { name: 'event_edition_id', nullable: true })
  eventEditionId!: string | null;

  @Column('enum', {
    name: 'source_kind',
    enum: ChunkSourceKind,
    enumName: 'chunk_source_kind_enum',
  })
  sourceKind!: ChunkSourceKind;

  @Column('integer', { name: 'chunk_index' })
  chunkIndex!: number;

  @Column('text', { nullable: true })
  section!: string | null;

  @Column('text')
  text!: string;

  @Column('integer', { name: 'word_start' })
  wordStart!: number;

  @Column('integer', { name: 'word_end' })
  wordEnd!: number;

  @Column('text', { name: 'text_hash' })
  textHash!: string;

  @Column('text', { name: 'source_hash', nullable: true })
  sourceHash!: string | null;

  @Column('text', { name: 'source_entity_id' })
  sourceEntityId!: string;

  @Column('text', { name: 'source_location' })
  sourceLocation!: string;

  @Column('jsonb')
  provenance!: Record<string, unknown>;

  @Column('text', { name: 'chunking_version' })
  chunkingVersion!: string;

  @Column('text')
  language!: string;

  @ManyToOne(() => CatalogSnapshot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'snapshot_id' })
  snapshot!: CatalogSnapshot;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;

  @ManyToOne(() => ContentResource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_resource_id' })
  contentResource!: ContentResource;

  @ManyToOne(() => EventEdition, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_edition_id' })
  eventEdition!: EventEdition | null;

  @OneToMany(() => ChunkEmbedding, (embedding) => embedding.chunk)
  embeddings!: ChunkEmbedding[];
}
