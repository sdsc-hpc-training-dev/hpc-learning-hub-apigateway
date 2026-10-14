import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

export function parseDatabasePort(value: string | undefined): number {
  const port = Number(value ?? '5432');

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }

  return port;
}

export function requireDatabaseSetting(
  name: string,
  value: string | undefined,
): string {
  if (value === undefined) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function parseDatabaseSslMode(
  value: string | undefined,
): false | { rejectUnauthorized: true } {
  const mode = value?.trim().toLowerCase() ?? 'disable';
  if (['disable', 'false', 'off'].includes(mode)) return false;
  if (['require', 'verify-ca', 'verify-full', 'true', 'on'].includes(mode)) {
    return { rejectUnauthorized: true };
  }
  throw new Error(
    'DB_SSL_MODE must be disable, require, verify-ca, or verify-full',
  );
}

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseDatabasePort(process.env.DB_PORT),
  username: requireDatabaseSetting('DB_USERNAME', process.env.DB_USERNAME),
  password: requireDatabaseSetting('DB_PASSWORD', process.env.DB_PASSWORD),
  database: requireDatabaseSetting('DB_DATABASE', process.env.DB_DATABASE),
  ssl: parseDatabaseSslMode(process.env.DB_SSL_MODE),
  uuidExtension: 'pgcrypto',
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/!(*.spec).{ts,js}`],
  synchronize: false,
  dropSchema: false,
});

export default dataSource;
