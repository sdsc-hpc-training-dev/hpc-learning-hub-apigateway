import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ContentChunk } from './content-chunk.entity';

@Entity({ name: 'chunk_embeddings' })
@Unique('UQ_chunk_embeddings_model', [
  'chunkId',
  'embeddingModel',
  'embeddingVersion',
])
@Index('IDX_chunk_embeddings_chunk_id', ['chunkId'])
@Check('CHK_chunk_embeddings_dimensions_positive', '"dimensions" > 0')
@Check(
  'CHK_chunk_embeddings_vector_dimensions',
  'vector_dims("embedding") = "dimensions"',
)
export class ChunkEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { name: 'chunk_id' })
  chunkId!: string;

  @Column('text', { name: 'embedding_model' })
  embeddingModel!: string;

  @Column('text', { name: 'embedding_version' })
  embeddingVersion!: string;

  @Column('integer')
  dimensions!: number;

  @Column('text', { name: 'content_hash' })
  contentHash!: string;

  @Column('vector')
  embedding!: number[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => ContentChunk, (chunk) => chunk.embeddings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chunk_id' })
  chunk!: ContentChunk;
}
