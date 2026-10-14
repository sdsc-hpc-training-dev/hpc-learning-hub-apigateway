import { DataSource } from 'typeorm';
import { AuthSession } from '../../database/entities/auth-session.entity';
import { AuthenticationRepository } from './auth.repository';

describe('AuthenticationRepository', () => {
  it('finds only a current, unrevoked session and includes its user', async () => {
    const getOne = jest.fn().mockResolvedValue({ id: 'session-id' });
    const query = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne,
    };
    const getRepository = jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(query),
    });
    const repository = new AuthenticationRepository({
      getRepository,
    } as unknown as DataSource);

    await expect(
      repository.findActiveSessionByTokenHash('hashed-token'),
    ).resolves.toEqual({
      id: 'session-id',
    });

    expect(getRepository).toHaveBeenCalledWith(AuthSession);
    expect(query.innerJoinAndSelect).toHaveBeenCalledWith(
      'session.user',
      'user',
    );
    expect(query.where).toHaveBeenCalledWith('session.tokenHash = :tokenHash', {
      tokenHash: 'hashed-token',
    });
    expect(query.andWhere).toHaveBeenNthCalledWith(
      1,
      'session.revokedAt IS NULL',
    );
    expect(query.andWhere).toHaveBeenNthCalledWith(
      2,
      'session.expiresAt > now()',
    );
  });
});
