import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { expect, test } from '@playwright/test';

const databaseUrl = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

async function querySingleToken(query: string, email: string): Promise<string | null> {
  if (!databaseUrl) {
    throw new Error('Missing E2E_DATABASE_URL (or DATABASE_URL) for live auth E2E tests.');
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

async function waitForToken(email: string, kind: 'verify' | 'reset'): Promise<string> {
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

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const token = await querySingleToken(query, email);
    if (token) return token;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(`Timed out waiting for ${kind} token for ${email}`);
}

test.describe('Email Auth UI Flows (Live API, minimal mock)', () => {
  test.skip(
    !databaseUrl,
    'Set E2E_DATABASE_URL (or DATABASE_URL) to run live auth E2E.',
  );

  test('signup -> verify email -> signin', async ({ page, browser }) => {
    const email = `e2e.signup.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.getByRole('button', { name: 'Sign Up' }).first().click();

    await page.getByPlaceholder('John Doe').fill('E2E Signup User');
    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Min. 8 characters').fill(password);
    await page.getByLabel(/I agree to the\s*Terms of Service/i).check();
    const signUpResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/signup') &&
        response.request().method() === 'POST',
    );
    await page
      .getByRole('button', { name: 'Create Account & Start 14-Day Trial' })
      .click();
    expect((await signUpResponsePromise).ok()).toBeTruthy();

    await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible();

    const verifyToken = await waitForToken(email, 'verify');
    await page.goto(`/verify-email?token=${encodeURIComponent(verifyToken)}`);
    await page.waitForURL(/\/$/);

    // New incognito tab to force a clean signin form interaction
    const cleanContext = await browser.newContext();
    const cleanPage = await cleanContext.newPage();

    await cleanPage.goto('/');
    await cleanPage.getByRole('button', { name: 'Sign In' }).first().click();
    await cleanPage.getByPlaceholder('john@company.com').fill(email);
    await cleanPage.getByPlaceholder('Enter your password').fill(password);
    await cleanPage.getByRole('button', { name: 'Sign In' }).last().click();

    await expect(cleanPage.getByText('Signed in successfully.')).toBeVisible();
    await cleanContext.close();
  });

  test('forgot password -> reset password -> signin with new password', async ({ page }) => {
    const email = `e2e.reset.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const oldPassword = 'password123';
    const newPassword = 'newpassword123';

    // Seed account via live API
    const signupRes = await page.request.post('/api/auth/signup', {
      data: {
        fullName: 'E2E Reset User',
        email,
        password: oldPassword,
      },
    });
    expect(signupRes.ok()).toBeTruthy();

    const verifyToken = await waitForToken(email, 'verify');
    const verifyRes = await page.request.post('/api/auth/verify-email', {
      data: { token: verifyToken },
    });
    expect(verifyRes.ok()).toBeTruthy();

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.getByRole('button', { name: 'Forgot password?' }).click();

    await page.getByPlaceholder('john@company.com').fill(email);
    const forgotResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/forgot-password') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    expect((await forgotResponsePromise).ok()).toBeTruthy();

    await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible();

    const resetToken = await waitForToken(email, 'reset');
    await page.goto(`/reset-password?token=${encodeURIComponent(resetToken)}`);

    await page
      .locator('input[type="password"]')
      .first()
      .fill(newPassword);
    await page
      .locator('input[type="password"]')
      .nth(1)
      .fill(newPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();

    await expect(page.getByText('Password reset successful. Redirecting to sign in...')).toBeVisible();
    await page.waitForURL(/\/$/);

    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(newPassword);
    await page.getByRole('button', { name: 'Sign In' }).last().click();

    await expect(page.getByText('Signed in successfully.')).toBeVisible();
  });
});
