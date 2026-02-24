import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { expect, type APIResponse, type Page } from '@playwright/test';
import { apiBaseURL } from '../playwright.config';
import { flushThrottleKeys } from './redis-helpers';

export const databaseUrl =
  process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

// ─── Email helpers ────────────────────────────────────────────────────────────

export function uniqueEmail(feature: string, role: string): string {
  // Always lowercase: API normalizes emails before DB insert, so queries must match
  return `e2e.${feature}.${role}.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`.toLowerCase();
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

export async function querySingleToken(
  query: string,
  email: string,
): Promise<string | null> {
  if (!databaseUrl) {
    throw new Error(
      'Missing E2E_DATABASE_URL (or DATABASE_URL) for E2E tests.',
    );
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query<{ token: string }>(query, [email]);
    return result.rows[0]?.token ?? null;
  } finally {
    await client.end();
  }
}

export async function waitForToken(
  email: string,
  kind: 'verify' | 'reset',
): Promise<string> {
  const query =
    kind === 'verify'
      ? `
        SELECT evt.token
        FROM email_verification_tokens evt
        INNER JOIN users u ON u.id = evt.user_id
        WHERE LOWER(u.email) = LOWER($1)
        ORDER BY evt.created_at DESC
        LIMIT 1
      `
      : `
        SELECT prt.token
        FROM password_reset_tokens prt
        INNER JOIN users u ON u.id = prt.user_id
        WHERE LOWER(u.email) = LOWER($1) AND prt.used_at IS NULL
        ORDER BY prt.created_at DESC
        LIMIT 1
      `;

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const token = await querySingleToken(query, email);
    if (token) return token;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(`Timed out waiting for ${kind} token for ${email}`);
}

// ─── API helpers ──────────────────────────────────────────────────────────────

/**
 * Creates a verified user via API:
 * POST /auth/signup → poll DB for verify token → POST /auth/verify-email
 *
 * Flushes Redis throttle keys before signup so that the per-IP rate limit
 * (5/day for signup, 5/15min for signin) doesn't block test infrastructure
 * calls when many workers run in parallel.
 */
export async function createVerifiedUser(
  page: Page,
  email: string,
  password: string,
  fullName: string,
): Promise<void> {
  // Flush + retry loop: parallel workers can re-create throttle keys
  // between our flush and API call, so we retry on 429.
  let signUpRes: APIResponse | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await flushThrottleKeys();
    signUpRes = await page.request.post(`${apiBaseURL}/auth/signup`, {
      data: { fullName, email, password },
    });
    if (signUpRes.status() !== 429) break;
  }
  expect(signUpRes!.ok()).toBeTruthy();

  const verifyToken = await waitForToken(email, 'verify');
  const verifyRes = await page.request.post(`${apiBaseURL}/auth/verify-email`, {
    data: { token: verifyToken },
  });
  expect(verifyRes.ok()).toBeTruthy();
}

export interface SignInResult {
  accessToken: string;
  orgId: string;
  userId: string;
  role: string;
}

/**
 * Signs in via API and decodes JWT to extract orgId, userId, role.
 *
 * Flushes Redis throttle keys before signin to prevent the per-IP rate
 * limit (5/15min) from blocking test infrastructure sign-in calls.
 */
export async function signInApi(
  page: Page,
  email: string,
  password: string,
): Promise<SignInResult> {
  // Flush + retry loop: parallel workers can re-create throttle keys
  // between our flush and API call, so we retry on 429.
  let signInRes: APIResponse | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await flushThrottleKeys();
    signInRes = await page.request.post(`${apiBaseURL}/auth/signin`, {
      data: { email, password },
    });
    if (signInRes.status() !== 429) break;
  }
  expect(signInRes!.ok()).toBeTruthy();
  const { accessToken } = (await signInRes!.json()) as { accessToken: string };
  expect(typeof accessToken).toBe('string');

  const payload = JSON.parse(
    Buffer.from(accessToken.split('.')[1], 'base64').toString('utf8'),
  ) as { sub?: string; orgId?: string; role?: string };

  return {
    accessToken,
    orgId: payload.orgId ?? '',
    userId: payload.sub ?? '',
    role: payload.role ?? '',
  };
}
