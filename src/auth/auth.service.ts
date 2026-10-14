import { Injectable } from '@nestjs/common';
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

  async logoutUser(sessionId: string): Promise<void> {
    await this.repository.revokeSession(sessionId);
  }
}
