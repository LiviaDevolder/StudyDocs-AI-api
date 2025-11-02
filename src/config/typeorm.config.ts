import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

export const getTypeOrmConfig = (env: {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  nodeEnv?: string;
}): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: env.host || 'localhost',
  port: env.port || 5432,
  username: env.username || 'postgres',
  password: env.password || 'postgres',
  database: env.database || 'studydocs_ai',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: env.nodeEnv !== 'production',
  migrationsRun: env.nodeEnv === 'production',
  logging: env.nodeEnv !== 'production',
});

export const getDataSourceOptions = (env: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}): DataSourceOptions => ({
  type: 'postgres',
  host: env.host,
  port: env.port,
  username: env.username,
  password: env.password,
  database: env.database,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
