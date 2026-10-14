import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { TrainingMaterial } from './catalog.entity';

@Entity({ name: 'curated_learning_paths' })
@Index('IDX_curated_learning_paths_public_order', [
  'isPublished',
  'title',
  'id',
])
export class CuratedLearningPath {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  title!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('text', { nullable: true })
  audience!: string | null;

  @Column('text', { nullable: true })
  prerequisites!: string | null;

  @Column('text', { name: 'estimated_scope', nullable: true })
  estimatedScope!: string | null;

  @Column('boolean', { name: 'is_published', default: false })
  isPublished!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => CuratedPathItem, (item) => item.path)
  items!: CuratedPathItem[];
}

@Entity({ name: 'curated_path_items' })
@Unique('UQ_curated_path_items_position', ['pathId', 'position'])
@Index('IDX_curated_path_items_material_id', ['materialId'])
@Check('CHK_curated_path_items_position', '"position" >= 0')
export class CuratedPathItem {
  @PrimaryColumn('uuid', { name: 'path_id' })
  pathId!: string;

  @PrimaryColumn('text', { name: 'material_id' })
  materialId!: string;

  @Column('integer')
  position!: number;

  @ManyToOne(() => CuratedLearningPath, (path) => path.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'path_id' })
  path!: CuratedLearningPath;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;
}
