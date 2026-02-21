import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  setupMember,
  goToDashboard,
  createRewardViaApi,
} from '../test-utils/org-helpers';

test.describe('Admin Rewards Management', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run admin-rewards E2E tests.');

  test('Admin can navigate to /admin/rewards', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.nav');
    await goToDashboard(page, admin.accessToken);

    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    await expect(page.getByRole('heading', { name: 'Reward Management' })).toBeVisible();
  });

  test('Member cannot access /admin/rewards', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.member');
    const member = await setupMember(page, admin.orgId, 'adm.rwd.member');
    await goToDashboard(page, member.accessToken);

    await page.goto('/admin/rewards');

    await expect(page.getByText('Admin access required')).toBeVisible();
  });

  test('Rewards tab shows existing rewards', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.list');
    const rewardName = 'E2E Listed Reward';
    await createRewardViaApi(page, admin.accessToken, {
      name: rewardName,
      pointsCost: 100,
      category: 'swag',
    });

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    await expect(page.getByText(rewardName)).toBeVisible();
  });

  test('Stats cards display on admin rewards page', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.stats');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Stats Reward',
      pointsCost: 100,
      category: 'swag',
    });

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    await expect(page.getByText('Total Rewards')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
    await expect(page.getByText('Redeemed (Month)')).toBeVisible();
    await expect(page.getByText('Budget Spent')).toBeVisible();
  });

  test('Admin can create a new reward', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.create');
    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    // Open add modal
    await page.getByRole('button', { name: 'Add Reward' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Reward' })).toBeVisible();

    // Fill form
    const newRewardName = 'E2E Brand New Reward';
    await page.getByPlaceholder('e.g. Amazon Gift Card').fill(newRewardName);
    await page.getByLabel('Points Cost').fill('150');

    // Submit
    await page.getByRole('button', { name: 'Create Reward' }).click();

    await expect(page.getByText('Reward created successfully.')).toBeVisible();
    await expect(page.getByText(newRewardName)).toBeVisible();
  });

  test('Admin can edit a reward', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.edit');
    const rewardName = 'E2E Edit Me Reward';
    await createRewardViaApi(page, admin.accessToken, {
      name: rewardName,
      pointsCost: 100,
      category: 'swag',
    });

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    // Click Edit on the reward card
    const card = page.locator('article').filter({ hasText: rewardName });
    await card.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('heading', { name: 'Edit Reward' })).toBeVisible();

    // Update the name
    const nameInput = page.getByPlaceholder('e.g. Amazon Gift Card');
    await nameInput.clear();
    const updatedName = 'E2E Updated Reward Name';
    await nameInput.fill(updatedName);

    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Reward updated successfully.')).toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('Admin can disable an active reward', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.disable');
    const rewardName = 'E2E Disable Me Reward';
    await createRewardViaApi(page, admin.accessToken, {
      name: rewardName,
      pointsCost: 100,
      category: 'swag',
    });

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    const card = page.locator('article').filter({ hasText: rewardName });
    await card.getByRole('button', { name: 'Disable' }).click();

    await expect(page.getByText('Reward disabled.')).toBeVisible();
    // Button should change to "Enable"
    await expect(card.getByRole('button', { name: 'Enable' })).toBeVisible();
  });

  test('Admin can re-enable a disabled reward', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.enable');
    const rewardName = 'E2E Enable Me Reward';
    await createRewardViaApi(page, admin.accessToken, {
      name: rewardName,
      pointsCost: 100,
      category: 'swag',
    });

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    const card = page.locator('article').filter({ hasText: rewardName });
    // First disable
    await card.getByRole('button', { name: 'Disable' }).click();
    await expect(page.getByText('Reward disabled.')).toBeVisible();

    // Then enable
    await card.getByRole('button', { name: 'Enable' }).click();
    await expect(page.getByText('Reward enabled.')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Disable' })).toBeVisible();
  });

  test('Admin can restock a reward with finite stock', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.restock');
    const rewardName = 'E2E Restock Me Reward';
    await createRewardViaApi(page, admin.accessToken, {
      name: rewardName,
      pointsCost: 100,
      category: 'swag',
      stock: 5,
    });

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    const card = page.locator('article').filter({ hasText: rewardName });
    // Restock button (RotateCcw icon, no text) — it's the third action button after Edit & Disable
    // Select by its blue border class
    await card.locator('button.\\!border-blue-200, button[class*="border-blue-200"]').click().catch(
      async () => {
        // Fallback: find button by position (Edit, Disable, Restock, Delete)
        await card.getByRole('button').nth(2).click();
      },
    );

    await expect(page.getByRole('heading', { name: /Restock/ })).toBeVisible();

    // Set quantity to 10
    const qtyInput = page.locator('input[type="number"]').last();
    await qtyInput.fill('10');

    await page.getByRole('button', { name: 'Restock' }).last().click();
    await expect(page.getByText('Added 10 units.')).toBeVisible();
  });

  test('Admin can delete a reward', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.delete');
    const rewardName = 'E2E Delete Me Reward';
    await createRewardViaApi(page, admin.accessToken, {
      name: rewardName,
      pointsCost: 100,
      category: 'swag',
    });

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    const card = page.locator('article').filter({ hasText: rewardName });

    // Handle browser confirm dialog BEFORE clicking delete
    page.once('dialog', (dialog) => void dialog.accept());
    // Delete is the last button in the card (Trash2 icon)
    await card.getByRole('button').last().click();

    await expect(page.getByText('Reward deleted.')).toBeVisible();
    await expect(page.getByText(rewardName)).not.toBeVisible();
  });

  test('Admin can search rewards by name', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.search');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Searchable Reward Alpha',
      pointsCost: 100,
      category: 'swag',
    });
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Other Reward Beta',
      pointsCost: 200,
      category: 'gift_card',
    });

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    await page.getByPlaceholder('Search rewards...').fill('Alpha');

    await expect(page.getByText('E2E Searchable Reward Alpha')).toBeVisible();
    await expect(page.getByText('E2E Other Reward Beta')).not.toBeVisible();
  });

  test('Admin can filter rewards by category', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.catfilter');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Swag Category Reward',
      pointsCost: 100,
      category: 'swag',
    });
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Gift Category Reward',
      pointsCost: 200,
      category: 'gift_card',
    });

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    // Select category "Gift Cards" from the category select
    await page.locator('select').first().selectOption('gift_card');

    await expect(page.getByText('E2E Gift Category Reward')).toBeVisible();
    await expect(page.getByText('E2E Swag Category Reward')).not.toBeVisible();
  });

  test('Redemptions tab is accessible', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rwd.redemptab');
    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');

    // Switch to redemptions tab
    await page.getByRole('button', { name: 'redemptions' }).click();

    // Should show redemptions table (or empty state)
    await expect(page.getByPlaceholder('Search by user or reward...')).toBeVisible();
  });
});
