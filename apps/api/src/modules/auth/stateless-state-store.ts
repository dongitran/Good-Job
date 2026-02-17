import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Request } from 'express';

type StoreCallback = (err: Error | null, state: string) => void;
type VerifyCallback = (err: Error | null, ok: boolean) => void;

/**
 * Stateless OAuth CSRF state store using HMAC-SHA256-signed nonces.
 *
 * Replaces the default session-based state store so the API can remain
 * fully stateless (no express-session required).
 *
 * State format (base64url-encoded JSON):
 *   { nonce: "<hex>", ts: <epoch-ms>, sig: "<sha256-hmac-hex>" }
 *
 * Security properties:
 *  - Unforgeable without the HMAC secret
 *  - Time-bounded (default: 10 minutes) to prevent state replay
 *  - Constant-time comparison to prevent timing attacks
 */
export class StatelessStateStore {
  private readonly maxAgeMs: number;

  constructor(
    private readonly secret: string,
    maxAgeMs = 10 * 60 * 1000,
  ) {
    this.maxAgeMs = maxAgeMs;
  }

  store(_req: Request, callback: StoreCallback): void {
    const nonce = randomBytes(16).toString('hex');
    const ts = Date.now();
    const raw = `${nonce}.${ts}`;
    const sig = this.sign(raw);
    const state = Buffer.from(JSON.stringify({ nonce, ts, sig })).toString(
      'base64url',
    );
    callback(null, state);
  }

  verify(_req: Request, state: string, callback: VerifyCallback): void {
    try {
      const { nonce, ts, sig } = JSON.parse(
        Buffer.from(state, 'base64url').toString('utf8'),
      ) as { nonce: string; ts: number; sig: string };

      if (!nonce || !ts || !sig) {
        return callback(null, false);
      }

      const age = Date.now() - ts;
      if (age < 0 || age > this.maxAgeMs) {
        return callback(null, false);
      }

      const raw = `${nonce}.${ts}`;
      const expected = this.sign(raw);
      const expectedBuf = Buffer.from(expected, 'hex');
      const actualBuf = Buffer.from(sig, 'hex');

      if (
        expectedBuf.length !== actualBuf.length ||
        !timingSafeEqual(expectedBuf, actualBuf)
      ) {
        return callback(null, false);
      }

      callback(null, true);
    } catch {
      callback(null, false);
    }
  }

  private sign(data: string): string {
    return createHmac('sha256', this.secret).update(data).digest('hex');
  }
}
