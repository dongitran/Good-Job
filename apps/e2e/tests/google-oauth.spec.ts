import { expect, test } from '@playwright/test';

const runLiveRedirectCheck = process.env.E2E_LIVE_GOOGLE_REDIRECT === 'true';

test.describe('Google OAuth', () => {
  test('completes simulated Google login flow from modal', async ({ page }) => {
    await page.route('**/api/auth/google', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          location: '/auth/callback#access_token=e2e-google-token',
        },
      });
    });

    // Capture the /auth/me request to verify the token was attached in-memory
    let authorizationHeader: string | null = null;
    await page.route('**/api/auth/me', async (route) => {
      authorizationHeader = route.request().headers()['authorization'] ?? null;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sub: 'user-google-e2e',
          email: 'google.e2e@company.com',
          role: 'member',
          orgId: 'demo-org',
        }),
      });
    });

    // Session restore on load will call /auth/refresh — mock it to return 401
    // so the test starts in a logged-out state without a valid refresh cookie.
    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({ status: 401 });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('button', { name: 'Continue with Google' }).click();

    await expect(page).toHaveURL(/\/$/);

    // Access token must be in-memory (not localStorage) — XSS-safe
    const storedToken = await page.evaluate(() =>
      globalThis.localStorage.getItem('access_token'),
    );
    expect(storedToken).toBeNull();

    // The token from the URL hash must have been attached to the /auth/me request
    expect(authorizationHeader).toBe('Bearer e2e-google-token');

    await page.screenshot({
      path: 'test-results/google-oauth-flow.png',
      fullPage: true,
    });
  });

  test('google auth endpoint responds with redirect', async ({ page }) => {
    test.skip(
      !runLiveRedirectCheck,
      'Set E2E_LIVE_GOOGLE_REDIRECT=true when API is running and reachable.',
    );

    const response = await page.request.get('/api/auth/google', {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);

    const location = response.headers().location ?? '';
    expect(location).toContain('accounts.google.com/o/oauth2');
    expect(location).toContain('client_id=');
  });
});
