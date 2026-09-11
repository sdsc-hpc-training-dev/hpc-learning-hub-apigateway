jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

jest.mock('@nestjs/typeorm', () => ({
  TypeOrmModule: {
    forRootAsync: (options: unknown): unknown => options,
    forFeature: (entities: unknown): unknown => entities,
  },
}));

import { DatabaseModule } from './database.module';
import { persistenceEntities } from './entities/persistence.entities';

interface ConfigReader {
  get<T>(name: string, fallback: T): T;
  getOrThrow<T>(name: string): T;
}

interface RootDatabaseConfig {
  useFactory(config: ConfigReader): Record<string, unknown>;
}

const configReader = (values: Record<string, string>): ConfigReader => {
  const entries = new Map(Object.entries(values));

  return {
    get: <T>(name: string, fallback: T): T =>
      (entries.get(name) ?? fallback) as T,
    getOrThrow: <T>(name: string): T => {
      const value = entries.get(name);
      if (value === undefined) throw new Error(`${name} is required`);
      return value as T;
    },
  };
};

const databaseImports = Reflect.getMetadata(
  'imports',
  DatabaseModule,
) as unknown as [RootDatabaseConfig, readonly unknown[]];
const rootDatabaseConfig = databaseImports[0];

describe('DatabaseModule configuration', () => {
  it('registers all persistence entities with the feature data source', () => {
    expect(databaseImports[1]).toEqual(persistenceEntities);
  });

  it('builds safe TypeORM options from explicit environment settings', () => {
    const options = rootDatabaseConfig.useFactory(
      configReader({
        DB_HOST: 'postgres.internal',
        DB_PORT: '6543',
        DB_USERNAME: 'gateway',
        DB_PASSWORD: 'secret',
        DB_DATABASE: 'learning_hub',
      }),
    );

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'postgres.internal',
      port: 6543,
      username: 'gateway',
      password: 'secret',
      database: 'learning_hub',
      uuidExtension: 'pgcrypto',
      autoLoadEntities: true,
      synchronize: false,
      dropSchema: false,
    });
  });

  it('uses localhost and port 5432 when optional settings are absent', () => {
    const options = rootDatabaseConfig.useFactory(
      configReader({
        DB_USERNAME: 'gateway',
        DB_PASSWORD: 'secret',
        DB_DATABASE: 'learning_hub',
      }),
    );

    expect(options.host).toBe('localhost');
    expect(options.port).toBe(5432);
  });

  it.each(['0', '65536', '1.5', 'not-a-number'])(
    'rejects invalid database port %s',
    (port) => {
      const buildOptions = () =>
        rootDatabaseConfig.useFactory(
          configReader({
            DB_PORT: port,
            DB_USERNAME: 'gateway',
            DB_PASSWORD: 'secret',
            DB_DATABASE: 'learning_hub',
          }),
        );

      expect(buildOptions).toThrow(
        'DB_PORT must be an integer between 1 and 65535',
      );
    },
  );
});
