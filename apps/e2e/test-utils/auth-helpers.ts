import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { expect, type Page } from '@playwright/test';
import { apiBaseURL } from '../playwright.config';

export const databaseUrl =
  process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

// ─── Email helpers ────────────────────────────────────────────────────────────

export function uniqueEmail(feature: string, role: string): string {
  return `e2e.${feature}.${role}.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
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
        WHERE u.email = $1
        ORDER BY evt.created_at DESC
        LIMIT 1
      `
      : `
        SELECT prt.token
        FROM password_reset_tokens prt
        INNER JOIN users u ON u.id = prt.user_id
        WHERE u.email = $1 AND prt.used_at IS NULL
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
 */
export async function createVerifiedUser(
  page: Page,
  email: string,
  password: string,
  fullName: string,
): Promise<void> {
  const signUpRes = await page.request.post(`${apiBaseURL}/auth/signup`, {
    data: { fullName, email, password },
  });
  expect(signUpRes.ok()).toBeTruthy();

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
 */
export async function signInApi(
  page: Page,
  email: string,
  password: string,
): Promise<SignInResult> {
  const signInRes = await page.request.post(`${apiBaseURL}/auth/signin`, {
    data: { email, password },
  });
  expect(signInRes.ok()).toBeTruthy();
  const { accessToken } = (await signInRes.json()) as { accessToken: string };
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
