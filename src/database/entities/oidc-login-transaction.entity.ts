import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'oidc_login_transactions' })
@Unique('UQ_oidc_login_transactions_state_hash', ['stateHash'])
@Index('IDX_oidc_login_transactions_expires', ['expiresAt'])
export class OidcLoginTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { name: 'state_hash' })
  stateHash!: string;

  @Column('text')
  nonce!: string;

  @Column('text', { name: 'pkce_verifier', select: false })
  pkceVerifier!: string;

  @Column('text', { name: 'browser_binding_hash' })
  browserBindingHash!: string;

  @Column('text', { name: 'return_to', nullable: true })
  returnTo!: string | null;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamptz', { name: 'consumed_at', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
