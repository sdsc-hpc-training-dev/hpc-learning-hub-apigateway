import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum AuthChallengePurpose {
  LOGIN = 'LOGIN',
}

@Entity({ name: 'auth_challenges' })
@Index('IDX_auth_challenges_user_purpose', ['userId', 'purpose', 'expiresAt'])
export class AuthChallenge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('enum', {
    enum: AuthChallengePurpose,
    enumName: 'auth_challenge_purpose_enum',
  })
  purpose!: AuthChallengePurpose;

  @Column('text', { name: 'code_hash' })
  codeHash!: string;

  @Column('integer', { default: 0 })
  attempts!: number;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamptz', { name: 'consumed_at', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.challenges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
