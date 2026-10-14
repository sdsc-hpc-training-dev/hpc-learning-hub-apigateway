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

@Entity({ name: 'auth_sessions' })
@Index('IDX_auth_sessions_active_user', ['userId', 'expiresAt'])
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('text', { name: 'token_hash', unique: true })
  tokenHash!: string;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamptz', { name: 'last_seen_at', nullable: true })
  lastSeenAt!: Date | null;

  @Column('timestamptz', { name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  @Column('inet', { name: 'ip_address', nullable: true })
  ipAddress!: string | null;

  @Column('text', { name: 'user_agent', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
