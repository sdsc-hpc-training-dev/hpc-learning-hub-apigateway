import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserIdentity } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('users')
  registerUser(@Body() userInfo: RegisterUserDto): Promise<UserResponseDto> {
    return this.usersService.registerUser(userInfo);
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  findUser(@CurrentUser() user: CurrentUserIdentity): Promise<UserResponseDto> {
    return this.usersService.findUserById(user.id);
  }
}
