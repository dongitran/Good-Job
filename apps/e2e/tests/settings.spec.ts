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

    // Scope to main to avoid matching the sidebar's nav buttons (Profile, Security etc. exist in both sidebar and settings tabs)
    const main = page.locator('main');
    await main.getByRole('button', { name: 'Security' }).click();

    await expect(page.getByText('Change Password')).toBeVisible();
    await expect(page.getByLabel('Current Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('New Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm New Password', { exact: true })).toBeVisible();
  });

  test('Mismatched passwords shows error toast without API call', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.security.mismatch');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');
    await page.locator('main').getByRole('button', { name: 'Security' }).click();

    await page.getByLabel('Current Password', { exact: true }).fill('password123');
    await page.getByLabel('New Password', { exact: true }).fill('newpassword123');
    await page.getByLabel('Confirm New Password', { exact: true }).fill('differentpassword456');

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
    await page.locator('main').getByRole('button', { name: 'Security' }).click();

    await page.getByLabel('Current Password', { exact: true }).fill('wrongpassword');
    await page.getByLabel('New Password', { exact: true }).fill('newpassword123');
    await page.getByLabel('Confirm New Password', { exact: true }).fill('newpassword123');

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

    // Scope to main to avoid conflicts with the sidebar nav which also has Profile/Security buttons
    const main = page.locator('main');
    await expect(main.getByRole('button', { name: 'Profile' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Notifications' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Appearance' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Security' })).toBeVisible();
  });

  // ─── User Preferences API Tests ─────────────────────────────────────────────

  test('GET /user-preferences returns defaults for new user', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.prefs.defaults');

    const res = await page.request.get(`${apiBaseURL}/user-preferences`, {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      theme: string;
      notificationSettings: {
        kudosReceived: boolean;
        weeklyDigest: boolean;
        redemptionStatus: boolean;
        newAnnouncements: boolean;
      };
    };
    expect(body.theme).toBe('system');
    expect(body.notificationSettings.kudosReceived).toBe(true);
    expect(body.notificationSettings.weeklyDigest).toBe(true);
    expect(body.notificationSettings.redemptionStatus).toBe(true);
    expect(body.notificationSettings.newAnnouncements).toBe(false);
  });

  test('PATCH /user-preferences updates theme', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.prefs.theme');

    const res = await page.request.patch(`${apiBaseURL}/user-preferences`, {
      data: { theme: 'dark' },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { theme: string };
    expect(body.theme).toBe('dark');

    // Verify persistence via GET
    const getRes = await page.request.get(`${apiBaseURL}/user-preferences`, {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });
    const getBody = (await getRes.json()) as { theme: string };
    expect(getBody.theme).toBe('dark');
  });

  test('PATCH /user-preferences merges notification settings', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.prefs.notif');

    // Turn off weeklyDigest
    const res = await page.request.patch(`${apiBaseURL}/user-preferences`, {
      data: { notificationSettings: { weeklyDigest: false } },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      notificationSettings: { weeklyDigest: boolean; kudosReceived: boolean };
    };
    // weeklyDigest should be false, but kudosReceived should remain true (merged)
    expect(body.notificationSettings.weeklyDigest).toBe(false);
    expect(body.notificationSettings.kudosReceived).toBe(true);
  });

  // ─── User Preferences UI Tests ──────────────────────────────────────────────

  test('Notification toggle persists after page reload', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.prefs.ui.notif');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');

    const main = page.locator('main');
    await main.getByRole('button', { name: 'Notifications' }).click();

    // Wait for toggles to load (the switches render once preferences are fetched)
    const weeklyToggle = page.getByRole('switch', { name: /Weekly Digest/i });
    await expect(weeklyToggle).toBeVisible();

    // Default should be ON (aria-checked="true")
    await expect(weeklyToggle).toHaveAttribute('aria-checked', 'true');

    // Toggle OFF
    await weeklyToggle.click();

    // Wait for API call to complete — intercept the PATCH
    await page.waitForResponse(
      (r) => r.url().includes('/user-preferences') && r.request().method() === 'PATCH',
    );

    // Reload and verify persistence
    await page.reload();
    await page.waitForURL('/settings');
    await main.getByRole('button', { name: 'Notifications' }).click();

    const weeklyToggleAfter = page.getByRole('switch', { name: /Weekly Digest/i });
    await expect(weeklyToggleAfter).toHaveAttribute('aria-checked', 'false');
  });

  test('Appearance theme selection persists after page reload', async ({ page }) => {
    const admin = await setupAdmin(page, 'settings.prefs.ui.theme');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/settings');
    await page.waitForURL('/settings');

    const main = page.locator('main');
    await main.getByRole('button', { name: 'Appearance' }).click();

    // Click the "dark" theme button
    await page.getByRole('button', { name: 'dark' }).click();

    // Wait for API call to complete
    await page.waitForResponse(
      (r) => r.url().includes('/user-preferences') && r.request().method() === 'PATCH',
    );

    // Reload and verify persistence
    await page.reload();
    await page.waitForURL('/settings');
    await main.getByRole('button', { name: 'Appearance' }).click();

    // The "dark" button should have the active border (border-violet-500)
    const darkBtn = page.getByRole('button', { name: 'dark' });
    await expect(darkBtn).toHaveClass(/border-violet-500/);
  });
});
