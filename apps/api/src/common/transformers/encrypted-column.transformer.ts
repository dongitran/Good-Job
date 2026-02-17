import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';
import { ValueTransformer } from 'typeorm';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = 'goodjob-oauth-token-salt'; // Static salt — key uniqueness comes from env secret

function getKey(): Buffer {
  const secret = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'Missing OAUTH_TOKEN_ENCRYPTION_KEY environment variable. ' +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return scryptSync(secret, SALT, 32);
}

/**
 * TypeORM ValueTransformer that encrypts column values at rest using AES-256-GCM.
 *
 * Storage format: base64( IV | authTag | ciphertext )
 *
 * Usage:
 *   @Column({ type: 'text', transformer: encryptedColumn })
 *   accessToken: string;
 */
export const encryptedColumn: ValueTransformer = {
  to(value: string | null): string | null {
    if (value == null || value === '') return value;

    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Pack: IV (16) + authTag (16) + ciphertext
    const packed = Buffer.concat([iv, authTag, encrypted]);
    return packed.toString('base64');
  },

  from(value: string | null): string | null {
    if (value == null || value === '') return value;

    // If the value doesn't look like base64 (legacy plaintext), return as-is
    // This allows gradual migration from unencrypted to encrypted
    if (!isBase64Encrypted(value)) return value;

    try {
      const key = getKey();
      const packed = Buffer.from(value, 'base64');

      const iv = packed.subarray(0, IV_LENGTH);
      const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      // If decryption fails (wrong key, corrupted data), return raw value
      // to avoid crashing reads on legacy unencrypted data
      return value;
    }
  },
};

/**
 * Heuristic: encrypted values are base64 and at least IV+authTag+1 byte long.
 * Raw OAuth tokens (Google) typically start with "ya29." or similar patterns.
 */
function isBase64Encrypted(value: string): boolean {
  if (value.length < 45) return false; // min base64 length for 33 bytes
  return /^[A-Za-z0-9+/]+=*$/.test(value);
}
