import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import { setupAdmin, goToDashboard } from '../test-utils/org-helpers';
import { apiBaseURL } from '../playwright.config';

test.describe('Settings Page', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run settings E2E tests.');

  test('Settings page loads with Profile tab active by default', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.load');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Personal Information')).toBeVisible();
  });

  test('Profile tab shows current user full name and email', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.profile.data');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');

    // Full name input is pre-populated
    await expect(page.getByLabel('Full Name')).toHaveValue('E2E Admin User');
    // Email input is disabled and pre-populated
    const emailInput = page.getByLabel('Email Address');
    await expect(emailInput).toBeDisabled();
    await expect(emailInput).toHaveValue(admin.email);
  });

  test('Save Changes button is disabled when full name is unchanged', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.profile.btn');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');

    await expect(page.getByLabel('Full Name')).toHaveValue('E2E Admin User');
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  });

  test('Save Changes button is enabled after editing full name', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.profile.enable');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');

    await page.getByLabel('Full Name').fill('Updated Name');
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
  });

  test('Profile update saves successfully via PATCH /users/me', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.profile.save');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');

    await page.getByLabel('Full Name').fill('Updated E2E Name');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Profile updated successfully!')).toBeVisible();
  });

  test('PATCH /users/me API returns updated full name', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.api.patch');
    const newName = 'API Updated Name';

    const res = await page.request.patch(`${apiBaseURL}/users/me`, {
      data: { fullName: newName },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { fullName: string; email: string };
    expect(body.fullName).toBe(newName);
    expect(body.email).toBe(admin.email);
  });

  test('GET /users/me API returns current user data', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.api.get');

    const res = await page.request.get(`${apiBaseURL}/users/me`, {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { fullName: string; email: string; id: string };
    expect(body.fullName).toBe('E2E Admin User');
    expect(body.email).toBe(admin.email);
    expect(body.id).toBe(admin.userId);
  });

  test('Settings page shows Security tab', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.security.tab');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');

    await page.getByRole('button', { name: 'Security' }).click();

    await expect(page.getByText('Change Password')).toBeVisible();
    await expect(page.getByLabel('Current Password')).toBeVisible();
    await expect(page.getByLabel('New Password')).toBeVisible();
    await expect(page.getByLabel('Confirm New Password')).toBeVisible();
  });

  test('Mismatched passwords shows error toast without API call', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.security.mismatch');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');
    await page.getByRole('button', { name: 'Security' }).click();

    await page.getByLabel('Current Password').fill('password123');
    await page.getByLabel('New Password').fill('newpassword123');
    await page.getByLabel('Confirm New Password').fill('differentpassword456');

    // Intercept API to ensure no call is made
    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/auth/change-password')) apiCalled = true;
    });

    await page.getByRole('button', { name: 'Update Password' }).click();

    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  test('Wrong current password shows error toast', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.security.wrong');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');
    await page.getByRole('button', { name: 'Security' }).click();

    await page.getByLabel('Current Password').fill('wrongpassword');
    await page.getByLabel('New Password').fill('newpassword123');
    await page.getByLabel('Confirm New Password').fill('newpassword123');

    await page.getByRole('button', { name: 'Update Password' }).click();

    await expect(
      page.getByText('Failed to change password. Check your current password.'),
    ).toBeVisible();
  });

  test('POST /auth/change-password API changes password successfully', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.security.api');

    const res = await page.request.post(`${apiBaseURL}/auth/change-password`, {
      data: { currentPassword: 'password123', newPassword: 'newPassword456!' },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain('Password changed');
  });

  test('POST /auth/change-password rejects wrong current password with 401', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.security.reject');

    const res = await page.request.post(`${apiBaseURL}/auth/change-password`, {
      data: { currentPassword: 'wrongpassword', newPassword: 'newPassword456!' },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    expect(res.status()).toBe(401);
  });

  test('Settings navigation tabs are visible', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.nav');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');

    await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Appearance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Security' })).toBeVisible();
  });
});
