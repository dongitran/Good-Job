import { registerAs } from '@nestjs/config';
import { requireEnv } from './helpers';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.API_PORT || '3000', 10), // Standard port default
  url: requireEnv('APP_URL'), // Required - no default
  env: requireEnv('NODE_ENV'), // Required - no default
}));
