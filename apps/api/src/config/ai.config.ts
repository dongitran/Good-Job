import { registerAs } from '@nestjs/config';
import { requireEnv } from './helpers';

export const geminiConfig = registerAs('gemini', () => ({
  apiKey: requireEnv('GEMINI_API_KEY'), // Required - AI service
  model: 'gemini-2.0-flash-exp',
  embeddingModel: 'text-embedding-004',
}));
