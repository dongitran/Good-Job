import { registerAs } from '@nestjs/config';
import { getEnv, getEnvBoolean, requireEnv } from './helpers';

export const jwtConfig = registerAs('jwt', () => ({
  secret: requireEnv('JWT_SECRET'),
  accessExpiry: getEnv('JWT_ACCESS_EXPIRY', '15m'),
  refreshExpiry: getEnv('JWT_REFRESH_EXPIRY', '7d'),
  allowDevTokenIssue: getEnvBoolean(
    'AUTH_ALLOW_DEV_TOKEN_ISSUE',
    requireEnv('NODE_ENV') !== 'production',
  ),
}));

export const googleConfig = registerAs('google', () => ({
  clientId: requireEnv('GOOGLE_CLIENT_ID'),
  clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
  callbackUrl: requireEnv('GOOGLE_CALLBACK_URL'),
}));
