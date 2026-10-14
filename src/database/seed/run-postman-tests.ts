import { spawn } from 'child_process';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { In } from 'typeorm';
import { PasswordService } from '../../auth/password.service';
import { sessionCookieName } from '../../auth/session-cookie';
import dataSource from '../data-source';
import { AuthSession } from '../entities/auth-session.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { TrainingMaterial } from '../entities/catalog.entity';
import { SnapshotStatus } from '../entities/persistence.enums';
import { User, UserRole } from '../entities/user.entity';

async function createFixtures(
  userIds: string[],
): Promise<Record<string, string>> {
  const materials = await dataSource.getRepository(TrainingMaterial).find({
    where: { snapshot: { status: SnapshotStatus.ACTIVE } },
    select: { id: true },
    order: { id: 'ASC' },
    take: 2,
  });
  const [first, second] = materials;
  if (!first || !second) {
    throw new Error(
      'Postman tests require at least two active catalog materials',
    );
  }
  const sessions = userIds.map((id) => ({
    id,
    token: randomBytes(32).toString('base64url'),
  }));
  const [owner, other, admin] = sessions;
  if (!owner || !other || !admin)
    throw new Error('Three test users are required');
  const passwordHash = await new PasswordService().hash(
    randomBytes(32).toString('base64url'),
  );
  await dataSource.transaction(async (manager) => {
    for (const { id, token } of sessions) {
      await manager.getRepository(User).insert({
        id,
        email: `postman-${id}@example.invalid`,
        username: `postman_${id.replaceAll('-', '')}`,
        passwordHash,
        role: id === admin.id ? UserRole.ADMIN : UserRole.LEARNER,
      });
      await manager.getRepository(AuthSession).insert({
        userId: id,
        tokenHash: createHash('sha256').update(token).digest('base64url'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        revokedAt: null,
      });
    }
    await manager.getRepository(Bookmark).insert([
      { userId: owner.id, materialId: first.id },
      { userId: owner.id, materialId: second.id },
    ]);
  });
  return {
    baseURL: process.env.POSTMAN_BASE_URL ?? 'http://localhost:3000/api/v1',
    personalPathCookieName: sessionCookieName(),
    personalPathOwnerToken: owner.token,
    personalPathOtherToken: other.token,
    personalPathOwnerId: owner.id,
    personalPathOtherId: other.id,
    adminUserToken: admin.token,
    personalMaterialA: first.id,
    personalMaterialB: second.id,
    personalMissingPathId: randomUUID(),
    personalMissingMaterialId: `postman-missing-${randomUUID()}`,
  };
}

function runNewman(environmentPath: string): Promise<void> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(
      process.execPath,
      [
        resolve('node_modules/newman/bin/newman.js'),
        'run',
        'postman/local-testing.postman_collection.json',
        '--environment',
        environmentPath,
        ...process.argv.slice(2),
      ],
      { stdio: 'inherit' },
    );
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun();
      else reject(new Error(`Newman failed (${signal ?? code})`));
    });
  });
}

async function cleanupFixtures(
  userIds: string[],
  seeded: boolean,
): Promise<void> {
  if (!dataSource.isInitialized) return;
  try {
    if (seeded)
      await dataSource.getRepository(User).delete({ id: In(userIds) });
  } finally {
    await dataSource.destroy();
  }
}

async function main(): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'learning-hub-postman-'));
  const userIds = [randomUUID(), randomUUID(), randomUUID()];
  let seeded = false;
  try {
    await dataSource.initialize();
    const variables = await createFixtures(userIds);
    seeded = true;
    const environmentPath = join(directory, 'environment.json');
    // This path is inside the private directory created by mkdtemp above.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await writeFile(
      environmentPath,
      JSON.stringify({
        name: 'Temporary API test fixtures',
        values: Object.entries(variables).map(([key, value]) => ({
          key,
          value,
          enabled: true,
        })),
      }),
      { mode: 0o600 },
    );
    await runNewman(environmentPath);
  } finally {
    try {
      await cleanupFixtures(userIds, seeded);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

void main().catch((error: unknown) => {
  console.error('Postman API tests failed.', error);
  process.exitCode = 1;
});
