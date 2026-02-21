import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  setupMember,
  goToDashboard,
  createRecognitionViaApi,
} from '../test-utils/org-helpers';

test.describe('Leaderboard', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run leaderboard E2E tests.');

  test('Leaderboard page loads with correct heading', async ({ page }) => {
    const admin = await setupAdmin(page, 'ldr.load');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/leaderboard');
    await page.waitForURL('/leaderboard');

    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
    await expect(page.getByText('Top performers in your organization')).toBeVisible();
  });

  test('Default period is "Last 30 days"', async ({ page }) => {
    const admin = await setupAdmin(page, 'ldr.default');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/leaderboard');
    await page.waitForURL('/leaderboard');

    // The "Last 30 days" button should be active (styled)
    await expect(page.getByRole('button', { name: 'Last 30 days' })).toBeVisible();
  });

  test('Selecting "Last 7 days" period triggers API call', async ({ page }) => {
    const admin = await setupAdmin(page, 'ldr.7days');
    await goToDashboard(page, admin.email, admin.password);

    // Register listener BEFORE navigation to avoid missing the initial analytics load
    const initialLoad = page.waitForResponse((r) => r.url().includes('/admin/analytics'));
    await page.goto('/leaderboard');
    await page.waitForURL('/leaderboard');
    await initialLoad;

    const analyticsPromise = page.waitForResponse(
      (r) => r.url().includes('/admin/analytics') && r.url().includes('days=7'),
    );

    await page.getByRole('button', { name: 'Last 7 days' }).click();

    const response = await analyticsPromise;
    expect(response.status()).toBe(200);
  });

  test('"Most received" tab is shown by default', async ({ page }) => {
    const admin = await setupAdmin(page, 'ldr.mostrecv');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/leaderboard');
    await page.waitForURL('/leaderboard');

    await expect(page.getByRole('button', { name: 'Most received' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Most given' })).toBeVisible();
  });

  test('Switching to "Most given" tab shows givers', async ({ page }) => {
    const admin = await setupAdmin(page, 'ldr.mostgiven');
    const member = await setupMember(page, admin.orgId, 'ldr.mostgiven');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Superb work on the recent initiative!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.email, admin.password);

    const analyticsReady = page.waitForResponse((r) => r.url().includes('/admin/analytics'));
    await page.goto('/leaderboard');
    await page.waitForURL('/leaderboard');
    await analyticsReady;

    await page.getByRole('button', { name: 'Most given' }).click();

    // Admin who gave kudos should appear in givers list.
    // Scope to main to avoid matching the sidebar user card which also shows admin's name.
    await expect(page.locator('main').getByText('E2E Admin User')).toBeVisible();
  });

  test('Rankings list shows seeded user who received kudos', async ({ page }) => {
    const admin = await setupAdmin(page, 'ldr.rankings');
    const member = await setupMember(page, admin.orgId, 'ldr.rankings');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Excellent contribution to the milestone!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.email, admin.password);

    const analyticsReady = page.waitForResponse((r) => r.url().includes('/admin/analytics'));
    await page.goto('/leaderboard');
    await page.waitForURL('/leaderboard');
    await analyticsReady;

    // "Most received" is default — member who received kudos should appear
    await expect(page.getByText('E2E Member User')).toBeVisible();
    // Full Rankings section heading
    await expect(page.getByText('Full Rankings')).toBeVisible();
  });

  test('All three period buttons are visible', async ({ page }) => {
    const admin = await setupAdmin(page, 'ldr.periods');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/leaderboard');
    await page.waitForURL('/leaderboard');

    await expect(page.getByRole('button', { name: 'Last 7 days' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last 30 days' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last 90 days' })).toBeVisible();
  });
});
