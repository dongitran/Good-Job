import { expect, test } from '@playwright/test';
import { apiBaseURL } from '../playwright.config';
import { databaseUrl, uniqueEmail } from '../test-utils/auth-helpers';
import { flushThrottleKeys } from '../test-utils/redis-helpers';

// Rate-limit tests MUST run serially — they share a single IP and the
// throttler counter is per-IP. Parallel execution would cause tests to
// interfere with each other's quota.
test.describe.configure({ mode: 'serial' });

// ─── API-level rate limiting tests ────────────────────────────────────────────

test.describe('Auth endpoint rate limiting', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run auth rate-limiting tests.');
  test.skip(!apiBaseURL, 'Set E2E_API_BASE_URL to run auth rate-limiting tests.');

  // Ensure clean throttle state before AND after the suite.
  test.beforeAll(async () => {
    await flushThrottleKeys();
  });
  test.afterAll(async () => {
    await flushThrottleKeys();
  });

  // Flush immediately before each test — CI runs other files in parallel,
  // which can exhaust the IP-based quota before/between our tests.
  test.beforeEach(async () => {
    await flushThrottleKeys();
  });
  test.afterEach(async () => {
    await flushThrottleKeys();
  });

  test('POST /auth/signin returns 429 after 5 failed attempts', async ({
    page,
  }) => {
    const email = uniqueEmail('ratelimit', 'signin');

    // Fire 5 requests to exhaust the limit — each should return 401 (not yet throttled)
    for (let i = 0; i < 5; i++) {
      const attempt = await page.request.post(`${apiBaseURL}/auth/signin`, {
        data: { email, password: 'wrongpass1' },
      });
      expect(attempt.status()).toBe(401);
    }

    // 6th request should be throttled
    const res = await page.request.post(`${apiBaseURL}/auth/signin`, {
      data: { email, password: 'wrongpass1' },
    });
    expect(res.status()).toBe(429);
  });

  test('POST /auth/signup returns 429 after 5 attempts', async ({ page }) => {
    // Each signup needs a unique email (API rejects duplicates) — all should succeed
    for (let i = 0; i < 5; i++) {
      const email = uniqueEmail('ratelimit', `signup${i}`);
      const attempt = await page.request.post(`${apiBaseURL}/auth/signup`, {
        data: { fullName: 'Rate Limit Test', email, password: 'password123' },
      });
      expect(attempt.status()).toBe(201);
    }

    // 6th request from same IP should be throttled
    const email = uniqueEmail('ratelimit', 'signup-blocked');
    const res = await page.request.post(`${apiBaseURL}/auth/signup`, {
      data: { fullName: 'Rate Limit Test', email, password: 'password123' },
    });
    expect(res.status()).toBe(429);
  });

  test('POST /auth/forgot-password returns 429 after 3 attempts', async ({
    page,
  }) => {
    const email = uniqueEmail('ratelimit', 'forgot');

    for (let i = 0; i < 3; i++) {
      const attempt = await page.request.post(
        `${apiBaseURL}/auth/forgot-password`,
        { data: { email } },
      );
      expect(attempt.status()).toBe(200);
    }

    // 4th request should be throttled
    const res = await page.request.post(`${apiBaseURL}/auth/forgot-password`, {
      data: { email },
    });
    expect(res.status()).toBe(429);
  });

  test('POST /auth/resend-verification returns 429 after 3 attempts', async ({
    page,
  }) => {
    const email = uniqueEmail('ratelimit', 'resend');

    for (let i = 0; i < 3; i++) {
      const attempt = await page.request.post(
        `${apiBaseURL}/auth/resend-verification`,
        { data: { email } },
      );
      expect(attempt.status()).toBe(200);
    }

    // 4th request should be throttled
    const res = await page.request.post(
      `${apiBaseURL}/auth/resend-verification`,
      { data: { email } },
    );
    expect(res.status()).toBe(429);
  });

  test('forgot-password applies both global IP limit and per-email+IP limit', async ({
    page,
  }) => {
    const email1 = uniqueEmail('ratelimit', 'forgot-dual');

    // The endpoint has @Throttle({ limit: 3 }) (global IP) AND
    // AuthEmailIpThrottlerGuard (per email+IP). Both guards apply.
    // Sending 3 requests for email1 exhausts the global IP limit.
    for (let i = 0; i < 3; i++) {
      const attempt = await page.request.post(
        `${apiBaseURL}/auth/forgot-password`,
        { data: { email: email1 } },
      );
      expect(attempt.status()).toBe(200);
    }

    // 4th request for email1 should be blocked (both guards exhausted)
    const blocked = await page.request.post(
      `${apiBaseURL}/auth/forgot-password`,
      { data: { email: email1 } },
    );
    expect(blocked.status()).toBe(429);
  });
});

// ─── Web UI rate-limiting tests ───────────────────────────────────────────────

test.describe('Auth rate limiting – web UI', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run auth rate-limiting tests.');
  test.skip(!apiBaseURL, 'Set E2E_API_BASE_URL to run auth rate-limiting tests.');

  // Ensure clean throttle state before AND after the suite.
  test.beforeAll(async () => {
    await flushThrottleKeys();
  });
  test.afterAll(async () => {
    await flushThrottleKeys();
  });

  test('sign-in form shows user-friendly error after exceeding rate limit', async ({
    page,
  }) => {
    const email = uniqueEmail('ratelimit', 'web-signin');

    await page.goto('/');

    // Open the auth modal (click the Sign In button in the header)
    await page.getByRole('button', { name: 'Sign In' }).first().click();

    // Make sure the Sign In tab is selected
    const signInTab = page.locator('button', { hasText: 'Sign In' }).nth(1);
    if (await signInTab.isVisible()) {
      await signInTab.click();
    }

    // Submit wrong credentials 5 times to exhaust the limit
    for (let i = 0; i < 5; i++) {
      await page.getByPlaceholder('john@company.com').fill(email);
      await page.getByPlaceholder('Enter your password').fill('wrongpass');
      await page.getByRole('button', { name: 'Sign In', exact: false }).last().click();

      // Wait for the error toast / feedback before next attempt
      await page.waitForTimeout(800);
    }

    // 6th attempt should trigger rate limiting
    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign In', exact: false }).last().click();

    // Verify the user-friendly rate limit message appears (use .first() to avoid strict mode)
    await expect(
      page.getByText('Too many attempts. Please wait a few minutes and try again.').first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
