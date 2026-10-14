import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UserRole } from '../../database/entities/user.entity';
import { UpdateUserRoleDto } from './update-role.dto';

const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
const metadata = { type: 'body' as const, metatype: UpdateUserRoleDto };

it.each(Object.values(UserRole))('accepts role %s', async (role) => {
  await expect(pipe.transform({ role }, metadata)).resolves.toMatchObject({
    role,
  });
});

it.each([
  {},
  { role: null },
  { role: 'admin' },
  { role: 'OWNER' },
  { role: 0 },
  { role: UserRole.ADMIN, userId: 'forged' },
])('rejects invalid role input: %j', async (input) => {
  await expect(pipe.transform(input, metadata)).rejects.toBeInstanceOf(
    BadRequestException,
  );
});
