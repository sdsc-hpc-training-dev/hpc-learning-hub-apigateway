import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuthSession } from '../../database/entities/auth-session.entity';

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
}
