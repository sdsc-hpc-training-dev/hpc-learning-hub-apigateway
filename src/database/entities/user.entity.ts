import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AuthChallenge } from './auth-challenge.entity';
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

  @Column('text')
  email!: string;

  @Column('text')
  username!: string;

  @Column('text', { name: 'password_hash' })
  passwordHash!: string;

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

  @OneToMany(() => AuthChallenge, (challenge) => challenge.user)
  challenges!: AuthChallenge[];

  @OneToMany(() => PersonalLearningPath, (path) => path.owner)
  personalLearningPaths!: PersonalLearningPath[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks!: Bookmark[];
}
