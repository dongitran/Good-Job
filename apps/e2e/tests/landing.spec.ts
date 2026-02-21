import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads without client-side exceptions', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Recognize\.\s*Reward\.\s*Celebrate\./ }),
    ).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test('renders hero content and CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Recognize\./ })).toBeVisible();
    await expect(
      page.getByText('The modern way to appreciate your team.', { exact: false }),
    ).toBeVisible();
    const heroSection = page.locator('section').first();
    await expect(heroSection.getByRole('button', { name: 'Start Free Trial' })).toBeVisible();
  });

  test('header CTA opens auth modal and keeps route stable', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Recognition & Reward Platform')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('has stable page metadata', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Good Job');
    await expect(page).toHaveURL(/\/$/);
  });
});
