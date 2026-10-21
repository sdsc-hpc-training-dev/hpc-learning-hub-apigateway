import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { randomUUID } from 'crypto';
import { AuthSession } from '../../database/entities/auth-session.entity';
import { OidcLoginTransaction } from '../../database/entities/oidc-login-transaction.entity';
import { AuthIdentity } from '../../database/entities/auth-identity.entity';
import { User, UserRole } from '../../database/entities/user.entity';
@Injectable()
export class AuthenticationRepository {
  constructor(private readonly dataSource: DataSource) {}

  findActiveSessionByTokenHash(tokenHash: string): Promise<AuthSession | null> {
    return this.dataSource
      .getRepository(AuthSession)
      .createQueryBuilder('session')
      .innerJoinAndSelect('session.user', 'user')
      .where('session.tokenHash = :tokenHash', { tokenHash })
      .andWhere('session.revokedAt IS NULL')
      .andWhere('session.expiresAt > now()')
      .getOne();
  }

  withTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(work);
  }

  createSession(
    input: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      ipAddress: string | null;
      userAgent: string | null;
    },
    manager?: EntityManager,
  ): Promise<AuthSession> {
    const repository = (manager ?? this.dataSource).getRepository(AuthSession);
    return repository.save({
      ...input,
      revokedAt: null,
      lastSeenAt: new Date(),
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.dataSource
      .getRepository(AuthSession)
      .update({ id: sessionId }, { revokedAt: new Date() });
  }

  createLoginTransaction(
    input: Pick<
      OidcLoginTransaction,
      | 'stateHash'
      | 'nonce'
      | 'pkceVerifier'
      | 'browserBindingHash'
      | 'returnTo'
      | 'expiresAt'
    >,
  ): Promise<OidcLoginTransaction> {
    const repository = this.dataSource.getRepository(OidcLoginTransaction);
    return repository.save(repository.create({ ...input, consumedAt: null }));
  }

  consumeLoginTransaction(
    stateHash: string,
    browserBindingHash: string,
  ): Promise<OidcLoginTransaction | null> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OidcLoginTransaction);

      const attempt = await repository
        .createQueryBuilder('attempt')
        .addSelect('attempt.pkceVerifier')
        .where('attempt.stateHash = :stateHash', { stateHash })
        .andWhere('attempt.browserBindingHash = :browserBindingHash', {
          browserBindingHash,
        })
        .andWhere('attempt.consumedAt IS NULL')
        .andWhere('attempt.expiresAt > now()')
        .setLock('pessimistic_write')
        .getOne();

      if (!attempt) return null;

      const consumedAt = new Date();
      await repository.update(attempt.id, { consumedAt });
      attempt.consumedAt = consumedAt;

      return attempt;
    });
  }

  async establishCilogonSession(input: {
    issuer: string;
    subject: string;
    email: string | null;
    displayName: string | null;
    identityProvider: string | null;
    tokenHash: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void> {
    try {
      await this.dataSource.transaction('READ COMMITTED', async (manager) => {
        await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
          JSON.stringify([input.issuer, input.subject]),
        ]);
        const identities = manager.getRepository(AuthIdentity);
        const users = manager.getRepository(User);
        const identity = await identities.findOne({
          where: { issuer: input.issuer, subject: input.subject },
        });
        let userId = identity?.userId;
        const lastLoginAt = new Date();
        if (!userId) {
          userId = randomUUID();
          await users.save(
            users.create({
              id: userId,
              username: `user_${userId.replaceAll('-', '')}`,
              email: input.email,
              displayName: input.displayName,
              role: UserRole.LEARNER,
              lastLoginAt,
            }),
          );
          await identities.save(
            identities.create({
              userId,
              issuer: input.issuer,
              subject: input.subject,
              identityProvider: input.identityProvider,
              institution: null,
            }),
          );
        } else {
          const result = await users.update({ id: userId }, { lastLoginAt });
          if (result.affected !== 1)
            throw new UnauthorizedException('Account no longer exists');
        }
        await this.createSession(
          {
            userId,
            tokenHash: input.tokenHash,
            expiresAt: input.expiresAt,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
          },
          manager,
        );
      });
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505' &&
        (error.driverError as { constraint?: string }).constraint ===
          'UQ_users_email'
      ) {
        throw new ConflictException(
          'Email is associated with another account; contact an administrator',
        );
      }
      throw error;
    }
  }
}
