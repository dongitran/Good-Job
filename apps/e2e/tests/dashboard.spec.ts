import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  setupMember,
  goToDashboard,
  createRecognitionViaApi,
} from '../test-utils/org-helpers';

test.describe('Dashboard', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run dashboard E2E tests.');

  test('dashboard loads after signin and shows greeting card', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'dash.load');
    await goToDashboard(page, admin.email, admin.password);

    await expect(
      page.getByText(/You have \d+ points left to give/),
    ).toBeVisible();
  });

  test('header shows giveable and earned point balances', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.header');
    await goToDashboard(page, admin.email, admin.password);

    // Scope to header to avoid matching GreetingCard's "left to give" text
    const header = page.locator('header');
    await expect(header.getByText('to give')).toBeVisible();
    await expect(header.getByText('earned')).toBeVisible();
  });

  test('recognition feed section heading is visible', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.feed');
    await goToDashboard(page, admin.email, admin.password);

    await expect(
      page.getByRole('heading', { name: 'Recognition Feed' }),
    ).toBeVisible();
    await expect(
      page.getByText('Celebrate wins across the team 🎉'),
    ).toBeVisible();
  });

  test('empty feed shows correct empty state message', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.empty');
    await goToDashboard(page, admin.email, admin.password);

    // Fresh org with no recognitions → empty state
    await expect(
      page.getByText('No kudos yet. Be the first to recognize someone! 🎉'),
    ).toBeVisible();
  });

  test('"All Values" filter tab is visible and selectable', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'dash.filter');
    await goToDashboard(page, admin.email, admin.password);

    await expect(
      page.getByRole('button', { name: 'All Values' }),
    ).toBeVisible();
  });

  test('core value filter tabs are rendered from org core values', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'dash.values');
    await goToDashboard(page, admin.email, admin.password);

    // Core values set in setupAdmin: Innovation, Teamwork, Ownership
    await expect(page.getByRole('button', { name: /#Innovation/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /#Teamwork/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /#Ownership/ })).toBeVisible();
  });

  test('clicking a core value filter tab activates it', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.filtertab');
    await goToDashboard(page, admin.email, admin.password);

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

  test('recognition feed shows kudos message after seeding via API', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.seeded');
    const member = await setupMember(page, admin.orgId, 'dash.seeded');
    const seededMessage = 'Seeded kudos for dashboard feed test!';
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      seededMessage,
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.email, admin.password);

    await expect(page.getByText(seededMessage)).toBeVisible();
  });

  test('core value filter shows only matching kudos', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.cvfilter');
    const member = await setupMember(page, admin.orgId, 'dash.cvfilter');

    // Seed one kudos for each of the first two core values
    const [innovationId, teamworkId] = admin.coreValueIds;
    const innovationMsg = 'Innovation kudos for filter test twelve chars';
    const teamworkMsg = 'Teamwork kudos for filter test twelve chars!!';
    await createRecognitionViaApi(page, admin.accessToken, member.userId, 25, innovationMsg, innovationId);
    await createRecognitionViaApi(page, admin.accessToken, member.userId, 25, teamworkMsg, teamworkId);

    await goToDashboard(page, admin.email, admin.password);

    // Both visible with "All Values"
    await expect(page.getByText(innovationMsg)).toBeVisible();
    await expect(page.getByText(teamworkMsg)).toBeVisible();

    // Filter by Innovation — only innovation kudos should show
    await page.getByRole('button', { name: /#Innovation/ }).click();
    await expect(page.getByText(innovationMsg)).toBeVisible();
    await expect(page.getByText(teamworkMsg)).not.toBeVisible();

    // Switch back to "All Values" — both visible again
    await page.getByRole('button', { name: 'All Values' }).click();
    await expect(page.getByText(teamworkMsg)).toBeVisible();
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
    isMobile,
  }) => {
    // Sidebar is only visible on desktop (md: breakpoint and above)
    test.skip(isMobile, 'Sidebar navigation is desktop-only (hidden md:flex)');

    const admin = await setupAdmin(page, 'dash.nav');
    await goToDashboard(page, admin.email, admin.password);

    // Use exact:true to avoid also matching "Manage Rewards" button in the sidebar
    await page.locator('aside').getByRole('button', { name: 'Rewards', exact: true }).click();
    await expect(page).toHaveURL('/rewards');
  });

  test('Give Kudos button is visible in sidebar', async ({ page }) => {
    const admin = await setupAdmin(page, 'dash.kudosbtn');
    await goToDashboard(page, admin.email, admin.password);

    // Both Sidebar and GreetingCard have a "Give Kudos" button.
    // On mobile, sidebar (aside) is hidden (md:flex) — use .first() to get either visible button.
    await expect(
      page.getByRole('button', { name: 'Give Kudos' }).first(),
    ).toBeVisible();
  });

  test('admin sidebar shows admin navigation items', async ({ page, isMobile }) => {
    // Sidebar is only visible on desktop (md: breakpoint and above)
    test.skip(isMobile, 'Sidebar navigation is desktop-only (hidden md:flex)');

    const admin = await setupAdmin(page, 'dash.adminmenu');
    await goToDashboard(page, admin.email, admin.password);

    // Sidebar admin section heading is "Admin" — scope to aside, exact match to avoid
    // matching "E2E Admin User" (user fullname) or email containing "admin"
    const sidebar = page.locator('aside');
    await expect(sidebar.getByText('Admin', { exact: true })).toBeVisible();
    await expect(
      sidebar.getByRole('button', { name: 'Analytics' }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole('button', { name: 'Manage Rewards' }),
    ).toBeVisible();
  });

  test('sidebar does NOT show Profile as top-level nav item', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar navigation is desktop-only (hidden md:flex)');

    const admin = await setupAdmin(page, 'dash.noprofile');
    await goToDashboard(page, admin.email, admin.password);

    const sidebar = page.locator('aside');
    // Profile should NOT appear as a direct navigation button in the sidebar nav
    await expect(sidebar.locator('nav').getByRole('button', { name: 'Profile' })).not.toBeVisible();
  });

  test('sidebar does NOT show Settings as top-level nav item', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar navigation is desktop-only (hidden md:flex)');

    const admin = await setupAdmin(page, 'dash.nosettings');
    await goToDashboard(page, admin.email, admin.password);

    const sidebar = page.locator('aside');
    // Settings should NOT appear as a direct navigation button in the sidebar nav
    await expect(sidebar.locator('nav').getByRole('button', { name: 'Settings' })).not.toBeVisible();
  });

  test('clicking account card opens dropdown with Profile and Settings', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar navigation is desktop-only (hidden md:flex)');

    const admin = await setupAdmin(page, 'dash.accdropdown');
    await goToDashboard(page, admin.email, admin.password);

    // Click the account card at the bottom of the sidebar
    await page.getByTestId('account-card').click();

    // Dropdown should show Profile and Settings
    await expect(page.getByTestId('account-profile')).toBeVisible();
    await expect(page.getByTestId('account-settings')).toBeVisible();
  });

  test('clicking Profile in dropdown navigates to /profile', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar navigation is desktop-only (hidden md:flex)');

    const admin = await setupAdmin(page, 'dash.dropprofile');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByTestId('account-card').click();
    await page.getByTestId('account-profile').click();
    await page.waitForURL('/profile');
    await expect(page).toHaveURL('/profile');
  });

  test('clicking Settings in dropdown navigates to /settings', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Sidebar navigation is desktop-only (hidden md:flex)');

    const admin = await setupAdmin(page, 'dash.dropsettings');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByTestId('account-card').click();
    await page.getByTestId('account-settings').click();
    await page.waitForURL('/settings');
    await expect(page).toHaveURL('/settings');
  });
});
