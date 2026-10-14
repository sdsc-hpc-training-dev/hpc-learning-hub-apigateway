import type { QueryRunner } from 'typeorm';
import { CILogonUpdate1791955721334 } from './1791955721334-CILogon-Update';

async function statements(direction: 'up' | 'down'): Promise<string[]> {
  const queries: string[] = [];
  const runner = {
    query: (sql: string) => {
      queries.push(sql.replaceAll(/\s+/g, ' ').trim());
      return Promise.resolve();
    },
  } as unknown as QueryRunner;
  const migration = new CILogonUpdate1791955721334();
  if (direction === 'up') await migration.up(runner);
  else await migration.down(runner);
  return queries;
}

describe('CILogon authentication migration', () => {
  it('creates a unique issuer/subject identity with one identity per user', async () => {
    const sql = await statements('up');
    const identities = sql.find((query) =>
      query.startsWith('CREATE TABLE "auth_identities"'),
    );
    expect(identities).toContain(
      '"id" uuid NOT NULL DEFAULT gen_random_uuid()',
    );
    expect(identities).toContain('"user_id" uuid NOT NULL');
    expect(identities).toContain('"issuer" text NOT NULL');
    expect(identities).toContain('"subject" text NOT NULL');
    expect(identities).toContain('UNIQUE ("issuer", "subject")');
    expect(identities).toContain('UNIQUE ("user_id")');
    const foreignKey = sql.find((query) =>
      query.startsWith('ALTER TABLE "auth_identities"'),
    );
    expect(foreignKey).toContain(
      'FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE',
    );
    expect(sql.indexOf(foreignKey!)).toBeGreaterThan(sql.indexOf(identities!));
  });
});

describe('CILogon login transaction migration', () => {
  it('creates login attempts with required security fields, nullable completion, and an expiry index', async () => {
    const sql = await statements('up');
    const attempts = sql.find((query) =>
      query.startsWith('CREATE TABLE "oidc_login_transactions"'),
    );
    for (const field of [
      'state_hash',
      'nonce',
      'pkce_verifier',
      'browser_binding_hash',
    ]) {
      expect(attempts).toContain(`"${field}" text NOT NULL`);
    }
    expect(attempts).toContain('UNIQUE ("state_hash")');
    expect(attempts).toContain(
      '"expires_at" TIMESTAMP WITH TIME ZONE NOT NULL',
    );
    expect(attempts).toContain('"return_to" text,');
    expect(attempts).toContain('"consumed_at" TIMESTAMP WITH TIME ZONE,');
    expect(attempts).not.toContain('"user_id"');
    const expiryIndex =
      'CREATE INDEX "IDX_oidc_login_transactions_expires" ON "oidc_login_transactions" ("expires_at")';
    expect(sql).toContain(expiryIndex);
    expect(sql.indexOf(expiryIndex)).toBeGreaterThan(sql.indexOf(attempts!));
  });
});

describe('CILogon user profile migration', () => {
  it('removes passwords and adds nullable profile fields without replacing local users or sessions', async () => {
    const sql = await statements('up');
    expect(sql).toEqual(
      expect.arrayContaining([
        'ALTER TABLE "users" DROP COLUMN "password_hash"',
        'ALTER TABLE "users" ADD "display_name" text',
        'ALTER TABLE "users" ADD "last_login_at" TIMESTAMP WITH TIME ZONE',
        'ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL',
      ]),
    );
    expect(
      sql.some((query) =>
        /(?:DROP TABLE|DELETE FROM|TRUNCATE) "(?:users|auth_sessions|bookmarks|personal_learning_paths|personal_path_items)"/.test(
          query,
        ),
      ),
    ).toBe(false);
    expect(
      sql.some((query) => query.includes('DROP CONSTRAINT "UQ_users_email"')),
    ).toBe(false);
    expect(
      sql.some((query) =>
        query.includes('DROP CONSTRAINT "UQ_users_username"'),
      ),
    ).toBe(false);
  });
});

describe('CILogon migration rollback', () => {
  it('restores the previous user columns on rollback', async () => {
    const sql = await statements('down');
    expect(sql).toEqual(
      expect.arrayContaining([
        'ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL',
        'ALTER TABLE "users" DROP COLUMN "last_login_at"',
        'ALTER TABLE "users" DROP COLUMN "display_name"',
        'ALTER TABLE "users" ADD "password_hash" text NOT NULL',
      ]),
    );
  });

  it('removes the identity foreign key and transaction index before dropping their tables', async () => {
    const sql = await statements('down');
    const foreignKeyIndex = sql.findIndex((query) =>
      query.startsWith('ALTER TABLE "auth_identities" DROP CONSTRAINT'),
    );
    const expiryIndex = sql.indexOf(
      'DROP INDEX "public"."IDX_oidc_login_transactions_expires"',
    );
    const attempts = sql.indexOf('DROP TABLE "oidc_login_transactions"');
    const identities = sql.indexOf('DROP TABLE "auth_identities"');
    expect(foreignKeyIndex).toBeGreaterThanOrEqual(0);
    expect(identities).toBeGreaterThan(foreignKeyIndex);
    expect(expiryIndex).toBeGreaterThanOrEqual(0);
    expect(attempts).toBeGreaterThan(expiryIndex);
  });
});
