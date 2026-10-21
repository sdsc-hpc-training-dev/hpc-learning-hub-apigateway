import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { AuthenticationRepository } from './persistence/auth.repository';
import { CilogonClientService } from './cilogon.service';

const loginTransactionLifetimeMs = 10 * 60 * 1000;

interface StartedCilogonLogin {
  authorizationUrl: string;
  browserBinding: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthenticationRepository,
    private readonly cilogon: CilogonClientService,
    private readonly settings: ConfigService,
  ) {}

  async startCilogonLogin(): Promise<StartedCilogonLogin> {
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    const pkceVerifier = randomBytes(32).toString('base64url');
    const browserBinding = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + loginTransactionLifetimeMs);
    const authorizationUrl = await this.cilogon.buildLoginUrl({
      state,
      nonce,
      pkceVerifier,
    });

    await this.repository.createLoginTransaction({
      stateHash: this.hash(state),
      nonce,
      pkceVerifier,
      browserBindingHash: this.hash(browserBinding),
      returnTo: null,
      expiresAt,
    });

    return {
      authorizationUrl: authorizationUrl.href,
      browserBinding,
      expiresAt,
    };
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('base64url');
  }

  async completeCilogonLogin(
    originalUrl: string,
    browserBinding: string | undefined,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ token: string; expiresAt: Date; redirectUrl: string }> {
    const { callbackUrl, redirectUrl } = this.callbackUrls(originalUrl);
    const states = callbackUrl.searchParams.getAll('state');
    if (
      states.length !== 1 ||
      !/^[\w-]{43}$/.test(states[0]!) ||
      !browserBinding ||
      !/^[\w-]{43}$/.test(browserBinding)
    ) {
      throw new UnauthorizedException('Invalid login attempt');
    }
    const state = states[0]!;
    const attempt = await this.repository.consumeLoginTransaction(
      this.hash(state),
      this.hash(browserBinding),
    );
    if (!attempt)
      throw new UnauthorizedException('Invalid or expired login attempt');
    const codes = callbackUrl.searchParams.getAll('code');
    if (
      callbackUrl.searchParams.has('error') ||
      codes.length !== 1 ||
      !codes[0]?.trim()
    ) {
      throw new UnauthorizedException('CILogon sign-in was denied or invalid');
    }
    const profile = await this.exchangeProfile(callbackUrl, state, attempt);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.repository.establishCilogonSession({
      ...profile,
      tokenHash: this.hash(token),
      expiresAt,
      ipAddress,
      userAgent,
    });
    return { token, expiresAt, redirectUrl };
  }

  private callbackUrls(originalUrl: string): {
    callbackUrl: URL;
    redirectUrl: string;
  } {
    try {
      const callbackUrl = new URL(
        this.settings.getOrThrow<string>('CILOGON_REDIRECT_URI'),
      );
      const frontend = new URL(
        this.settings.getOrThrow<string>('FRONTEND_URL'),
      );
      for (const url of [callbackUrl, frontend]) {
        if (
          !['http:', 'https:'].includes(url.protocol) ||
          url.username ||
          url.password
        ) {
          throw new Error('Invalid configured URL');
        }
      }
      const incoming = new URL(originalUrl, callbackUrl.origin);
      if (
        incoming.origin !== callbackUrl.origin ||
        incoming.pathname !== callbackUrl.pathname
      ) {
        throw new Error('Callback URL does not match configuration');
      }
      callbackUrl.search = incoming.search;
      return { callbackUrl, redirectUrl: frontend.href };
    } catch {
      throw new ServiceUnavailableException(
        'CILogon URL configuration is unavailable',
      );
    }
  }

  private async exchangeProfile(
    callbackUrl: URL,
    state: string,
    attempt: { nonce: string; pkceVerifier: string },
  ): Promise<{
    issuer: string;
    subject: string;
    email: string | null;
    displayName: string | null;
    identityProvider: string | null;
  }> {
    try {
      const claims = await this.cilogon.exchangeCode(callbackUrl, {
        state,
        nonce: attempt.nonce,
        pkceVerifier: attempt.pkceVerifier,
      });
      if (
        claims.iss !== 'https://cilogon.org' ||
        typeof claims.sub !== 'string' ||
        !claims.sub.trim()
      ) {
        throw new Error('Invalid identity');
      }
      return {
        issuer: claims.iss,
        subject: claims.sub,
        email: this.profileString(claims.email)?.toLowerCase() ?? null,
        displayName: this.profileString(claims.name),
        identityProvider: this.profileString(claims.idp),
      };
    } catch {
      throw new UnauthorizedException('CILogon authentication failed');
    }
  }

  private profileString(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') throw new Error('Invalid profile attribute');
    return value.trim() || null;
  }

  async logoutUser(sessionId: string): Promise<void> {
    await this.repository.revokeSession(sessionId);
  }
}
