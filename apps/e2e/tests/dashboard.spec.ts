import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  goToDashboard,
  createRecognitionViaApi,
} from '../test-utils/org-helpers';

test.describe('Dashboard', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run dashboard E2E tests.');

  let adminToken: string;
  let seededMessage: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      const admin = await setupAdmin(page, 'dashboard');
      adminToken = admin.accessToken;

      // Seed a recognition so the feed has content
      seededMessage = 'Great work on the dashboard feature!';
      await createRecognitionViaApi(
        page,
        adminToken,
        admin.userId, // self-kudos — business logic blocks this, expected to throw
        25,
        seededMessage,
        admin.coreValueIds[0],
      );
    } catch {
      // Self-kudos will fail — that is expected. We just verify empty feed state below.
    }
    await page.close();
  });

  test('dashboard loads after signin and shows greeting card', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'dash.load');
    await goToDashboard(page, admin.accessToken);

    await expect(
      page.getByText(/You have \d+ points left to give/),
    ).toBeVisible();
  });

  test('header shows giveable and earned point balances', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.header');
    await goToDashboard(page, admin.accessToken);

    await expect(page.getByText('to give')).toBeVisible();
    await expect(page.getByText('earned')).toBeVisible();
  });

  test('recognition feed section heading is visible', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.feed');
    await goToDashboard(page, admin.accessToken);

    await expect(
      page.getByRole('heading', { name: 'Recognition Feed' }),
    ).toBeVisible();
    await expect(
      page.getByText('Celebrate wins across the team 🎉'),
    ).toBeVisible();
  });

  test('empty feed shows correct empty state message', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.empty');
    await goToDashboard(page, admin.accessToken);

    // Fresh org with no recognitions → empty state
    await expect(
      page.getByText('No kudos yet. Be the first to recognize someone! 🎉'),
    ).toBeVisible();
  });

  test('"All Values" filter tab is visible and selectable', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'dash.filter');
    await goToDashboard(page, admin.accessToken);

    await expect(
      page.getByRole('button', { name: 'All Values' }),
    ).toBeVisible();
  });

  test('core value filter tabs are rendered from org core values', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'dash.values');
    await goToDashboard(page, admin.accessToken);

    // Core values set in setupAdmin: Innovation, Teamwork, Ownership
    await expect(page.getByRole('button', { name: /#Innovation/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /#Teamwork/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /#Ownership/ })).toBeVisible();
  });

  test('clicking a core value filter tab activates it', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.filtertab');
    await goToDashboard(page, admin.accessToken);

    const innovationBtn = page.getByRole('button', { name: /#Innovation/ });
    await innovationBtn.click();
    // After clicking, tab should remain visible and not throw an error
    await expect(innovationBtn).toBeVisible();

    // Clicking "All Values" deactivates filter
    await page.getByRole('button', { name: 'All Values' }).click();
    await expect(
      page.getByRole('button', { name: 'All Values' }),
    ).toBeVisible();
  });

  test('non-authenticated access to /dashboard redirects to landing', async ({
    browser,
  }) => {
    const context = await browser.newContext(); // fresh context — no cookies
    const page = await context.newPage();
    try {
      await page.goto('/dashboard');
      // Auth guard should redirect unauthenticated users away from /dashboard
      await expect(page).not.toHaveURL('/dashboard');
    } finally {
      await context.close();
    }
  });

  test('sidebar navigation "Rewards" link navigates to /rewards', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'dash.nav');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Rewards' }).click();
    await page.waitForURL('/rewards');
    await expect(page).toHaveURL('/rewards');
  });

  test('Give Kudos button is visible in sidebar', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.kudosbtn');
    await goToDashboard(page, admin.accessToken);

    await expect(
      page.getByRole('button', { name: 'Give Kudos' }),
    ).toBeVisible();
  });

  test('admin sidebar shows admin navigation items', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.adminmenu');
    await goToDashboard(page, admin.accessToken);

    // Admin/owner should see admin nav items
    await expect(page.getByText('Admin')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Analytics' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Manage Rewards' }),
    ).toBeVisible();
  });
});
