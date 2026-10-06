import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, IsNull, LessThan, MoreThan } from 'typeorm';
import {
  AuthChallenge,
  AuthChallengePurpose,
} from '../../database/entities/auth-challenge.entity';
import { AuthSession } from '../../database/entities/auth-session.entity';
import { User } from '../../database/entities/user.entity';

export const maximumLoginChallengeAttempts = 5;

function activeLoginChallenge(challengeId: string) {
  return {
    id: challengeId,
    purpose: AuthChallengePurpose.LOGIN,
    consumedAt: IsNull(),
    expiresAt: MoreThan(new Date()),
    attempts: LessThan(maximumLoginChallengeAttempts),
  };
}

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

  findUserByNameOrEmail(emailOrUsername: string): Promise<User | null> {
    return this.dataSource.getRepository(User).findOne({
      where: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
  }

  createLoginChallenge(input: {
    userId: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<AuthChallenge> {
    const challenges = this.dataSource.getRepository(AuthChallenge);

    return challenges.save(
      challenges.create({
        ...input,
        purpose: AuthChallengePurpose.LOGIN,
      }),
    );
  }

  withTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(work);
  }

  findActiveLoginChallenge(
    challengeId: string,
    manager?: EntityManager,
  ): Promise<AuthChallenge | null> {
    const repository = (manager ?? this.dataSource).getRepository(
      AuthChallenge,
    );
    return repository.findOne({
      where: activeLoginChallenge(challengeId),
      ...(manager ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
  }

  async incrementChallengeAttempts(
    challengeId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await (manager ?? this.dataSource)
      .getRepository(AuthChallenge)
      .increment(activeLoginChallenge(challengeId), 'attempts', 1);
    return result.affected === 1;
  }

  async consumeChallenge(
    challengeId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await (manager ?? this.dataSource)
      .getRepository(AuthChallenge)
      .update(activeLoginChallenge(challengeId), { consumedAt: new Date() });

    return result.affected === 1;
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

  revokeSession(sessionId: string): Promise<void> {
    this.dataSource.getRepository(AuthSession).update(
      {id: sessionId},
      {revokedAt: new Date()}
    );

    return Promise.resolve();
  }
}
