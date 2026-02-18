import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { expect, test } from '@playwright/test';

const databaseUrl = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

async function waitForVerifyToken(email: string): Promise<string> {
  if (!databaseUrl) {
    throw new Error('Missing E2E_DATABASE_URL (or DATABASE_URL) for live OAuth callback E2E.');
  }

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const result = await client.query<{ token: string }>(
        `
          SELECT evt.token
          FROM email_verification_tokens evt
          INNER JOIN users u ON u.id = evt.user_id
          WHERE u.email = $1
          ORDER BY evt.created_at DESC
          LIMIT 1
        `,
        [email],
      );
      const token = result.rows[0]?.token;
      if (token) return token;
    } finally {
      await client.end();
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(`Timed out waiting for verify token for ${email}`);
}

test.describe('Google OAuth', () => {
  test('google auth endpoint responds with redirect to Google', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await expect(
      page.getByRole('button', { name: 'Continue with Google' }),
    ).toBeVisible();

    const response = await page.request.get('/api/auth/google', {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);

    const location = response.headers().location ?? '';
    expect(location).toContain('accounts.google.com/o/oauth2');
    expect(location).toContain('client_id=');
  });

  test.skip(
    !databaseUrl,
    'Set E2E_DATABASE_URL (or DATABASE_URL) to run live OAuth callback E2E.',
  );

  test('auth callback with valid access token restores session via /auth/me', async ({ page }) => {
    const email = `e2e.google-callback.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    const signUpRes = await page.request.post('/api/auth/signup', {
      data: {
        fullName: 'E2E OAuth Callback User',
        email,
        password,
      },
    });
    expect(signUpRes.ok()).toBeTruthy();

    const verifyToken = await waitForVerifyToken(email);
    const verifyRes = await page.request.post('/api/auth/verify-email', {
      data: { token: verifyToken },
    });
    expect(verifyRes.ok()).toBeTruthy();

    const signInRes = await page.request.post('/api/auth/signin', {
      data: { email, password },
    });
    expect(signInRes.ok()).toBeTruthy();
    const { accessToken } = await signInRes.json();
    expect(typeof accessToken).toBe('string');
    expect(accessToken.length).toBeGreaterThan(20);

    const meResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/me') && response.request().method() === 'GET',
    );

    await page.goto(`/auth/callback#access_token=${encodeURIComponent(accessToken)}`);
    const meResponse = await meResponsePromise;
    expect(meResponse.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/$/);
  });
});
