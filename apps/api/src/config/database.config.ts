import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getEnv, requireEnv } from './helpers';

export const dbConfig = registerAs('database', () => ({
  url: requireEnv('DATABASE_URL'),
}));

export const typeormConfig = registerAs('typeorm', (): TypeOrmModuleOptions => {
  const isTestEnv = getEnv('NODE_ENV', 'development') === 'test';

  return {
    type: 'postgres',
    url: requireEnv('DATABASE_URL'),
    entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: isTestEnv,
    logging: getEnv('NODE_ENV', 'development') === 'development',
    retryAttempts: isTestEnv ? 2 : 10,
    retryDelay: isTestEnv ? 200 : 3000,
  };
});
