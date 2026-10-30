import { createWriteStream } from 'node:fs';
import { once } from 'node:events';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import {
  parseDatabasePort,
  parseDatabaseSslMode,
  requireDatabaseSetting,
} from './data-source';
import { CreateSiteFeedback1791561600000 } from './migrations/1791561600000-CreateSiteFeedback';

type FeedbackRow = {
  id: string;
  created_at: Date;
  survey_version: number;
  rating: number;
  found_what_needed: string | null;
  worked_well: string | null;
  improvements: string | null;
};

function csvCell(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? (JSON.stringify(value) ?? '')
        : String(value);
  const safe = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function usage(): never {
  throw new Error(
    'Usage: node dist/database/feedback-maintenance.js migrate | export <file> | purge',
  );
}

async function main(): Promise<void> {
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
    const openCsvFile = createWriteStream;
    const stream = openCsvFile(destination!, {
      encoding: 'utf8',
      flags: 'wx',
      mode: 0o600,
    });
    stream.write(
      'id,created_at,survey_version,rating,found_what_needed,worked_well,improvements\n',
    );
    for (const row of result.rows) {
      if (!stream.write(Object.values(row).map(csvCell).join(',') + '\n')) {
        await once(stream, 'drain');
      }
    }
    stream.end();
    await once(stream, 'finish');
  } finally {
    await client.end();
  }
}

void main();
