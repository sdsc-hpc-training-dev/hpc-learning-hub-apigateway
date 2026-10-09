import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { persistenceEntities } from './entities/persistence.entities';

function parseDatabasePort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }

  return port;
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

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseDatabasePort(config.get<string>('DB_PORT', '5432')),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),
        ssl: parseDatabaseSslMode(config.get<string>('DB_SSL_MODE', 'disable')),
        uuidExtension: 'pgcrypto',
        autoLoadEntities: true,
        synchronize: false,
        dropSchema: false,
      }),
    }),
    TypeOrmModule.forFeature([...persistenceEntities]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
