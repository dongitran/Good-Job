import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.API_PORT || '3000', 10),
  url: process.env.APP_URL || 'http://localhost:5173',
  env: process.env.NODE_ENV || 'development',
}));

export const dbConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
}));

export const googleConfig = registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackUrl: process.env.GOOGLE_CALLBACK_URL,
}));

export const pointsConfig = registerAs('points', () => ({
  defaultMonthlyBudget: parseInt(
    process.env.DEFAULT_MONTHLY_BUDGET || '200',
    10,
  ),
  minPoints: parseInt(process.env.DEFAULT_MIN_POINTS || '10', 10),
  maxPoints: parseInt(process.env.DEFAULT_MAX_POINTS || '50', 10),
}));

export const geminiConfig = registerAs('gemini', () => ({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash-exp',
  embeddingModel: 'text-embedding-004',
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
