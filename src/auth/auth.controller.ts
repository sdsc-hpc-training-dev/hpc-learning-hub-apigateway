import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.ACCEPTED)
  loginUser(@Body() input: LoginDto): Promise<LoginResponseDto> {
    return this.authService.loginUser(input);
  }

  @Post('verify-login')
  verifyLogin() {
    return [];
  }
  //Check auth challenge ID and code, create session

  @Post('logout')
  logoutUser() {
    return [];
  }
  // archive session and revoke cookie
}
