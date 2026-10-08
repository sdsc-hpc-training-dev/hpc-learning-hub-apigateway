import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { TrainingMaterial } from './catalog.entity';

@Entity({ name: 'bookmarks' })
@Index('IDX_bookmarks_user_created', ['userId', 'createdAt'])
@Unique('UQ_bookmarks_user_material', ['userId', 'materialId'])
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.bookmarks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column('text', { name: 'material_id' })
  materialId!: string;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
