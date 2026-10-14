import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { VerifyLoginDto } from './dto/verify-login.dto';
import type { Request, Response } from 'express';
import {
  sessionCookieClearOptions,
  sessionCookieName,
  sessionCookieOptions,
} from './session-cookie';
import { SessionAuthGuard } from './guards/session-auth.guard';
import type { AuthenticatedRequest } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.ACCEPTED)
  loginUser(@Body() input: LoginDto): Promise<LoginResponseDto> {
    return this.authService.loginUser(input);
  }

  @Post('verify-login')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyLogin(
    @Body() input: VerifyLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const session = await this.authService.verifyLogin(
      input,
      request.ip ?? null,
      request.get('user-agent') ?? null,
    );
    response.cookie(
      sessionCookieName(),
      session.token,
      sessionCookieOptions(session.expiresAt),
    );
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutUser(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.sessionId) {
      await this.authService.logoutUser(req.sessionId);
      res.clearCookie(sessionCookieName(), sessionCookieClearOptions());
    }
    return Promise.resolve();
  }
  // archive session and revoke cookie
}
