import { Injectable } from '@nestjs/common';
import { AuthenticationRepository } from './persistence/auth.repository';

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthenticationRepository) {}

  async logoutUser(sessionId: string): Promise<void> {
    await this.repository.revokeSession(sessionId);
  }
}
