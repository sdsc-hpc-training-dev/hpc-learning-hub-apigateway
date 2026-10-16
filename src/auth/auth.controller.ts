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
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  sessionCookieClearOptions,
  sessionCookieName,
  sessionCookieOptions,
} from './session-cookie';
import { SessionAuthGuard } from './guards/session-auth.guard';
import type { AuthenticatedRequest } from './decorators/current-user.decorator';
import {
  oidcLoginCookieName,
  oidcLoginCookieOptions,
  oidcLoginCookieClearOptions,
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

  @Get('cilogon/callback')
  async completeCilogonLogin(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const prefix = `${oidcLoginCookieName()}=`;
    const cookies =
      request.headers.cookie
        ?.split(';')
        .map((part) => part.trim())
        .filter((part) => part.startsWith(prefix)) ?? [];
    const browserBinding =
      cookies.length === 1 ? cookies[0]!.slice(prefix.length) : undefined;
    try {
      const result = await this.authService.completeCilogonLogin(
        request.originalUrl,
        browserBinding,
        request.ip ?? null,
        request.get('user-agent') ?? null,
      );
      response.cookie(
        sessionCookieName(),
        result.token,
        sessionCookieOptions(result.expiresAt),
      );
      response.clearCookie(
        oidcLoginCookieName(),
        oidcLoginCookieClearOptions(),
      );
      response.redirect(HttpStatus.FOUND, result.redirectUrl);
    } catch (error: unknown) {
      response.clearCookie(
        oidcLoginCookieName(),
        oidcLoginCookieClearOptions(),
      );
      throw error;
    }
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
