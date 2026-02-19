import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { expect, test } from '@playwright/test';
import { apiBaseURL } from '../playwright.config';

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
        response.url().includes('/auth/signup') &&
        response.request().method() === 'POST',
    );
    await page
      .getByRole('button', { name: 'Create Account & Start 14-Day Trial' })
      .click();
    expect((await signUpResponsePromise).ok()).toBeTruthy();

    await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible();

    const verifyToken = await waitForToken(email, 'verify');
    await page.goto(`/verify-email?token=${encodeURIComponent(verifyToken)}`);
    await page.getByRole('button', { name: 'Go to Sign In' }).click();
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

  test('signup -> signin before verify email is blocked', async ({ page }) => {
    const email = `e2e.unverified.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.getByRole('button', { name: 'Sign Up' }).first().click();

    await page.getByPlaceholder('John Doe').fill('E2E Unverified User');
    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Min. 8 characters').fill(password);
    await page.getByLabel(/I agree to the\s*Terms of Service/i).check();

    const signUpResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/signup') &&
        response.request().method() === 'POST',
    );
    await page
      .getByRole('button', { name: 'Create Account & Start 14-Day Trial' })
      .click();
    expect((await signUpResponsePromise).ok()).toBeTruthy();

    // Try signing in immediately without visiting /verify-email
    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).last().click();

    await expect(
      page.getByText(
        'Email is not verified. Please check your inbox for the verification link.',
      ),
    ).toBeVisible();
  });

  test('signup with existing email shows conflict error', async ({ page }) => {
    const email = `e2e.duplicate.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    const seedRes = await page.request.post(`${apiBaseURL}/auth/signup`, {
      data: {
        fullName: 'E2E Existing User',
        email,
        password,
      },
    });
    expect(seedRes.ok()).toBeTruthy();

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.getByRole('button', { name: 'Sign Up' }).first().click();

    await page.getByPlaceholder('John Doe').fill('E2E Duplicate User');
    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Min. 8 characters').fill(password);
    await page.getByLabel(/I agree to the\s*Terms of Service/i).check();
    await page
      .getByRole('button', { name: 'Create Account & Start 14-Day Trial' })
      .click();

    await expect(page.getByText('Email is already registered.')).toBeVisible();
  });

  test('unverified signin can resend verification email', async ({ page }) => {
    const email = `e2e.resend.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.getByRole('button', { name: 'Sign Up' }).first().click();

    await page.getByPlaceholder('John Doe').fill('E2E Resend User');
    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Min. 8 characters').fill(password);
    await page.getByLabel(/I agree to the\s*Terms of Service/i).check();
    await page
      .getByRole('button', { name: 'Create Account & Start 14-Day Trial' })
      .click();

    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).last().click();
    await expect(
      page.getByText(
        'Email is not verified. Please check your inbox for the verification link.',
      ),
    ).toBeVisible();

    const resendResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/resend-verification') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Resend verification email' }).click();
    expect((await resendResponsePromise).ok()).toBeTruthy();
    await expect(
      page.getByText('Verification email resent. Please check your inbox.'),
    ).toBeVisible();
  });

  test('verify email page shows error for invalid token', async ({ page }) => {
    await page.goto('/verify-email?token=invalid-token');

    await expect(page.getByText('Invalid or expired verification token.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Sign In' })).toBeVisible();
  });

  test('reset password page shows error for invalid token', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token');

    await page.locator('input[type="password"]').first().fill('newpassword123');
    await page.locator('input[type="password"]').nth(1).fill('newpassword123');
    await page.getByRole('button', { name: 'Reset Password' }).click();

    await expect(page.getByText('Invalid or expired reset token.')).toBeVisible();
  });

  test('forgot password -> reset password -> signin with new password', async ({ page }) => {
    const email = `e2e.reset.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const oldPassword = 'password123';
    const newPassword = 'newpassword123';

    // Seed account via live API
    const signupRes = await page.request.post(`${apiBaseURL}/auth/signup`, {
      data: {
        fullName: 'E2E Reset User',
        email,
        password: oldPassword,
      },
    });
    expect(signupRes.ok()).toBeTruthy();

    const verifyToken = await waitForToken(email, 'verify');
    const verifyRes = await page.request.post(`${apiBaseURL}/auth/verify-email`, {
      data: { token: verifyToken },
    });
    expect(verifyRes.ok()).toBeTruthy();

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.getByRole('button', { name: 'Forgot password?' }).click();

    await page.getByPlaceholder('john@company.com').fill(email);
    const forgotResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/forgot-password') &&
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
    await page.getByPlaceholder('Enter your password').fill(oldPassword);
    await page.getByRole('button', { name: 'Sign In' }).last().click();
    await expect(page.getByText('Invalid email or password.')).toBeVisible();

    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(newPassword);
    await page.getByRole('button', { name: 'Sign In' }).last().click();

    await expect(page.getByText('Signed in successfully.')).toBeVisible();
  });

  test('reset password token is single-use', async ({ page }) => {
    const email = `e2e.reset-once.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const oldPassword = 'password123';
    const newPassword = 'newpassword123';

    const signupRes = await page.request.post(`${apiBaseURL}/auth/signup`, {
      data: {
        fullName: 'E2E Reset Once User',
        email,
        password: oldPassword,
      },
    });
    expect(signupRes.ok()).toBeTruthy();

    const verifyToken = await waitForToken(email, 'verify');
    const verifyRes = await page.request.post(`${apiBaseURL}/auth/verify-email`, {
      data: { token: verifyToken },
    });
    expect(verifyRes.ok()).toBeTruthy();

    const forgotRes = await page.request.post(`${apiBaseURL}/auth/forgot-password`, {
      data: { email },
    });
    expect(forgotRes.ok()).toBeTruthy();

    const resetToken = await waitForToken(email, 'reset');

    await page.goto(`/reset-password?token=${encodeURIComponent(resetToken)}`);
    await page.locator('input[type="password"]').first().fill(newPassword);
    await page.locator('input[type="password"]').nth(1).fill(newPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText('Password reset successful. Redirecting to sign in...')).toBeVisible();

    await page.goto(`/reset-password?token=${encodeURIComponent(resetToken)}`);
    await page.locator('input[type="password"]').first().fill('anotherpass123');
    await page.locator('input[type="password"]').nth(1).fill('anotherpass123');
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText('Invalid or expired reset token.')).toBeVisible();
  });

  test('session is restored via refresh cookie after page reload', async ({ page }) => {
    const email = `e2e.restore.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    const signUpRes = await page.request.post(`${apiBaseURL}/auth/signup`, {
      data: {
        fullName: 'E2E Session Restore User',
        email,
        password,
      },
    });
    expect(signUpRes.ok()).toBeTruthy();

    const verifyToken = await waitForToken(email, 'verify');
    const verifyRes = await page.request.post(`${apiBaseURL}/auth/verify-email`, {
      data: { token: verifyToken },
    });
    expect(verifyRes.ok()).toBeTruthy();

    const signInRes = await page.request.post(`${apiBaseURL}/auth/signin`, {
      data: { email, password },
    });
    expect(signInRes.ok()).toBeTruthy();
    const { accessToken } = await signInRes.json();
    expect(typeof accessToken).toBe('string');

    await page.goto(`/auth/callback#access_token=${encodeURIComponent(accessToken)}`);
    // New users haven't completed onboarding → AuthCallback redirects to /onboarding
    await expect(page).toHaveURL('/onboarding');

    const refreshResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/refresh') &&
        response.request().method() === 'POST',
    );
    await page.reload();
    const refreshResponse = await refreshResponsePromise;
    expect(refreshResponse.status()).toBe(200);
  });

  test('logout revokes refresh session and reload can no longer refresh', async ({ page }) => {
    const email = `e2e.logout.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    const signUpRes = await page.request.post(`${apiBaseURL}/auth/signup`, {
      data: {
        fullName: 'E2E Logout User',
        email,
        password,
      },
    });
    expect(signUpRes.ok()).toBeTruthy();

    const verifyToken = await waitForToken(email, 'verify');
    const verifyRes = await page.request.post(`${apiBaseURL}/auth/verify-email`, {
      data: { token: verifyToken },
    });
    expect(verifyRes.ok()).toBeTruthy();

    const signInRes = await page.request.post(`${apiBaseURL}/auth/signin`, {
      data: { email, password },
    });
    expect(signInRes.ok()).toBeTruthy();
    const { accessToken } = await signInRes.json();
    expect(typeof accessToken).toBe('string');

    const logoutRes = await page.request.post(`${apiBaseURL}/auth/logout`, {
      headers: { Authorization: `Bearer ${String(accessToken)}` },
    });
    expect(logoutRes.ok()).toBeTruthy();

    const refreshResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/refresh') &&
        response.request().method() === 'POST',
    );
    await page.goto('/');
    const refreshResponse = await refreshResponsePromise;
    expect(refreshResponse.status()).toBe(401);
  });
});
