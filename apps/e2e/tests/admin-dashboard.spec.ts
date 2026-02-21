import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  setupMember,
  goToDashboard,
  createRecognitionViaApi,
} from '../test-utils/org-helpers';

test.describe('Admin Dashboard (Analytics)', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run admin-dashboard E2E tests.');

  test('Admin can navigate to /admin', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.nav');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });

  test('Member access shows "Admin access required"', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.member');
    const member = await setupMember(page, admin.orgId, 'adm.dash.member');
    await goToDashboard(page, member.accessToken);

    await page.goto('/admin');
    await expect(page.getByText('Admin access required')).toBeVisible();
  });

  test('Stats cards are displayed for admin', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.stats');
    const member = await setupMember(page, admin.orgId, 'adm.dash.stats');

    // Seed some recognitions so analytics has data
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Great teamwork on the sprint!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    await expect(page.getByText('Total Kudos Given')).toBeVisible();
    await expect(page.getByText('Active Users')).toBeVisible();
    await expect(page.getByText('Points Distributed')).toBeVisible();
    await expect(page.getByText('Top Distribution')).toBeVisible();
  });

  test('Time range selector defaults to "Last 30 days"', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.default');
    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    // The select should show "Last 30 days" as selected
    const daysSelect = page.locator('select');
    await expect(daysSelect).toHaveValue('30');
  });

  test('Switching to "Last 7 days" triggers API call with days=7', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.7days');
    const member = await setupMember(page, admin.orgId, 'adm.dash.7days');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Excellent contribution this week!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    const analyticsPromise = page.waitForResponse(
      (r) => r.url().includes('/admin/analytics') && r.url().includes('days=7'),
    );

    await page.locator('select').selectOption('7');

    const response = await analyticsPromise;
    expect(response.status()).toBe(200);
  });

  test('Switching to "Last 90 days" triggers API call with days=90', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.90days');
    const member = await setupMember(page, admin.orgId, 'adm.dash.90days');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Impressive work on the long-term project!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    const analyticsPromise = page.waitForResponse(
      (r) => r.url().includes('/admin/analytics') && r.url().includes('days=90'),
    );

    await page.locator('select').selectOption('90');

    const response = await analyticsPromise;
    expect(response.status()).toBe(200);
  });

  test('Recognition Trend chart section is visible', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.trend');
    const member = await setupMember(page, admin.orgId, 'adm.dash.trend');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Outstanding work on the presentation!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    await expect(page.getByText('Recognition Trend')).toBeVisible();
    await expect(page.getByText('Kudos and points over time')).toBeVisible();
  });

  test('Value Distribution section is visible', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.dist');
    const member = await setupMember(page, admin.orgId, 'adm.dash.dist');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Wonderful collaboration on the project!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    await expect(page.getByText('Value Distribution')).toBeVisible();
    await expect(page.getByText('Core values breakdown')).toBeVisible();
  });

  test('Top Recognizers section shows Givers tab by default', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.givers');
    const member = await setupMember(page, admin.orgId, 'adm.dash.givers');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Fantastic commitment to the team effort!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    await expect(page.getByText('Top Recognizers')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Givers' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Receivers' })).toBeVisible();
  });

  test('Switching to Receivers tab shows receivers list', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.recv');
    const member = await setupMember(page, admin.orgId, 'adm.dash.recv');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Remarkable work on the client deliverable!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    await page.getByRole('button', { name: 'Receivers' }).click();

    // Member who received kudos should appear in the receivers table
    await expect(page.getByText('E2E Member User')).toBeVisible();
  });

  test('Recent Activity section is visible', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.dash.activity');
    const member = await setupMember(page, admin.orgId, 'adm.dash.activity');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Phenomenal work on the final release!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Analytics' }).click();
    await page.waitForURL('/admin');

    await expect(page.getByText('Recent Activity')).toBeVisible();
    // Activity should show admin recognized member
    await expect(page.getByText('E2E Admin User')).toBeVisible();
  });
});
