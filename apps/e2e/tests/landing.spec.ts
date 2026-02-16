import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders hero content and CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Good Job' })).toBeVisible();
    await expect(page.getByText('Internal Recognition & Reward Platform')).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Get Started',
      }),
    ).toBeVisible();
  });

  test('has stable page metadata', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('web');
    await expect(page).toHaveURL(/\/$/);
  });
});
