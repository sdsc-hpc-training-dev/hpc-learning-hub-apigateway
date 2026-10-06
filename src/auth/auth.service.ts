import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthenticationEmailService } from './authentication-email.service';
import { AuthenticationRepository } from './persistence/auth.repository';
import { PasswordService } from './password.service';

const loginChallengeLifetimeMs = 10 * 60 * 1000;

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

  private hashChallengeCode(code: string): string {
    return createHash('sha256').update(code).digest('base64url');
  }
}
