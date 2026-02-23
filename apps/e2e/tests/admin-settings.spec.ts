import { Buffer } from 'node:buffer';
import { expect, test } from '@playwright/test';
import { setupAdmin, setupMember, goToDashboard } from '../test-utils/org-helpers';
import { apiBaseURL } from '../playwright.config';

test.describe('Admin Organization Settings (Phase 1)', () => {
  const tinyPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2p0lQAAAAASUVORK5CYII=';

  test('admin can open /admin/settings and see phase-1 tabs', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.settings.nav');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');

    await expect(
      page.getByRole('heading', { name: 'Organization Settings' }),
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'General' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Company Values' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Points & Budgets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Integrations' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Billing' })).toBeVisible();

    await expect(page.getByLabel('Organization Name')).toBeVisible();
    await expect(page.getByLabel('Company Domain')).toBeVisible();
  });

  test('member is redirected away from /admin/settings', async ({ page }) => {
    test.setTimeout(90_000);

    const admin = await setupAdmin(page, 'adm.settings.guard');
    const member = await setupMember(page, admin.orgId, 'adm.settings.guard');

    await goToDashboard(page, member.email, member.password);

    await page.goto('/admin/settings');
    await expect(page).toHaveURL('/dashboard');
  });

  test('admin updates org profile and points budget', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.settings.update');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');

    await page.getByLabel('Organization Name').fill('Amanotes QA Org');
    await page.getByLabel('Company Domain').fill('amanotes.test');
    await page.getByLabel('Timezone').selectOption('Asia/Ho_Chi_Minh');
    await page.getByLabel('Language').selectOption('en');

    const profilePatch = page.waitForResponse(
      (r) =>
        r.url().includes(`/organizations/${admin.orgId}`) &&
        r.request().method() === 'PATCH' &&
        (r.request().postData() ?? '').includes('companyDomain'),
    );
    await page.getByRole('button', { name: 'Save Changes' }).click();
    expect((await profilePatch).ok()).toBeTruthy();

    await page.getByRole('button', { name: 'Points & Budgets' }).click();

    await page.getByLabel('Monthly Points per Employee').fill('350');
    await page.getByLabel('Point Value').fill('1200');
    await page.getByLabel('Max Points per Kudos').fill('80');
    await page.getByLabel('Budget Reset Day').selectOption('15');

    const budgetPatch = page.waitForResponse(
      (r) =>
        r.url().includes(`/organizations/${admin.orgId}`) &&
        r.request().method() === 'PATCH' &&
        (r.request().postData() ?? '').includes('monthlyGivingBudget'),
    );
    await page.getByRole('button', { name: 'Save Changes' }).click();
    expect((await budgetPatch).ok()).toBeTruthy();
  });

  test('admin can add, edit, and disable a company value', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.settings.values');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');
    await page.getByRole('button', { name: 'Company Values' }).click();

    await page.getByRole('button', { name: 'Add Value' }).click();
    await page.getByLabel('Value Name').fill('Customer Obsession');
    await page.getByLabel('Emoji').fill('❤️');
    await page.getByLabel('Description').fill('Put customers at the center of decisions');

    const addResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/organizations/${admin.orgId}/core-values`) &&
        r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Save Value' }).click();
    expect((await addResponse).ok()).toBeTruthy();
    await expect(page.getByText('Customer Obsession')).toBeVisible();

    await page.getByTestId('core-value-edit-customer-obsession').click();
    await page.getByLabel('Value Name').fill('Customer Love');

    const editResponse = page.waitForResponse(
      (r) =>
        r.url().includes('/core-values/') &&
        r.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Save Value' }).click();
    expect((await editResponse).ok()).toBeTruthy();
    await expect(page.getByText('Customer Love')).toBeVisible();

    await page.getByTestId('core-value-delete-customer-love').click();
    const deleteResponse = page.waitForResponse(
      (r) =>
        r.url().includes('/core-values/') &&
        r.request().method() === 'DELETE',
    );
    await page.getByRole('button', { name: 'Disable Value' }).click();
    expect((await deleteResponse).ok()).toBeTruthy();
  });

  test('admin can reorder company values from the list', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.settings.reorder');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');
    await page.getByRole('button', { name: 'Company Values' }).click();

    const firstRow = page.getByTestId('core-value-row-innovation');
    await expect(firstRow).toContainText('Innovation');

    const reorderResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/organizations/${admin.orgId}/core-values/reorder`) &&
        r.request().method() === 'PATCH',
    );
    await page.getByTestId('core-value-move-down-innovation').click();
    expect((await reorderResponse).ok()).toBeTruthy();

    await expect(page.getByTestId('core-value-row-teamwork')).toHaveAttribute(
      'data-sort-index',
      '0',
    );
  });

  test('admin can upload and remove organization logo', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.settings.logo');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');

    const uploadPatch = page.waitForResponse(
      (r) =>
        r.url().includes(`/organizations/${admin.orgId}`) &&
        r.request().method() === 'PATCH' &&
        (r.request().postData() ?? '').includes('logoUrl'),
    );
    await page.locator('#organization-logo-upload').setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(tinyPngBase64, 'base64'),
    });
    expect((await uploadPatch).ok()).toBeTruthy();
    await expect(page.getByAltText('Organization logo')).toBeVisible();

    const removePatch = page.waitForResponse(
      (r) =>
        r.url().includes(`/organizations/${admin.orgId}`) &&
        r.request().method() === 'PATCH' &&
        (r.request().postData() ?? '').includes('"logoUrl":null'),
    );
    await page.getByRole('button', { name: 'Remove' }).click();
    expect((await removePatch).ok()).toBeTruthy();
    await expect(page.getByAltText('Organization logo')).toHaveCount(0);
  });

  test('danger zone export calls organization export API', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.settings.export');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');

    const exportResponsePromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/organizations/${admin.orgId}/export`) &&
        r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Export' }).click();

    const exportResponse = await exportResponsePromise;
    expect(exportResponse.ok()).toBeTruthy();
    const body = (await exportResponse.json()) as {
      fileName: string;
      csv: string;
      rowCount: number;
    };
    expect(body.fileName).toContain('.csv');
    expect(body.csv).toContain('email');
    expect(body.rowCount).toBeGreaterThan(0);
  });

  test('danger zone delete organization modal requires typed org name', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'adm.settings.delete-modal');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');

    const orgName = await page.getByLabel('Organization Name').inputValue();

    await page.getByRole('button', { name: 'Delete Organization' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete organization' });
    await expect(dialog).toBeVisible();

    const confirmInput = dialog.getByLabel('Type organization name to confirm');
    await confirmInput.fill('wrong-name');
    await expect(dialog.getByRole('button', { name: 'Delete Org' })).toBeDisabled();

    await confirmInput.fill(orgName);
    await expect(dialog.getByRole('button', { name: 'Delete Org' })).toBeEnabled();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('points budget tab supports editing min and max points per kudos', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'adm.settings.points-range');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');
    await page.getByRole('button', { name: 'Points & Budgets' }).click();

    await expect(page.getByLabel('Min Points per Kudos')).toBeVisible();
    await page.getByLabel('Monthly Points per Employee').fill('300');
    await page.getByLabel('Min Points per Kudos').fill('5');
    await page.getByLabel('Max Points per Kudos').fill('80');

    const updateResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/organizations/${admin.orgId}`) &&
        r.request().method() === 'PATCH' &&
        (r.request().postData() ?? '').includes('minPerKudo'),
    );
    await page.getByRole('button', { name: 'Save Changes' }).click();
    expect((await updateResponse).ok()).toBeTruthy();
  });

  test('api rejects equal min and max per kudos', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.settings.api.min-max');

    const response = await page.request.patch(
      `${apiBaseURL}/organizations/${admin.orgId}`,
      {
        headers: { Authorization: `Bearer ${admin.accessToken}` },
        data: {
          settings: {
            points: {
              minPerKudo: 50,
              maxPerKudo: 50,
            },
          },
        },
      },
    );

    expect(response.status()).toBe(400);
  });

  test('api rejects partial budget update below existing maxPerKudo', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'adm.settings.api.partial');
    const authHeader = { Authorization: `Bearer ${admin.accessToken}` };

    const setMaxResponse = await page.request.patch(
      `${apiBaseURL}/organizations/${admin.orgId}`,
      {
        headers: authHeader,
        data: {
          settings: {
            points: {
              maxPerKudo: 80,
            },
          },
        },
      },
    );
    expect(setMaxResponse.ok()).toBeTruthy();

    const invalidBudgetResponse = await page.request.patch(
      `${apiBaseURL}/organizations/${admin.orgId}`,
      {
        headers: authHeader,
        data: {
          settings: {
            budget: {
              monthlyGivingBudget: 70,
            },
          },
        },
      },
    );
    expect(invalidBudgetResponse.status()).toBe(400);
  });

  test('delete modal validates against persisted organization name', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'adm.settings.delete-persisted');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');

    const persistedName = await page.getByLabel('Organization Name').inputValue();
    await page.getByLabel('Organization Name').fill('Temporary Unsaved Name');

    await page.getByRole('button', { name: 'Delete Organization' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete organization' });
    await expect(dialog).toBeVisible();

    const confirmInput = dialog.getByLabel('Type organization name to confirm');
    await confirmInput.fill(persistedName);
    await expect(dialog.getByRole('button', { name: 'Delete Org' })).toBeEnabled();
  });

  test('notifications tab renders org-level notification toggles', async ({
    page,
  }) => {
    const admin = await setupAdmin(page, 'adm.settings.notifications.ui');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');
    await page.getByRole('button', { name: 'Notifications' }).click();

    await expect(page.getByRole('heading', { name: 'Notification Defaults' })).toBeVisible();
    await expect(page.getByText('Email Digest')).toBeVisible();
    await expect(page.getByText('Push Notifications')).toBeVisible();
    await expect(page.getByText('Monthly Leaderboard Announcement')).toBeVisible();

    // Slack row is conditional in Phase 2 and should be hidden until integration exists.
    await expect(page.getByText('Slack Integration')).toHaveCount(0);
  });

  test('admin can update org notification defaults', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.settings.notifications.save');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/settings');
    await page.waitForURL('/admin/settings');
    await page.getByRole('button', { name: 'Notifications' }).click();

    await page.getByRole('switch', { name: 'Email Digest' }).click();
    await page.getByRole('switch', { name: 'Monthly Leaderboard Announcement' }).click();

    const patchResponse = page.waitForResponse(
      (r) =>
        r.url().includes(`/organizations/${admin.orgId}`) &&
        r.request().method() === 'PATCH' &&
        (r.request().postData() ?? '').includes('"notifications"'),
    );
    await page.getByRole('button', { name: 'Save Changes' }).click();
    const response = await patchResponse;
    expect(response.ok()).toBeTruthy();
    const body = response.request().postDataJSON() as {
      settings?: {
        notifications?: {
          emailDigest?: boolean;
          pushNotifications?: boolean;
          monthlyLeaderboard?: boolean;
        };
      };
    };
    expect(body.settings?.notifications?.emailDigest).toBe(false);
    expect(body.settings?.notifications?.pushNotifications).toBe(true);
    expect(body.settings?.notifications?.monthlyLeaderboard).toBe(true);
  });

  test('member notification preferences inherit organization notification defaults', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const admin = await setupAdmin(page, 'adm.notif.inherit');
    const member = await setupMember(page, admin.orgId, 'adm.notif.inherit');

    const updateOrgRes = await page.request.patch(
      `${apiBaseURL}/organizations/${admin.orgId}`,
      {
        headers: { Authorization: `Bearer ${admin.accessToken}` },
        data: {
          settings: {
            notifications: {
              emailDigest: false,
              pushNotifications: false,
              monthlyLeaderboard: true,
            },
          },
        },
      },
    );
    expect(updateOrgRes.ok()).toBeTruthy();

    const prefsRes = await page.request.get(`${apiBaseURL}/user-preferences`, {
      headers: { Authorization: `Bearer ${member.accessToken}` },
    });
    expect(prefsRes.ok()).toBeTruthy();
    const prefsBody = (await prefsRes.json()) as {
      notificationSettings?: {
        kudosReceived?: boolean;
        weeklyDigest?: boolean;
        newAnnouncements?: boolean;
      };
    };

    expect(prefsBody.notificationSettings?.kudosReceived).toBe(false);
    expect(prefsBody.notificationSettings?.weeklyDigest).toBe(false);
    expect(prefsBody.notificationSettings?.newAnnouncements).toBe(true);
  });

  test('org push notification default OFF suppresses member kudos notifications', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const admin = await setupAdmin(page, 'adm.notif.runtime');
    const member = await setupMember(page, admin.orgId, 'adm.notif.runtime');

    const disableResponse = await page.request.patch(
      `${apiBaseURL}/organizations/${admin.orgId}`,
      {
        headers: { Authorization: `Bearer ${admin.accessToken}` },
        data: {
          settings: {
            notifications: {
              pushNotifications: false,
            },
          },
        },
      },
    );
    expect(disableResponse.ok()).toBeTruthy();

    const beforeNotifications = await page.request.get(`${apiBaseURL}/notifications?limit=20`, {
      headers: { Authorization: `Bearer ${member.accessToken}` },
    });
    expect(beforeNotifications.ok()).toBeTruthy();
    const beforeBody = (await beforeNotifications.json()) as {
      data: Array<{ id: string }>;
      total: number;
    };
    expect(beforeBody.total).toBe(0);

    const kudosResponse = await page.request.post(`${apiBaseURL}/kudos`, {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
      data: {
        receiverId: member.userId,
        points: 25,
        valueId: admin.coreValueIds[0],
        message: 'Excellent collaboration on the settings implementation!',
      },
    });
    expect(kudosResponse.ok()).toBeTruthy();

    await page.waitForTimeout(1200);

    const afterNotifications = await page.request.get(`${apiBaseURL}/notifications?limit=20`, {
      headers: { Authorization: `Bearer ${member.accessToken}` },
    });
    expect(afterNotifications.ok()).toBeTruthy();
    const afterBody = (await afterNotifications.json()) as {
      data: Array<{ id: string }>;
      total: number;
    };
    expect(afterBody.total).toBe(0);
    expect(afterBody.data).toHaveLength(0);
  });
});
