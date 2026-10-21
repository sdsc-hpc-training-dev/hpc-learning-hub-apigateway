import { isUUID } from 'class-validator';
import dataSource from '../data-source';
import { AuthIdentity } from '../entities/auth-identity.entity';
import { User, UserRole } from '../entities/user.entity';

async function seedAdmin(): Promise<void> {
  const userId = process.env.ADMIN_USER_ID?.trim();
  if (!userId || !isUUID(userId)) {
    throw new Error(
      'ADMIN_USER_ID must be the UUID of an existing CILogon user',
    );
  }
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      const identity = await manager.getRepository(AuthIdentity).findOne({
        where: { userId },
        select: { id: true },
      });
      if (!identity)
        throw new Error(
          'ADMIN_USER_ID must reference an existing CILogon account',
        );
      await manager
        .getRepository(User)
        .update({ id: userId }, { role: UserRole.ADMIN });
    });
  } finally {
    await dataSource.destroy();
  }
}

void seedAdmin().catch((error: unknown) => {
  console.error('Failed to promote admin account.', error);
  process.exitCode = 1;
});
