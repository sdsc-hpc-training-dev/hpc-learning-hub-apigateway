import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthenticationRepository } from './persistence/auth.repository';
import { AuthenticationEmailService } from './authentication-email.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    AuthenticationRepository,
    AuthenticationEmailService,
    SessionAuthGuard,
  ],
  exports: [PasswordService, SessionAuthGuard, AuthenticationRepository],
})
export class AuthModule {}
