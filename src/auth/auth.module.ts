import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthenticationRepository } from './persistence/auth.repository';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { CilogonClientService } from './cilogon.service';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    CilogonClientService,
    AuthenticationRepository,
    SessionAuthGuard,
    AdminAuthGuard,
  ],
  exports: [SessionAuthGuard, AuthenticationRepository, AdminAuthGuard],
})
export class AuthModule {}
