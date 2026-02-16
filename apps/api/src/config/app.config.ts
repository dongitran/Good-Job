import { registerAs } from '@nestjs/config';
import { getEnvInt, requireEnv } from './helpers';

export const appConfig = registerAs('app', () => ({
  port: getEnvInt('API_PORT', 3000),
  url: requireEnv('APP_URL'),
  env: requireEnv('NODE_ENV'),
}));
