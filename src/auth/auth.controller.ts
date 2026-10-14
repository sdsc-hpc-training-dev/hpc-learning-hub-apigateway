import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { sessionCookieClearOptions, sessionCookieName } from './session-cookie';
import { SessionAuthGuard } from './guards/session-auth.guard';
import type { AuthenticatedRequest } from './decorators/current-user.decorator';
import {
  oidcLoginCookieName,
  oidcLoginCookieOptions,
} from './oidc-login-cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('cilogon/login')
  async startCilogonLogin(@Res() response: Response): Promise<void> {
    const result = await this.authService.startCilogonLogin();
    response.cookie(
      oidcLoginCookieName(),
      result.browserBinding,
      oidcLoginCookieOptions(result.expiresAt),
    );
    response.redirect(HttpStatus.FOUND, result.authorizationUrl);
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutUser(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (!request.sessionId) throw new UnauthorizedException();
    await this.authService.logoutUser(request.sessionId);
    response.clearCookie(sessionCookieName(), sessionCookieClearOptions());
  }
}
