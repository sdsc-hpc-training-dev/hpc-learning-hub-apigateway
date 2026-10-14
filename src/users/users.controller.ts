import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserIdentity } from '../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-role.dto';

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

  @Get('users')
  @UseGuards(SessionAuthGuard, AdminAuthGuard)
  findAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.findAllUsers();
  }

  @Patch('users/:userId/role')
  @UseGuards(SessionAuthGuard, AdminAuthGuard)
  updateRole(
    @CurrentUser() adminUser: CurrentUserIdentity,
    @Body() userRoleInfo: UpdateUserRoleDto,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.updateRole(adminUser.id, userId, userRoleInfo);
  }
}
