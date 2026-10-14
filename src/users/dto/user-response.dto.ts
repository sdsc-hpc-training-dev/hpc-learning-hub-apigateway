import { UserRole } from '../../database/entities/user.entity';

export class UserResponseDto {
  id!: string;
  email!: string;
  username!: string;
  role!: UserRole;
}
