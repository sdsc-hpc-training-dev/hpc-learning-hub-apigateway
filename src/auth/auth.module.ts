import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthenticationRepository } from './persistence/auth.repository';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthenticationRepository,
    SessionAuthGuard,
    AdminAuthGuard,
  ],
  exports: [SessionAuthGuard, AuthenticationRepository, AdminAuthGuard],
})
export class AuthModule {}
