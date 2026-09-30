import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PasswordService } from '../auth/password.service';
import { User } from '../database/entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './persistence/user.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly passwords: PasswordService,
  ) {}

  async registerUser(registerInfo: RegisterUserDto): Promise<UserResponseDto> {
    const email = registerInfo.email.trim().toLowerCase();
    const username = registerInfo.username.trim().toLowerCase();
    const existing = await this.repository.findByEmailOrUsername(
      email,
      username,
    );

    if (existing) {
      throw new ConflictException('Email or username is already in use');
    }

    const passwordHash = await this.passwords.hash(registerInfo.password);
    const user = await this.repository.createUser({
      email,
      username,
      passwordHash,
    });

    return this.toResponse(user);
  }

  async findUserById(id: string): Promise<UserResponseDto> {
    const user = await this.repository.findUserById(id);

    if (!user) throw new NotFoundException('User not found');

    return this.toResponse(user);
  }

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }
}
