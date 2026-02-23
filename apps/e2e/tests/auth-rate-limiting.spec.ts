import { expect, test } from '@playwright/test';
import { apiBaseURL } from '../playwright.config';
import { databaseUrl, uniqueEmail } from '../test-utils/auth-helpers';

test.describe('Auth endpoint rate limiting', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run auth rate-limiting tests.');
  test.skip(!apiBaseURL, 'Set E2E_API_BASE_URL to run auth rate-limiting tests.');

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

  test('forgot-password rate limit is per email+IP (different emails are independent)', async ({
    page,
  }) => {
    const email1 = uniqueEmail('ratelimit', 'forgot-a');
    const email2 = uniqueEmail('ratelimit', 'forgot-b');

    // Exhaust limit for email1
    for (let i = 0; i < 3; i++) {
      const attempt = await page.request.post(
        `${apiBaseURL}/auth/forgot-password`,
        { data: { email: email1 } },
      );
      expect(attempt.status()).toBe(200);
    }

    // email1 should be blocked
    const blocked = await page.request.post(
      `${apiBaseURL}/auth/forgot-password`,
      { data: { email: email1 } },
    );
    expect(blocked.status()).toBe(429);

    // email2 should still work (different email+IP key)
    const allowed = await page.request.post(
      `${apiBaseURL}/auth/forgot-password`,
      { data: { email: email2 } },
    );
    expect(allowed.status()).not.toBe(429);
  });
});
