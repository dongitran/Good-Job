import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  setupMember,
  goToDashboard,
  createRewardViaApi,
  redeemRewardViaApi,
  createRecognitionViaApi,
} from '../test-utils/org-helpers';

test.describe('Admin Redemptions Management', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run admin-redemptions E2E tests.');

  // Helper: navigate to the redemptions tab in admin rewards page
  async function goToRedemptionsTab(page: import('@playwright/test').Page, accessToken: string) {
    await goToDashboard(page, accessToken);
    await page.getByRole('button', { name: 'Manage Rewards' }).click();
    await page.waitForURL('/admin/rewards');
    await page.getByRole('button', { name: 'redemptions' }).click();
    await expect(page.getByPlaceholder('Search by user or reward...')).toBeVisible();
  }

  test('Redemptions tab shows pending redemption', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.list');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Pending Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.list');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Really great work on this!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    // Pending redemption should appear
    await expect(page.getByText('pending')).toBeVisible();
  });

  test('Redemption row shows user name, reward, and points', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.row');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Row Check Reward',
      pointsCost: 25,
      category: 'gift_card',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.row');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Outstanding work on this deliverable!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    await expect(page.getByText('E2E Member User')).toBeVisible();
    await expect(page.getByText('E2E Row Check Reward')).toBeVisible();
    await expect(page.getByText('25')).toBeVisible();
  });

  test('Admin can approve a pending redemption', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.approve');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Approve Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.approve');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Excellent work on the sprint!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    await page.getByRole('button', { name: 'Approve' }).first().click();
    await expect(page.getByText('Redemption approved.')).toBeVisible();

    // Status badge should update to "approved"
    await expect(page.getByText('approved')).toBeVisible();
  });

  test('Admin can fulfill an approved redemption', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.fulfill');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Fulfill Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.fulfill');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Amazing contribution to the team goal!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    // Approve first
    await page.getByRole('button', { name: 'Approve' }).first().click();
    await expect(page.getByText('Redemption approved.')).toBeVisible();

    // Now fulfill
    await page.getByRole('button', { name: 'Fulfill' }).first().click();
    await expect(page.getByText('Redemption fulfilled.')).toBeVisible();

    await expect(page.getByText('fulfilled')).toBeVisible();
  });

  test('Fulfilled redemption shows "No actions"', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.noaction');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E No Actions Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.noaction');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Great teamwork throughout the project!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    await page.getByRole('button', { name: 'Approve' }).first().click();
    await page.getByText('Redemption approved.').waitFor({ state: 'hidden' });

    await page.getByRole('button', { name: 'Fulfill' }).first().click();
    await expect(page.getByText('Redemption fulfilled.')).toBeVisible();
    await page.getByText('Redemption fulfilled.').waitFor({ state: 'hidden' });

    await expect(page.getByText('No actions')).toBeVisible();
  });

  test('Admin can reject a pending redemption', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.reject');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Reject Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.reject');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Superb performance on the project delivery!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    await page.getByRole('button', { name: 'Reject' }).first().click();
    await expect(page.getByText('Redemption rejected.')).toBeVisible();

    await expect(page.getByText('rejected')).toBeVisible();
  });

  test('Admin can filter redemptions by status "Pending"', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.filterpend');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Filter Pending Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.filterpend');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Commendable work on recent projects!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    // Filter to pending
    await page.locator('select').selectOption('pending');

    await expect(page.getByText('pending')).toBeVisible();
    // approved or fulfilled should not appear
    await expect(page.getByText('approved')).not.toBeVisible();
    await expect(page.getByText('fulfilled')).not.toBeVisible();
  });

  test('Admin can filter redemptions by status "Fulfilled"', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.filterfulf');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Filter Fulfilled Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.filterfulf');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Exceptional performance on the deliverable!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    // Approve and fulfill first
    await page.getByRole('button', { name: 'Approve' }).first().click();
    await page.getByText('Redemption approved.').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Fulfill' }).first().click();
    await expect(page.getByText('Redemption fulfilled.')).toBeVisible();

    // Now filter to fulfilled
    await page.locator('select').selectOption('fulfilled');

    await expect(page.getByText('fulfilled')).toBeVisible();
    await expect(page.getByText('pending')).not.toBeVisible();
  });

  test('Admin can search redemptions by user name', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.search');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Search Redemption Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.search');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Brilliant work on the recent sprint!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    // Search by member's name fragment
    await page.getByPlaceholder('Search by user or reward...').fill('E2E Member');
    await expect(page.getByText('E2E Member User')).toBeVisible();
  });

  test('Approve API call returns 200', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.rdm.apicall');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E API Call Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'adm.rdm.apicall');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Stellar work on the implementation!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToRedemptionsTab(page, admin.accessToken);

    const approvePromise = page.waitForResponse(
      (r) => r.url().includes('/redemptions/') && r.request().method() === 'PATCH',
    );

    await page.getByRole('button', { name: 'Approve' }).first().click();

    const response = await approvePromise;
    expect(response.status()).toBe(200);
  });
});
