import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  setupMember,
  goToDashboard,
  createRewardViaApi,
  createRecognitionViaApi,
} from '../test-utils/org-helpers';

test.describe('Rewards (User)', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run rewards E2E tests.');

  test('Rewards catalog page loads and shows heading', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.load');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Test Hoodie',
      pointsCost: 50,
      category: 'swag',
    });
    const member = await setupMember(page, admin.orgId, 'rwd.load');
    await goToDashboard(page, member.email, member.password);

    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    await expect(page.getByRole('heading', { name: 'Rewards Catalog 🎁' })).toBeVisible();
    await expect(
      page.getByText('Redeem your hard-earned points for awesome perks and rewards'),
    ).toBeVisible();
  });

  test('Stats cards are visible on rewards page', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.stats');
    const member = await setupMember(page, admin.orgId, 'rwd.stats');
    await goToDashboard(page, member.email, member.password);

    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    await expect(page.getByText('Available Points')).toBeVisible();
    await expect(page.getByText('Total Earned')).toBeVisible();
    await expect(page.getByText('Rewards Redeemed')).toBeVisible();
    await expect(page.getByText('Points Spent')).toBeVisible();
  });

  test('Reward cards show name and point cost', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.cards');
    const rewardName = 'E2E Coffee Gift Card';
    await createRewardViaApi(page, admin.accessToken, {
      name: rewardName,
      pointsCost: 30,
      category: 'gift_card',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.cards');
    await goToDashboard(page, member.email, member.password);

    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    await expect(page.getByText(rewardName)).toBeVisible();
    await expect(page.getByText('30')).toBeVisible();
  });

  test('Category filter shows only matching rewards', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.filter');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Swag Item',
      pointsCost: 50,
      category: 'swag',
    });
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Gift Card',
      pointsCost: 30,
      category: 'gift_card',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.filter');
    await goToDashboard(page, member.email, member.password);

    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    // Filter to swag only
    await page.getByRole('button', { name: '👕 Swag' }).click();

    await expect(page.getByText('E2E Swag Item')).toBeVisible();
    await expect(page.getByText('E2E Gift Card')).not.toBeVisible();
  });

  test('"All" filter shows all rewards', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.allfilter');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Swag Item',
      pointsCost: 50,
      category: 'swag',
    });
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Gift Card',
      pointsCost: 30,
      category: 'gift_card',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.allfilter');
    await goToDashboard(page, member.email, member.password);

    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    // Filter then reset
    await page.getByRole('button', { name: '👕 Swag' }).click();
    await page.getByRole('button', { name: 'All' }).click();

    await expect(page.getByText('E2E Swag Item')).toBeVisible();
    await expect(page.getByText('E2E Gift Card')).toBeVisible();
  });

  test('Clicking Redeem opens confirmation modal', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.confirm');
    const rewardName = 'E2E Redeemable Reward';
    await createRewardViaApi(page, admin.accessToken, {
      name: rewardName,
      pointsCost: 25,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.confirm');
    // Give member some redeemable points
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Great work on this feature!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, member.email, member.password);
    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    await page.getByRole('button', { name: 'Redeem' }).first().click();

    await expect(page.getByRole('heading', { name: 'Confirm Redemption' })).toBeVisible();
    // Reward name appears in both the catalog card (h3) and the confirmation dialog (p).
    // Scope to confirmation dialog to avoid strict mode violation.
    const confirmDialog = page.locator('.max-w-xl');
    await expect(confirmDialog.getByText(rewardName)).toBeVisible();
  });

  test('Confirmation modal shows reward name, cost, and balance', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.modal');
    const rewardName = 'E2E Balance Check Reward';
    await createRewardViaApi(page, admin.accessToken, {
      name: rewardName,
      pointsCost: 25,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.modal');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Awesome work on this feature!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, member.email, member.password);
    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    await page.getByRole('button', { name: 'Redeem' }).first().click();

    await expect(page.getByText('Points Cost')).toBeVisible();
    await expect(page.getByText('Current Balance')).toBeVisible();
    await expect(page.getByText('After Redemption')).toBeVisible();
  });

  test('Cancel button closes modal without redeeming', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.cancel');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Cancel Test Reward',
      pointsCost: 25,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.cancel');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Good job on the recent task!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, member.email, member.password);
    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    await page.getByRole('button', { name: 'Redeem' }).first().click();
    await expect(page.getByRole('heading', { name: 'Confirm Redemption' })).toBeVisible();

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Redemption' })).not.toBeVisible();
  });

  test('Confirming redemption shows success modal', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.success');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Success Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.success');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Fantastic effort on the project!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, member.email, member.password);
    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    await page.getByRole('button', { name: 'Redeem' }).first().click();
    await page.getByRole('button', { name: 'Confirm Redeem ✨' }).click();

    await expect(page.getByRole('heading', { name: 'Redeemed!' })).toBeVisible();
    await expect(page.getByText('E2E Success Reward is yours.')).toBeVisible();
    await expect(page.getByText('New Balance')).toBeVisible();
  });

  test('Success modal shows updated balance', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.newbalance');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Balance Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.newbalance');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Great contributions to the team!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, member.email, member.password);
    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    await page.getByRole('button', { name: 'Redeem' }).first().click();
    await page.getByRole('button', { name: 'Confirm Redeem ✨' }).click();

    await expect(page.getByRole('heading', { name: 'Redeemed!' })).toBeVisible();
    // New balance = 25 - 20 = 5
    // Scope to success dialog — getByText('5') would match header balance, stats cards, etc.
    const successDialog = page.locator('.max-w-xl');
    await expect(successDialog.getByText('New Balance')).toBeVisible();
    // formatPoints(25 - 20) returns "5 pts" — check full formatted string inside dialog.
    await expect(successDialog.getByText('5 pts')).toBeVisible();
  });

  test('Redeem API call returns 201', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.apicall');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E API Test Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.apicall');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Tremendous work on the deliverable!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, member.email, member.password);
    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    const redeemPromise = page.waitForResponse((r) => r.url().includes('/redeem'));

    await page.getByRole('button', { name: 'Redeem' }).first().click();
    await page.getByRole('button', { name: 'Confirm Redeem ✨' }).click();

    const response = await redeemPromise;
    expect(response.status()).toBe(201);
  });

  test('Out of stock reward shows "Out of Stock" badge', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.outofstock');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Out of Stock Item',
      pointsCost: 20,
      category: 'swag',
      stock: 0,
    });

    const member = await setupMember(page, admin.orgId, 'rwd.outofstock');
    await goToDashboard(page, member.email, member.password);

    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    // Use exact:true — "Out of Stock" is a partial match of the reward name "E2E Out of Stock Item"
    // which would cause a strict mode violation without exact matching.
    await expect(page.getByText('Out of Stock', { exact: true })).toBeVisible();
    // Out of stock → shows "Not Enough" button (canRedeem = false when stock === 0)
    const card = page.locator('article').filter({ hasText: 'E2E Out of Stock Item' });
    await expect(card.getByRole('button', { name: 'Not Enough' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Redeem' })).not.toBeVisible();
  });

  test('Reward with insufficient points shows "Not Enough" button', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.nopoints');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Expensive Reward',
      pointsCost: 999,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.nopoints');
    // Member has 0 redeemable points (no kudos received)
    await goToDashboard(page, member.email, member.password);

    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    // 999 pts required, 0 available → "Not Enough"
    const card = page.locator('article').filter({ hasText: 'E2E Expensive Reward' });
    await expect(card.getByRole('button', { name: 'Not Enough' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Not Enough' })).toBeDisabled();
  });

  test('Toast appears on successful redemption', async ({ page }) => {
    const admin = await setupAdmin(page, 'rwd.toast');
    await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Toast Test Reward',
      pointsCost: 20,
      category: 'gift_card',
    });

    const member = await setupMember(page, admin.orgId, 'rwd.toast');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Wonderful work done on the project!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, member.email, member.password);
    await page.goto('/rewards');
    await page.waitForURL('/rewards');

    await page.getByRole('button', { name: 'Redeem' }).first().click();
    await page.getByRole('button', { name: 'Confirm Redeem ✨' }).click();

    await expect(page.getByText('Reward redeemed successfully.')).toBeVisible();
  });
});
