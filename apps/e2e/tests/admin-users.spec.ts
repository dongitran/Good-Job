import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  setupMember,
  goToDashboard,
} from '../test-utils/org-helpers';

test.describe('Admin Users (Team Members)', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run admin-users E2E tests.');

  test('Admin can navigate to /admin/users', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.nav');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Team Members' }).click();
    await page.waitForURL('/admin/users');

    await expect(page.getByRole('heading', { name: 'Team Members' })).toBeVisible();
    await expect(
      page.getByText('Manage team members and view recognition activity'),
    ).toBeVisible();
  });

  test('Member cannot access /admin/users', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.member');
    const member = await setupMember(page, admin.orgId, 'adm.usr.member');
    await goToDashboard(page, member.accessToken);

    await page.goto('/admin/users');

    await expect(page.getByText('Admin access required')).toBeVisible();
  });

  test('Stats cards display on team members page', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.stats');
    await setupMember(page, admin.orgId, 'adm.usr.stats');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Team Members' }).click();
    await page.waitForURL('/admin/users');

    await expect(page.getByText('Total Members')).toBeVisible();
    await expect(page.getByText('Admins')).toBeVisible();
    await expect(page.getByText('Top Receiver')).toBeVisible();
    await expect(page.getByText('Most Kudos')).toBeVisible();
  });

  test('User table shows both org members', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.table');
    await setupMember(page, admin.orgId, 'adm.usr.table');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Team Members' }).click();
    await page.waitForURL('/admin/users');

    await expect(page.getByText('E2E Admin User')).toBeVisible();
    await expect(page.getByText('E2E Member User')).toBeVisible();
  });

  test('Search by member name filters the table', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.search');
    await setupMember(page, admin.orgId, 'adm.usr.search');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Team Members' }).click();
    await page.waitForURL('/admin/users');

    await page.getByPlaceholder('Search members...').fill('E2E Member');

    await expect(page.getByText('E2E Member User')).toBeVisible();
    await expect(page.getByText('E2E Admin User')).not.toBeVisible();
  });

  test('Role filter shows only members', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.rolefilter');
    await setupMember(page, admin.orgId, 'adm.usr.rolefilter');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Team Members' }).click();
    await page.waitForURL('/admin/users');

    // Filter by "Member" role
    await page.locator('select').first().selectOption('member');

    await expect(page.getByText('E2E Member User')).toBeVisible();
    await expect(page.getByText('E2E Admin User')).not.toBeVisible();
  });

  test('Sort dropdown options are available', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.sort');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Team Members' }).click();
    await page.waitForURL('/admin/users');

    // Sort select is the second select (first is role filter)
    const sortSelect = page.locator('select').last();
    await expect(sortSelect).toBeVisible();

    // Verify options exist
    await expect(sortSelect.locator('option', { hasText: 'Sort: Join Date' })).toBeAttached();
    await expect(
      sortSelect.locator('option', { hasText: 'Sort: Kudos Received' }),
    ).toBeAttached();
    await expect(sortSelect.locator('option', { hasText: 'Sort: Points Earned' })).toBeAttached();
  });

  test('User row shows correct role badge', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.role');
    await setupMember(page, admin.orgId, 'adm.usr.role');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Team Members' }).click();
    await page.waitForURL('/admin/users');

    // Admin row should show "owner" badge (first user is the org creator = owner)
    await expect(page.getByText('owner')).toBeVisible();
    // Member row should show "member" badge
    await expect(page.getByText('member')).toBeVisible();
  });
});
