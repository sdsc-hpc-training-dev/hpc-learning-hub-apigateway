import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AuthIdentity } from './auth-identity.entity';
import { AuthSession } from './auth-session.entity';
import { PersonalLearningPath } from './personal-learning-path.entity';
import { Bookmark } from './bookmark.entity';

export enum UserRole {
  LEARNER = 'LEARNER',
  MAINTAINER = 'MAINTAINER',
  ADMIN = 'ADMIN',
}

@Entity({ name: 'users' })
@Unique('UQ_users_email', ['email'])
@Unique('UQ_users_username', ['username'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { nullable: true })
  email!: string | null;

  @Column('text')
  username!: string;

  @Column('text', { name: 'display_name', nullable: true })
  displayName!: string | null;

  @Column('timestamptz', { name: 'last_login_at', nullable: true })
  lastLoginAt!: Date | null;

  @Column('enum', {
    enum: UserRole,
    enumName: 'user_role_enum',
    default: UserRole.LEARNER,
  })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => AuthSession, (session) => session.user)
  sessions!: AuthSession[];

  @OneToOne(() => AuthIdentity, (identity) => identity.user)
  authIdentity!: AuthIdentity | null;

  @OneToMany(() => PersonalLearningPath, (path) => path.owner)
  personalLearningPaths!: PersonalLearningPath[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks!: Bookmark[];
}
