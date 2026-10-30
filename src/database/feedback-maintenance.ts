import { once } from 'node:events';
import { open } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import {
  parseDatabasePort,
  parseDatabaseSslMode,
  requireDatabaseSetting,
} from './data-source';
import { CreateSiteFeedback1791561600000 } from './migrations/1791561600000-CreateSiteFeedback';

export type FeedbackRow = {
  id: string;
  created_at: Date;
  survey_version: number;
  rating: number;
  found_what_needed: string | null;
  worked_well: string | null;
  improvements: string | null;
};

type CsvScalar = string | number | boolean | Date | null;

export function csvCell(value: CsvScalar): string {
  const text =
    value === null
      ? ''
      : value instanceof Date
        ? value.toISOString()
        : `${value}`;
  const safe = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function feedbackCsvLine(row: FeedbackRow): string {
  return [
    row.id,
    row.created_at,
    row.survey_version,
    row.rating,
    row.found_what_needed,
    row.worked_well,
    row.improvements,
  ]
    .map(csvCell)
    .join(',');
}

export function trustedExportPath(destination: string): string {
  if (!isAbsolute(destination)) {
    throw new Error(
      'Export destination must be an absolute operator-supplied path',
    );
  }
  return resolve(destination);
}

function usage(): never {
  throw new Error(
    'Usage: node dist/database/feedback-maintenance.js migrate | export <file> | purge',
  );
}

export async function main(): Promise<void> {
  const [command, destination] = process.argv.slice(2);
  if (!['migrate', 'export', 'purge'].includes(command ?? '')) usage();
  if (command === 'export' && !destination) usage();

  const connection = {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseDatabasePort(process.env.DB_PORT),
    user: requireDatabaseSetting('DB_USERNAME', process.env.DB_USERNAME),
    password: requireDatabaseSetting('DB_PASSWORD', process.env.DB_PASSWORD),
    database: requireDatabaseSetting('DB_DATABASE', process.env.DB_DATABASE),
    ssl: parseDatabaseSslMode(process.env.DB_SSL_MODE),
  };
  if (command === 'migrate') {
    // This deliberately registers only the feedback migration. It cannot apply
    // unrelated pending Gateway migrations when run with elevated credentials.
    const source = new DataSource({
      type: 'postgres',
      host: connection.host,
      port: connection.port,
      username: connection.user,
      password: connection.password,
      database: connection.database,
      ssl: connection.ssl,
      migrations: [CreateSiteFeedback1791561600000],
      synchronize: false,
    });
    await source.initialize();
    try {
      await source.runMigrations();
    } finally {
      await source.destroy();
    }
    process.stdout.write('Feedback migration complete.\n');
    return;
  }

  const client = new Client(connection);
  await client.connect();
  try {
    if (command === 'purge') {
      const result = (await client.query(
        "DELETE FROM site_feedback WHERE created_at < (CURRENT_DATE - INTERVAL '12 months')",
      )) as { rowCount: number | null };
      process.stdout.write(`Purged ${result.rowCount ?? 0} feedback rows.\n`);
      return;
    }

    const result = (await client.query(`
      SELECT id, created_at, survey_version, rating, found_what_needed, worked_well, improvements
      FROM site_feedback ORDER BY created_at ASC, id ASC
    `)) as { rows: FeedbackRow[] };
    const file = await open(trustedExportPath(destination!), 'wx', 0o600);
    const stream = file.createWriteStream({
      encoding: 'utf8',
    });
    stream.write(
      'id,created_at,survey_version,rating,found_what_needed,worked_well,improvements\n',
    );
    for (const row of result.rows) {
      if (!stream.write(feedbackCsvLine(row) + '\n')) {
        await once(stream, 'drain');
      }
    }
    stream.end();
    await once(stream, 'finish');
  } finally {
    await client.end();
  }
}

if (require.main === module) void main();
