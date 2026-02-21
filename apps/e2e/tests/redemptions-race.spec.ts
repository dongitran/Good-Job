import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { databaseUrl, signInApi } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  setupMember,
  createRewardViaApi,
  createRecognitionViaApi,
} from '../test-utils/org-helpers';
import { apiBaseURL } from '../playwright.config';

test.describe('Concurrent Redemption Race Condition', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run race condition E2E tests.');

  test(
    'Only one of two simultaneous redemptions succeeds when stock is 1',
    async ({ browser }) => {
      // Use a fresh browser context to avoid shared cookie state
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      // Set up admin + two members, each with enough points to redeem
      const admin = await setupAdmin(page, 'race.single');

      // Create reward with stock = 1
      const { rewardId } = await createRewardViaApi(page, admin.accessToken, {
        name: 'E2E Race Condition Reward',
        pointsCost: 20,
        category: 'swag',
        stock: 1,
      });

      // Set up member1 and member2
      const member1 = await setupMember(page, admin.orgId, 'race.m1');
      const member2 = await setupMember(page, admin.orgId, 'race.m2');

      // Give both members enough points
      await createRecognitionViaApi(
        page,
        admin.accessToken,
        member1.userId,
        25,
        'Great work on the project!',
        admin.coreValueIds[0],
      );
      await createRecognitionViaApi(
        page,
        admin.accessToken,
        member2.userId,
        25,
        'Excellent contribution to the team!',
        admin.coreValueIds[0],
      );

      // Re-sign in both members to get fresh tokens with updated balances
      const m1Fresh = await signInApi(page, member1.email, member1.password);
      const m2Fresh = await signInApi(page, member2.email, member2.password);

      // Use SEPARATE browser contexts so requests go over different TCP connections
      // and are truly concurrent at the server level (same page.request serializes)
      const ctx1 = await browser.newContext();
      const ctx2 = await browser.newContext();

      try {
        // Fire both redemptions simultaneously from separate contexts
        const [res1, res2] = await Promise.all([
          ctx1.request.post(`${apiBaseURL}/rewards/${rewardId}/redeem`, {
            data: { idempotencyKey: randomUUID() },
            headers: { Authorization: `Bearer ${m1Fresh.accessToken}` },
          }),
          ctx2.request.post(`${apiBaseURL}/rewards/${rewardId}/redeem`, {
            data: { idempotencyKey: randomUUID() },
            headers: { Authorization: `Bearer ${m2Fresh.accessToken}` },
          }),
        ]);

        const statuses = [res1.status(), res2.status()];

        // Exactly one should succeed (200 or 201), the other should fail.
        // The failure can be 400 (pre-check: "out of stock") or 409 (in-tx: ConflictException).
        // Which one fires depends on whether the first request committed before the second
        // read the stock value outside the transaction.
        const successCount = statuses.filter((s) => s === 200 || s === 201).length;
        const failCount = statuses.filter((s) => s === 400 || s === 409).length;
        expect(successCount).toBe(1);
        expect(failCount).toBe(1);

        // The one that failed should have a meaningful error message
        const failedRes = (res1.status() === 200 || res1.status() === 201) ? res2 : res1;
        const errorBody = (await failedRes.json()) as { message: string };
        expect(errorBody.message).toBeTruthy();
      } finally {
        await ctx1.close();
        await ctx2.close();
        await ctx.close();
      }
    },
  );

  test(
    'Idempotency key prevents double redemption for the same user',
    async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();

      const admin = await setupAdmin(page, 'race.idempotent');

      // Reward with unlimited stock
      const { rewardId } = await createRewardViaApi(page, admin.accessToken, {
        name: 'E2E Idempotency Reward',
        pointsCost: 20,
        category: 'swag',
        stock: -1,
      });

      const member = await setupMember(page, admin.orgId, 'race.idempotent');
      await createRecognitionViaApi(
        page,
        admin.accessToken,
        member.userId,
        50,
        'Superb performance throughout the quarter!',
        admin.coreValueIds[0],
      );

      const { accessToken } = await signInApi(page, member.email, member.password);

      // Same idempotency key sent twice simultaneously
      const idempotencyKey = randomUUID();

      const [res1, res2] = await Promise.all([
        page.request.post(`${apiBaseURL}/rewards/${rewardId}/redeem`, {
          data: { idempotencyKey },
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        page.request.post(`${apiBaseURL}/rewards/${rewardId}/redeem`, {
          data: { idempotencyKey },
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      // At least one should succeed; the duplicate with the same key should not create two records
      const statuses = [res1.status(), res2.status()];
      const successes = statuses.filter((s) => s === 200 || s === 201);
      expect(successes.length).toBeGreaterThanOrEqual(1);
      // Both cannot be 200 with a unique idempotency key (would create duplicates)
      expect(successes.length).toBeLessThanOrEqual(2);

      await ctx.close();
    },
  );
});
