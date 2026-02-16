import { registerAs } from '@nestjs/config';
import { requireEnv } from './helpers';

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
