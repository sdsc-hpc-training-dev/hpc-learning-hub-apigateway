import { Client } from 'pg';
import {
  parseDatabasePort,
  parseDatabaseSslMode,
  requireDatabaseSetting,
} from './data-source';
import { CreateBugReports1794528000000 } from './migrations/1794528000000-CreateBugReports';
import type { QueryRunner } from 'typeorm';

const baseline = [
  '1788856392276:EnablePgvector1788856392276',
  '1788893479707:CreateIngestionPersistence1788893479707',
  '1789142400000:CreateCuratedLearningPaths1789142400000',
  '1790723644950:CreateAuthenticationTables1790723644950',
  '1791487659372:CreateBookmarks1791487659372',
  '1791532800000:AddEventDestinations1791532800000',
  '1791561600000:CreateSiteFeedback1791561600000',
];
const revision = '1794528000000:CreateBugReports1794528000000';
const runtime = 'learning_hub_gateway_ux_v1';

type PgClient = InstanceType<typeof Client>;

async function inspect(client: PgClient) {
  const result = (await client.query(
    `
    SELECT ARRAY(SELECT timestamp::text || ':' || name FROM public.migrations ORDER BY id) AS ledger,
           to_regclass('public.bug_reports') IS NOT NULL AS present,
           EXISTS (SELECT FROM pg_roles WHERE rolname = $1 AND rolcanlogin
             AND NOT (rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls)) AS runtime_exists
  `,
    [runtime],
  )) as {
    rows: { ledger: string[]; present: boolean; runtime_exists: boolean }[];
  };
  const { ledger, present, runtime_exists: exists } = result.rows[0]!;
  const applied = ledger.join(',') === [...baseline, revision].join(',');
  if (
    !exists ||
    (!applied && ledger.join(',') !== baseline.join(',')) ||
    present !== applied
  ) {
    throw new Error(
      'Unexpected migration ledger, table state, or runtime role.',
    );
  }
  return applied;
}

async function verifyGrants(client: PgClient) {
  const result = (await client.query(
    `
    SELECT has_table_privilege($1, 'public.bug_reports', 'INSERT')
       AND NOT EXISTS (
         SELECT FROM unnest(ARRAY['SELECT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege
         WHERE has_table_privilege($1, 'public.bug_reports', privilege)
       )
       AND NOT EXISTS (
         SELECT FROM unnest(ARRAY['SELECT','UPDATE','REFERENCES']) privilege
         WHERE has_any_column_privilege($1, 'public.bug_reports', privilege)
       ) AS valid
  `,
    [runtime],
  )) as { rows: { valid: boolean }[] };
  if (!result.rows[0]?.valid)
    throw new Error('Gateway bug-report grants are not insert-only.');
}

export async function runBugReportMigration(command: string | undefined) {
  if (!['check', 'apply', 'runtime-check'].includes(command ?? '')) {
    throw new Error('Use bug-report-migration.js check|apply|runtime-check.');
  }
  const username = requireDatabaseSetting(
    'DB_USERNAME',
    process.env.DB_USERNAME,
  );
  if (command === 'runtime-check' && username !== runtime) {
    throw new Error('Unexpected Gateway runtime role.');
  }
  const client = new Client({
    host: requireDatabaseSetting('DB_HOST', process.env.DB_HOST),
    port: parseDatabasePort(process.env.DB_PORT),
    user: username,
    password: requireDatabaseSetting('DB_PASSWORD', process.env.DB_PASSWORD),
    database: requireDatabaseSetting('DB_DATABASE', process.env.DB_DATABASE),
    ssl: parseDatabaseSslMode(process.env.DB_SSL_MODE),
    connectionTimeoutMillis: 8_000,
    statement_timeout: 15_000,
  });
  await client.connect();
  try {
    await client.query(command === 'apply' ? 'BEGIN' : 'BEGIN READ ONLY');
    if (command === 'runtime-check') {
      await verifyGrants(client);
      await client.query('COMMIT');
      console.log('Bug reports table present; Gateway grants verified.');
      return;
    }
    if (command === 'apply') {
      await client.query("SET LOCAL lock_timeout = '5s'");
      const lock = (await client.query(
        'SELECT pg_try_advisory_xact_lock(713318392101) AS acquired',
      )) as { rows: { acquired: boolean }[] };
      if (!lock.rows[0]?.acquired)
        throw new Error('Catalog ingestion lock is busy; retry after the run.');
    }
    let applied = await inspect(client);
    if (!applied && command === 'apply') {
      const migration = new CreateBugReports1794528000000();
      await migration.up({
        query: (sql: string) => client.query(sql),
      } as QueryRunner);
      await client.query(
        'GRANT INSERT ON public.bug_reports TO learning_hub_gateway_ux_v1',
      );
      await client.query(
        'INSERT INTO public.migrations (timestamp, name) VALUES ($1, $2)',
        revision.split(':'),
      );
      applied = await inspect(client);
    }
    if (applied) await verifyGrants(client);
    await client.query('COMMIT');
    console.log(
      applied
        ? 'Bug reports migration present; Gateway grants verified.'
        : 'Baseline verified; bug reports migration pending.',
    );
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  void runBugReportMigration(process.argv[2]).catch((error: unknown) => {
    // Never print connection settings or PostgreSQL error details.
    const code = (error as { code?: string }).code;
    console.error(
      code
        ? `Bug reports migration failed (${code}).`
        : 'Bug reports migration or preflight failed.',
    );
    process.exitCode = 1;
  });
}
