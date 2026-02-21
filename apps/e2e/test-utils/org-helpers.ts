import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { expect, type Page } from '@playwright/test';
import { apiBaseURL } from '../playwright.config';
import {
  createVerifiedUser,
  signInApi,
  databaseUrl,
  uniqueEmail,
  type SignInResult,
} from './auth-helpers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminSetup extends SignInResult {
  email: string;
  password: string;
  coreValueIds: string[];
}

export interface MemberSetup extends SignInResult {
  email: string;
  password: string;
}

// ─── Onboarding helpers ───────────────────────────────────────────────────────

/**
 * Completes org onboarding via API (no UI):
 * 1. PATCH /organizations/:id — set name, industry, companySize
 * 2. POST /organizations/:id/core-values — set 3 default values, returns IDs
 * 3. POST /organizations/:id/complete-onboarding — mark complete
 */
export async function completeOnboardingViaApi(
  page: Page,
  orgId: string,
  accessToken: string,
): Promise<{ coreValueIds: string[] }> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const patchRes = await page.request.patch(
    `${apiBaseURL}/organizations/${orgId}`,
    {
      data: { name: 'E2E Test Org', industry: 'tech', companySize: '11-50' },
      headers,
    },
  );
  expect(patchRes.ok()).toBeTruthy();

  const coreValuesRes = await page.request.post(
    `${apiBaseURL}/organizations/${orgId}/core-values`,
    {
      data: {
        values: [
          { name: 'Innovation', emoji: '💡' },
          { name: 'Teamwork', emoji: '🤝' },
          { name: 'Ownership', emoji: '🎯' },
        ],
      },
      headers,
    },
  );
  expect(coreValuesRes.ok()).toBeTruthy();
  const coreValuesBody = (await coreValuesRes.json()) as Array<{
    id: string;
    name: string;
  }>;
  const coreValueIds = coreValuesBody.map((v) => v.id);

  const completeRes = await page.request.post(
    `${apiBaseURL}/organizations/${orgId}/complete-onboarding`,
    {
      data: { seedDemoData: false },
      headers,
    },
  );
  expect(completeRes.ok()).toBeTruthy();

  return { coreValueIds };
}

/**
 * Navigates to /dashboard using auth callback with access token.
 */
export async function goToDashboard(
  page: Page,
  accessToken: string,
): Promise<void> {
  await page.goto(
    `/auth/callback#access_token=${encodeURIComponent(accessToken)}`,
  );
  await page.waitForURL('/dashboard');
}

// ─── Setup helpers ────────────────────────────────────────────────────────────

/**
 * Creates a fully set-up admin user:
 * signup → verify email → signin → complete onboarding
 */
export async function setupAdmin(
  page: Page,
  prefix: string,
): Promise<AdminSetup> {
  const email = uniqueEmail(prefix, 'admin');
  const password = 'password123';

  await createVerifiedUser(page, email, password, 'E2E Admin User');
  const signIn = await signInApi(page, email, password);
  const { coreValueIds } = await completeOnboardingViaApi(
    page,
    signIn.orgId,
    signIn.accessToken,
  );

  // Re-sign-in to get a fresh token after onboarding is complete
  const freshSignIn = await signInApi(page, email, password);

  return {
    email,
    password,
    ...freshSignIn,
    coreValueIds,
  };
}

/**
 * Creates a member user and adds them to the given org via DB INSERT.
 *
 * Strategy: signin always picks the membership with the oldest joinedAt.
 * We INSERT into admin's org with joined_at = NOW() - interval '10 seconds'
 * so it becomes the primary org (older than the auto-created org from signup).
 */
export async function setupMember(
  page: Page,
  adminOrgId: string,
  prefix: string,
): Promise<MemberSetup> {
  if (!databaseUrl) {
    throw new Error(
      'Missing E2E_DATABASE_URL (or DATABASE_URL) for member setup.',
    );
  }

  const email = uniqueEmail(prefix, 'member');
  const password = 'password123';

  await createVerifiedUser(page, email, password, 'E2E Member User');

  // First signin to get userId
  const initialSignIn = await signInApi(page, email, password);
  const { userId } = initialSignIn;

  // Insert member into admin's org with an earlier joined_at so it becomes primary
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(
      `
        INSERT INTO organization_memberships
          (id, user_id, org_id, role, is_active, joined_at, created_at, updated_at)
        VALUES
          (gen_random_uuid(), $1, $2, 'member', true,
           NOW() - interval '10 seconds', NOW(), NOW())
      `,
      [userId, adminOrgId],
    );
  } finally {
    await client.end();
  }

  // Re-signin: now admin's org is the oldest membership → primary
  const finalSignIn = await signInApi(page, email, password);

  return {
    email,
    password,
    ...finalSignIn,
  };
}

// ─── Data seeding helpers ─────────────────────────────────────────────────────

/**
 * Creates a recognition (kudos) via API.
 * POST /kudos requires: receiverId, points, valueId, message (min 10 chars)
 */
export async function createRecognitionViaApi(
  page: Page,
  accessToken: string,
  receiverId: string,
  points: number,
  message: string,
  valueId: string,
): Promise<void> {
  const res = await page.request.post(`${apiBaseURL}/kudos`, {
    data: { receiverId, points, valueId, message },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(res.ok()).toBeTruthy();
}

/**
 * Creates a reward via admin API.
 * POST /rewards/admin
 */
export async function createRewardViaApi(
  page: Page,
  adminToken: string,
  data: {
    name: string;
    pointsCost: number;
    category: string;
    stock?: number;
    description?: string;
  },
): Promise<{ rewardId: string }> {
  const res = await page.request.post(`${apiBaseURL}/rewards/admin`, {
    data: {
      name: data.name,
      pointsCost: data.pointsCost,
      category: data.category,
      stock: data.stock ?? -1,
      description: data.description ?? '',
    },
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { id: string };
  return { rewardId: body.id };
}

/**
 * Redeems a reward via API.
 * POST /rewards/:id/redeem — requires idempotencyKey (UUID)
 */
export async function redeemRewardViaApi(
  page: Page,
  memberToken: string,
  rewardId: string,
): Promise<void> {
  const res = await page.request.post(
    `${apiBaseURL}/rewards/${rewardId}/redeem`,
    {
      data: { idempotencyKey: randomUUID() },
      headers: { Authorization: `Bearer ${memberToken}` },
    },
  );
  expect(res.ok()).toBeTruthy();
}

/**
 * Gets org members list — returns array with { id (userId), fullName, ... }
 * Used to find receiverId for createRecognitionViaApi.
 */
export async function getOrgMembers(
  page: Page,
  adminToken: string,
  orgId: string,
): Promise<Array<{ id: string; fullName: string; email: string }>> {
  const res = await page.request.get(
    `${apiBaseURL}/organizations/${orgId}/members`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as Array<{
    id: string;
    fullName: string;
    email: string;
  }>;
}
