import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { UserRole } from '../../database/entities/user.entity';
import { AuthenticationRepository } from '../persistence/auth.repository';
import { SessionAuthGuard } from './session-auth.guard';
import { sessionCookieName } from '../session-cookie';

describe('SessionAuthGuard', () => {
  const findActiveSessionByTokenHash = jest.fn();
  const sessions = {
    findActiveSessionByTokenHash,
  } as unknown as jest.Mocked<AuthenticationRepository>;
  const guard = new SessionAuthGuard(sessions);

  beforeEach(() => jest.clearAllMocks());

  it('loads an active session from the hashed cookie token', async () => {
    const request = {
      headers: { cookie: `${sessionCookieName()}=plain-session-token` },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    };
    sessions.findActiveSessionByTokenHash.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      user: { role: UserRole.LEARNER },
    } as never);

    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(findActiveSessionByTokenHash).toHaveBeenCalledWith(
      createHash('sha256').update('plain-session-token').digest('base64url'),
    );
    expect(request).toMatchObject({
      currentUser: { id: 'user-id', role: UserRole.LEARNER },
      sessionId: 'session-id',
    });
  });

  it('rejects a request without the session cookie', async () => {
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
    };

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(findActiveSessionByTokenHash).not.toHaveBeenCalled();
  });

  it('rejects an unknown, revoked, or expired token', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { cookie: `${sessionCookieName()}=invalid-token` },
        }),
      }),
    };
    sessions.findActiveSessionByTokenHash.mockResolvedValue(null);

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
