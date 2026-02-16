import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { requireEnv } from './helpers';

export const dbConfig = registerAs('database', () => ({
  url: requireEnv('DATABASE_URL'), // Required - database connection
}));

// TypeORM config
export const typeormConfig = registerAs(
  'typeorm',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: false, // Always use migrations
    logging: process.env.NODE_ENV === 'development',
  }),
);
