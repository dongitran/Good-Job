import { registerAs } from '@nestjs/config';
import { requireEnv } from './helpers';

// Parse comma-separated keys, e.g. "key1,key2,key3"
function parseApiKeys(raw: string): string[] {
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

// Round-robin rotator — module-level counter persists across calls within a process.
// Usage (in a service): getNextGeminiApiKey(this.geminiConf.apiKeys)
let _keyIndex = 0;
export function getNextGeminiApiKey(keys: string[]): string {
  const key = keys[_keyIndex % keys.length];
  _keyIndex = (_keyIndex + 1) % keys.length;
  return key;
}

export const geminiConfig = registerAs('gemini', () => {
  const raw = requireEnv('GEMINI_API_KEYS'); // comma-separated, e.g. "key1,key2"
  return {
    apiKeys: parseApiKeys(raw),
    model: 'gemini-2.0-flash-exp',
    embeddingModel: 'text-embedding-004',
  };
});
