import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  AuthenticatedRequest,
  CurrentUserIdentity,
} from '../decorators/current-user.decorator';
import { AuthenticationRepository } from '../persistence/auth.repository';
import { sessionCookieName } from '../session-cookie';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: AuthenticationRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.sessionToken(request.headers.cookie);

    if (!token) throw new UnauthorizedException();

    const tokenHash = createHash('sha256').update(token).digest('base64url');
    const session = await this.sessions.findActiveSessionByTokenHash(tokenHash);

    if (!session) throw new UnauthorizedException();

    request.currentUser = {
      id: session.userId,
      role: session.user.role,
    } satisfies CurrentUserIdentity;
    request.sessionId = session.id;
    return true;
  }

  private sessionToken(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;
    const cookieName = sessionCookieName();

    const cookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`));

    return cookie ? cookie.slice(cookieName.length + 1) : null;
  }
}
