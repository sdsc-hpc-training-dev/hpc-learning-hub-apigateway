import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthenticationEmailService } from './authentication-email.service';
import { AuthenticationRepository } from './persistence/auth.repository';
import { PasswordService } from './password.service';
import { VerifyLoginDto } from './dto/verify-login.dto';
const loginChallengeLifetimeMs = 10 * 60 * 1000;
const authSessionLifetimeMs = 24 * 60 * 60 * 1000;

export interface VerifiedSession {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthenticationRepository,
    private readonly passwords: PasswordService,
    private readonly email: AuthenticationEmailService,
  ) {}

  async loginUser(input: LoginDto): Promise<LoginResponseDto> {
    const identity = input.emailOrUsername.trim().toLowerCase();
    const user = await this.repository.findUserByNameOrEmail(identity);
    if (
      !user ||
      !(await this.passwords.verify(input.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const code = randomInt(100_000, 1_000_000).toString();
    const expiresAt = new Date(Date.now() + loginChallengeLifetimeMs);
    const challenge = await this.repository.createLoginChallenge({
      userId: user.id,
      codeHash: this.hashChallengeCode(code),
      expiresAt,
    });
    await this.email.sendLoginCode(user.email, code, expiresAt);

    return { challengeId: challenge.id, expiresAt: challenge.expiresAt };
  }

  async verifyLogin(
    input: VerifyLoginDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<VerifiedSession> {
    const session = await this.repository.withTransaction(async (manager) => {
      const challenge = await this.repository.findActiveLoginChallenge(
        input.challengeId,
        manager,
      );
      if (!challenge) return null;

      const expected = Buffer.from(challenge.codeHash, 'base64url');
      const submitted = Buffer.from(
        this.hashChallengeCode(input.code),
        'base64url',
      );
      if (
        expected.length !== submitted.length ||
        !timingSafeEqual(expected, submitted)
      ) {
        const incremented = await this.repository.incrementChallengeAttempts(
          challenge.id,
          manager,
        );
        if (!incremented) {
          throw new UnauthorizedException(
            'Invalid or expired verification code',
          );
        }
        return null;
      }

      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + authSessionLifetimeMs);
      if (!(await this.repository.consumeChallenge(challenge.id, manager))) {
        throw new UnauthorizedException('Invalid or expired verification code');
      }
      await this.repository.createSession(
        {
          userId: challenge.userId,
          tokenHash: this.hashChallengeCode(token),
          expiresAt,
          ipAddress,
          userAgent,
        },
        manager,
      );
      return { token, expiresAt };
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }
    return session;
  }

  async logoutUser(sessionId: string): Promise<void> {
    this.repository.revokeSession(sessionId);
  }

  private hashChallengeCode(code: string): string {
    return createHash('sha256').update(code).digest('base64url');
  }
}
