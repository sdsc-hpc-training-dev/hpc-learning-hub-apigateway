import { PasswordService } from '../../auth/password.service';
import dataSource from '../data-source';
import { User, UserRole } from '../entities/user.entity';

function requiredEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function seedAdmin(): Promise<void> {
  const email = requiredEnv('ADMIN_EMAIL', process.env.ADMIN_EMAIL)
    .trim()
    .toLowerCase();
  const username = requiredEnv('ADMIN_USERNAME', process.env.ADMIN_USERNAME)
    .trim()
    .toLowerCase();
  const password = requiredEnv('ADMIN_PASS', process.env.ADMIN_PASS);

  if (password.length < 15 || password.length > 128) {
    throw new Error('ADMIN_PASS must contain 15–128 characters');
  }

  const passwordHash = await new PasswordService().hash(password);
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      await userRepository.upsert(
        {
          email,
          username,
          passwordHash,
          role: UserRole.ADMIN,
        },
        ['email'],
      );
    });
  } finally {
    await dataSource.destroy();
  }
}

void seedAdmin().catch((error: unknown) => {
  console.error('Failed to seed admin account.', error);
  process.exitCode = 1;
});
