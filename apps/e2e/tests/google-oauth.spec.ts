import { expect, test } from '@playwright/test';

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
});
