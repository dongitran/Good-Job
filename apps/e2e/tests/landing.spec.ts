import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads without client-side exceptions', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Good Job' })).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

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

  test('CTA is interactive and keeps route stable', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Good Job' })).toBeVisible();
  });

  test('has stable page metadata', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('web');
    await expect(page).toHaveURL(/\/$/);
  });
});
