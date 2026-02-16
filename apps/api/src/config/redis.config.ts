import { registerAs } from '@nestjs/config';
import { getEnv, getEnvInt, getEnvOptional } from './helpers';

export const redisConfig = registerAs('redis', () => ({
  host: getEnv('REDIS_HOST', 'localhost'),
  port: getEnvInt('REDIS_PORT', 6379),
  password: getEnvOptional('REDIS_PASSWORD'),
}));
