import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Helper function to require environment variables
 * Throws error if variable is not set
 */
function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(
      `Missing required environment variable: ${key}. Please set it in your .env file.`,
    );
  }
  return value || defaultValue!;
}

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.API_PORT || '3000', 10), // Standard port default
  url: requireEnv('APP_URL'), // Required - no default
  env: requireEnv('NODE_ENV'), // Required - no default
}));

export const dbConfig = registerAs('database', () => ({
  url: requireEnv('DATABASE_URL'), // Required - database connection
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: requireEnv('JWT_SECRET'), // Required - security critical
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m', // Reasonable default
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d', // Reasonable default
}));

export const googleConfig = registerAs('google', () => ({
  clientId: requireEnv('GOOGLE_CLIENT_ID'), // Required - OAuth integration
  clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'), // Required - OAuth secret
  callbackUrl: requireEnv('GOOGLE_CALLBACK_URL'), // Required - OAuth callback
}));

export const pointsConfig = registerAs('points', () => ({
  defaultMonthlyBudget: parseInt(requireEnv('DEFAULT_MONTHLY_BUDGET'), 10), // Required - business rule
  minPoints: parseInt(requireEnv('DEFAULT_MIN_POINTS'), 10), // Required - business rule
  maxPoints: parseInt(requireEnv('DEFAULT_MAX_POINTS'), 10), // Required - business rule
}));

export const geminiConfig = registerAs('gemini', () => ({
  apiKey: requireEnv('GEMINI_API_KEY'), // Required - AI service
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
