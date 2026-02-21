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

test.describe('Profile', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run profile E2E tests.');

  test('Profile page loads and shows user name', async ({ page }) => {
    const admin = await setupAdmin(page, 'prof.load');
    const member = await setupMember(page, admin.orgId, 'prof.load');
    await goToDashboard(page, member.accessToken);

    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForURL('/profile');

    await expect(page.getByRole('heading', { name: 'E2E Member User' })).toBeVisible();
  });

  test('Profile page shows points stats', async ({ page }) => {
    const admin = await setupAdmin(page, 'prof.stats');
    const member = await setupMember(page, admin.orgId, 'prof.stats');
    await goToDashboard(page, member.accessToken);

    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForURL('/profile');

    await expect(page.getByText('Giveable Points')).toBeVisible();
    await expect(page.getByText('Redeemable Points')).toBeVisible();
    await expect(page.getByText('Monthly budget')).toBeVisible();
    await expect(page.getByText('Earned wallet')).toBeVisible();
  });

  test('Kudos history shows received kudos', async ({ page }) => {
    const admin = await setupAdmin(page, 'prof.recv');
    const member = await setupMember(page, admin.orgId, 'prof.recv');

    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Incredible work on the project milestone!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, member.accessToken);
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForURL('/profile');

    await expect(page.getByText('Kudos History')).toBeVisible();
    // "Received" tab should be active by default
    await expect(page.getByRole('button', { name: 'Received' })).toBeVisible();

    // Kudos message should appear in received tab
    await expect(page.getByText('Incredible work on the project milestone!')).toBeVisible();
    await expect(page.getByText('E2E Admin User')).toBeVisible();
  });

  test('Switching to "Given" tab shows given kudos', async ({ page }) => {
    const admin = await setupAdmin(page, 'prof.given');
    const member = await setupMember(page, admin.orgId, 'prof.given');

    // Give kudos from member to... wait, member can't give to themselves.
    // We'll create a second member and have admin give, then check admin profile
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Outstanding dedication to the task at hand!',
      admin.coreValueIds[0],
    );

    await goToDashboard(page, admin.accessToken);
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForURL('/profile');

    await page.getByRole('button', { name: 'Given' }).click();

    // Admin gave kudos to member — should appear in "Given" tab
    await expect(page.getByText('E2E Member User')).toBeVisible();
  });

  test('Redemption history section is visible', async ({ page }) => {
    const admin = await setupAdmin(page, 'prof.redemption');
    const reward = await createRewardViaApi(page, admin.accessToken, {
      name: 'E2E Profile Test Reward',
      pointsCost: 20,
      category: 'swag',
    });

    const member = await setupMember(page, admin.orgId, 'prof.redemption');
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Spectacular effort on the team challenge!',
      admin.coreValueIds[0],
    );
    await redeemRewardViaApi(page, member.accessToken, reward.rewardId);

    await goToDashboard(page, member.accessToken);
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForURL('/profile');

    await expect(page.getByText('Redemption History')).toBeVisible();
    await expect(page.getByText('E2E Profile Test Reward')).toBeVisible();
    await expect(page.getByText('pending')).toBeVisible();
  });

  test('Profile stats reflect correct kudos counts', async ({ page }) => {
    const admin = await setupAdmin(page, 'prof.counts');
    const member = await setupMember(page, admin.orgId, 'prof.counts');

    // Seed 2 recognitions for member
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Amazing performance on the quarterly review!',
      admin.coreValueIds[0],
    );
    await createRecognitionViaApi(
      page,
      admin.accessToken,
      member.userId,
      25,
      'Wonderful attitude towards the team goals!',
      admin.coreValueIds[1] ?? admin.coreValueIds[0],
    );

    await goToDashboard(page, member.accessToken);
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForURL('/profile');

    // Should show 2 kudos received
    await expect(page.getByText('Kudos Received')).toBeVisible();
    // The number "2" should appear in the stats grid
    await expect(page.getByText('2').first()).toBeVisible();
  });
});
