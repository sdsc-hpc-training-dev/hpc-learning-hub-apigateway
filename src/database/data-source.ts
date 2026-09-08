import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

function parseDatabasePort(value: string | undefined): number {
  const port = Number(value ?? '5432');

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }

  return port;
}

function requireDatabaseSetting(
  name: string,
  value: string | undefined,
): string {
  if (value === undefined) {
    throw new Error(`${name} is required`);
  }

  return value;
}

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseDatabasePort(process.env.DB_PORT),
  username: requireDatabaseSetting('DB_USERNAME', process.env.DB_USERNAME),
  password: requireDatabaseSetting('DB_PASSWORD', process.env.DB_PASSWORD),
  database: requireDatabaseSetting('DB_DATABASE', process.env.DB_DATABASE),
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/../../migrations/*{.ts,.js}`],
  synchronize: false,
  dropSchema: false,
});

export default dataSource;
