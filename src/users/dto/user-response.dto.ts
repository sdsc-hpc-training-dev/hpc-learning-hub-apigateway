import { UserRole } from '../../database/entities/user.entity';

export class UserResponseDto {
  id!: string;
  email!: string | null;
  username!: string;
  role!: UserRole;
}
