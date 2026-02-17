import { registerAs } from '@nestjs/config';
import { requireEnv } from './helpers';

export const redisConfig = registerAs('redis', () => ({
  url: requireEnv('REDIS_URL'),
}));
