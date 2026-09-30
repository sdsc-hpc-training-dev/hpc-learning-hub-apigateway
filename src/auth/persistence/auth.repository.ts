import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
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
}
