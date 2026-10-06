import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  AuthChallenge,
  AuthChallengePurpose,
} from '../../database/entities/auth-challenge.entity';
import { AuthSession } from '../../database/entities/auth-session.entity';
import { User } from '../../database/entities/user.entity';

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
}
