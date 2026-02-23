import { expect, test } from '@playwright/test';
import { setupAdmin, setupMember, goToDashboard } from '../test-utils/org-helpers';

test.describe('Admin Organization Settings (Phase 1)', () => {
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
});
