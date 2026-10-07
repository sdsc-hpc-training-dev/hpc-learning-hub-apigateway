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
import { User } from './user.entity';

@Entity({ name: 'personal_learning_paths' })
@Index('IDX_personal_learning_paths_owner_updated', [
  'ownerUserId',
  'updatedAt',
])
export class PersonalLearningPath {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'owner_user_id' })
  ownerUserId!: string;

  @Column('text')
  title!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.personalLearningPaths, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;

  @OneToMany(() => PersonalPathItem, (item) => item.path)
  items!: PersonalPathItem[];
}

@Entity({ name: 'personal_path_items' })
@Unique('UQ_personal_path_items_position', ['pathId', 'position'])
@Check('CHK_personal_path_items_position', '"position" >= 0')
export class PersonalPathItem {
  @PrimaryColumn('uuid', { name: 'path_id' })
  pathId!: string;

  @PrimaryColumn('text', { name: 'material_id' })
  materialId!: string;

  @Column('integer')
  position!: number;

  @ManyToOne(() => PersonalLearningPath, (path) => path.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'path_id' })
  path!: PersonalLearningPath;

  @ManyToOne(() => TrainingMaterial, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material_id' })
  material!: TrainingMaterial;
}
