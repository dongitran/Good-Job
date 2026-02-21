import { expect, test } from '@playwright/test';
import { Client } from 'pg';
import { databaseUrl, uniqueEmail } from '../test-utils/auth-helpers';
import { setupAdmin, goToDashboard } from '../test-utils/org-helpers';
import { apiBaseURL } from '../playwright.config';

// ─── DB Helper: get invite token ─────────────────────────────────────────────

async function getInviteToken(email: string): Promise<string> {
  if (!databaseUrl) throw new Error('Missing E2E_DATABASE_URL');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query<{ token: string }>(
      `SELECT token FROM invitations WHERE LOWER(email) = LOWER($1) AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1`,
      [email],
    );
    const token = result.rows[0]?.token;
    if (!token) throw new Error(`No invite token found for ${email}`);
    return token;
  } finally {
    await client.end();
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Invite Signup (new member auto-login)', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run invite-signup tests.');

  test('New member registers via invite link and is auto-logged-in without email verification', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    // 1. Setup admin with completed onboarding
    const admin = await setupAdmin(page, 'inv.signup');

    // 2. Admin invites a new email via API
    const inviteeEmail = uniqueEmail('inv.signup', 'member');
    const inviteRes = await page.request.post(
      `${apiBaseURL}/organizations/${admin.orgId}/invitations`,
      {
        data: { emails: [inviteeEmail] },
        headers: { Authorization: `Bearer ${admin.accessToken}` },
      },
    );
    expect(inviteRes.ok()).toBeTruthy();

    // 3. Get invite token from DB (simulates clicking the email link)
    const inviteToken = await getInviteToken(inviteeEmail);

    // 4. Navigate to register page with invite token
    await page.goto(`/register?invite=${inviteToken}`);

    // 5. Register form should show with email pre-filled
    await expect(page.getByText("You're invited!")).toBeVisible();
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveValue(inviteeEmail);
    await expect(emailInput).toHaveAttribute('readonly', '');

    // 6. Fill in the registration form
    await page.getByPlaceholder('Jane Smith').fill('E2E Invited Member');
    await page.getByPlaceholder('Min. 8 characters').fill('Password123!');

    // 7. Submit the form
    await page.getByRole('button', { name: 'Create Account & Join Team' }).click();

    // 8. Should auto-login and redirect to dashboard (NOT ask to verify email)
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // 9. Should show welcome toast, NOT "check your email" toast
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/check your email/i)).not.toBeVisible();

    // 10. User is authenticated — dashboard shows user name in sidebar
    await expect(page.locator('aside').getByText('E2E Invited Member')).toBeVisible();
  });
});
