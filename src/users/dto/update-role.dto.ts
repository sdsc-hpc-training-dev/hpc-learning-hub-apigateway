import { IsEnum } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
