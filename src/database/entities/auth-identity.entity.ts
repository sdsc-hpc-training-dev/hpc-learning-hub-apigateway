import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'auth_identities' })
@Unique('UQ_auth_identities_issuer_subject', ['issuer', 'subject'])
export class AuthIdentity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @OneToOne(() => User, (user) => user.authIdentity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column('text')
  issuer!: string;

  @Column('text')
  subject!: string;

  @Column('text', { name: 'identity_provider', nullable: true })
  identityProvider!: string | null;

  @Column('text', { nullable: true })
  institution!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
