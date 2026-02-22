import { expect, test } from '@playwright/test';
import { databaseUrl, uniqueEmail, waitForToken, signInApi } from '../test-utils/auth-helpers';
import {
  setupAdmin,
  setupMember,
  goToDashboard,
  completeOnboardingViaApi,
} from '../test-utils/org-helpers';
import { apiBaseURL } from '../playwright.config';

test.describe('Admin Users (Team Members)', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run admin-users E2E tests.');

  test('Admin can navigate to /admin/users', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.nav');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    await expect(page.getByRole('heading', { name: 'Team Members' })).toBeVisible();
    await expect(
      page.getByText('Manage team members and view recognition activity'),
    ).toBeVisible();
  });

  test('Member cannot access /admin/users', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.member');
    const member = await setupMember(page, admin.orgId, 'adm.usr.member');
    await goToDashboard(page, member.email, member.password);

    await page.goto('/admin/users');
    await page.waitForURL('/dashboard');

    await expect(page).toHaveURL('/dashboard');
  });

  test('Stats cards display on team members page', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.stats');
    await setupMember(page, admin.orgId, 'adm.usr.stats');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    await expect(page.getByText('Total Members')).toBeVisible();
    await expect(page.getByText('Admins')).toBeVisible();
    await expect(page.getByText('Top Receiver')).toBeVisible();
    await expect(page.getByText('Most Kudos')).toBeVisible();
  });

  test('User table shows both org members', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.table');
    await setupMember(page, admin.orgId, 'adm.usr.table');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    const tbody = page.getByRole('table').locator('tbody');
    await expect(tbody.getByText('E2E Admin User')).toBeVisible();
    await expect(tbody.getByText('E2E Member User')).toBeVisible();
  });

  test('Search by member name filters the table', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.search');
    await setupMember(page, admin.orgId, 'adm.usr.search');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    await page.getByPlaceholder('Search members...').fill('E2E Member');

    const tbody = page.getByRole('table').locator('tbody');
    await expect(tbody.getByText('E2E Member User')).toBeVisible();
    // Admin should be hidden from the TABLE (they may still appear in Sidebar/stat cards)
    await expect(tbody.getByText('E2E Admin User')).not.toBeVisible();
  });

  test('Role filter shows only members', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.rolefilter');
    await setupMember(page, admin.orgId, 'adm.usr.rolefilter');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    // Filter by "Member" role
    await page.locator('select').first().selectOption('member');

    const tbody = page.getByRole('table').locator('tbody');
    await expect(tbody.getByText('E2E Member User')).toBeVisible();
    // Admin should be hidden from the TABLE (may still appear in Sidebar/stat cards)
    await expect(tbody.getByText('E2E Admin User')).not.toBeVisible();
  });

  test('Sort dropdown options are available', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.sort');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    // Sort select is the second select (first is role filter)
    const sortSelect = page.locator('select').last();
    await expect(sortSelect).toBeVisible();

    // Verify options exist
    await expect(sortSelect.locator('option', { hasText: 'Sort: Join Date' })).toBeAttached();
    await expect(
      sortSelect.locator('option', { hasText: 'Sort: Kudos Received' }),
    ).toBeAttached();
    await expect(sortSelect.locator('option', { hasText: 'Sort: Points Earned' })).toBeAttached();
  });

  test('User row shows correct role badge', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.role');
    await setupMember(page, admin.orgId, 'adm.usr.role');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    // Admin row should show "owner" badge (first user is the org creator = owner)
    const table = page.getByRole('table');
    // Badge span renders as "👑 owner" - scope to table to avoid matching select options outside
    await expect(table.locator('span').filter({ hasText: 'owner' }).first()).toBeVisible();
    // Member row should show "member" badge
    await expect(table.locator('span').filter({ hasText: 'member' }).first()).toBeVisible();
  });

  test('Invite Member button is visible to admin', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.invite.btn');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    await expect(page.getByRole('button', { name: 'Invite Member' })).toBeVisible();
  });

  test('Invite Member modal opens and closes', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.invite.modal');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    await page.getByRole('button', { name: 'Invite Member' }).click();

    await expect(page.getByRole('heading', { name: 'Invite Member' })).toBeVisible();
    await expect(page.getByPlaceholder('colleague@company.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Invitation' })).toBeVisible();

    // Close via Cancel button
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Invite Member' })).not.toBeVisible();
  });

  test('Admin can send invitation to a new email', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.invite.send');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    const inviteEmail = uniqueEmail('adm.usr.invite.send', 'invitee');

    await page.getByRole('button', { name: 'Invite Member' }).click();
    await expect(page.getByRole('heading', { name: 'Invite Member' })).toBeVisible();

    await page.getByPlaceholder('colleague@company.com').fill(inviteEmail);
    await page.getByRole('button', { name: 'Send Invitation' }).click();

    // Modal should close and success toast should appear
    await expect(page.getByRole('heading', { name: 'Invite Member' })).not.toBeVisible();
    await expect(page.getByText(`Invitation sent to ${inviteEmail}`)).toBeVisible();
  });

  test('Invite Member button is not shown to non-admin members', async ({ page }) => {
    test.setTimeout(90_000); // Double account setup (admin + member) is slow
    const admin = await setupAdmin(page, 'adm.usr.invite.nonAdmin');
    const member = await setupMember(page, admin.orgId, 'adm.usr.invite.nonAdmin');
    await goToDashboard(page, member.email, member.password);

    await page.goto('/admin/users');
    await page.waitForURL('/dashboard');

    // Non-admin is redirected away — invite button should not be visible
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('button', { name: 'Invite Member' })).not.toBeVisible();
  });

  test('Full UI flow: signup on landing → signin → invite member', async ({ page }) => {
    const email = uniqueEmail('adm.usr.fullui', 'admin');
    const password = 'Password123!';

    // 1. Open landing page and open auth modal via navbar "Sign In" button
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();

    const modal = page.locator('.modal-glow');
    await expect(modal).toBeVisible();

    // 2. Switch to Sign Up tab and fill the registration form
    await modal.getByRole('button', { name: 'Sign Up' }).first().click();
    await modal.getByPlaceholder('John Doe').fill('E2E UI Admin');
    await modal.getByPlaceholder('john@company.com').fill(email);
    await modal.getByPlaceholder('Min. 8 characters').fill(password);
    // Accept Terms of Service checkbox (only visible in signup mode)
    await modal.locator('input[type="checkbox"]').click();
    await modal.locator('form button[type="submit"]').click();

    // Toast confirms account created; modal switches to signin mode
    await expect(page.getByText(/Account created|verify your email/i)).toBeVisible();

    // 3. Verify email via DB (email delivery not available in test env)
    const verifyToken = await waitForToken(email, 'verify');
    await page.request.post(`${apiBaseURL}/auth/verify-email`, {
      data: { token: verifyToken },
    });

    // 4. Sign in via UI — email/password state persists from signup form
    // Intercept the signin response to capture the access token for onboarding API call
    const signinResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/auth/signin') && r.request().method() === 'POST',
    );
    await modal.locator('form button[type="submit"]').click();
    const signinResponse = await signinResponsePromise;
    const signinBody = (await signinResponse.json()) as { accessToken?: string };
    const accessToken = signinBody.accessToken ?? '';
    expect(accessToken).toBeTruthy();

    // App navigates to /onboarding after first signin
    await page.waitForURL('/onboarding');

    // 5. Complete onboarding via API (org setup is infrastructure, not the feature under test)
    const jwtPayload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64').toString('utf8'),
    ) as { orgId?: string };
    const orgId = jwtPayload.orgId ?? '';
    await completeOnboardingViaApi(page, orgId, accessToken);

    // 6. Get a FRESH token after onboarding so the JWT has onboardingCompletedAt set
    //    Re-signin via API (email+password) to get a token reflecting updated org state
    const freshSignIn = await signInApi(page, email, password);
    const freshToken = freshSignIn.accessToken;

    // 7. Navigate via auth callback with the fresh token — should now land on /dashboard
    await page.goto(`/auth/callback#access_token=${encodeURIComponent(freshToken)}`);
    await page.waitForURL('/dashboard');

    // 7. Navigate to /admin/users and invite a member via UI
    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');
    await expect(page.getByRole('heading', { name: 'Team Members' })).toBeVisible();

    const inviteEmail = uniqueEmail('adm.usr.fullui', 'invitee');
    await page.getByRole('button', { name: 'Invite Member' }).click();
    await page.getByPlaceholder('colleague@company.com').fill(inviteEmail);
    await page.getByRole('button', { name: 'Send Invitation' }).click();

    await expect(page.getByText(`Invitation sent to ${inviteEmail}`)).toBeVisible();
  });

  test('Invited email appears as pending in the members page after invite', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.invite.pending');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    const inviteEmail = uniqueEmail('adm.usr.invite.pending', 'invitee');

    // Send invite
    await page.getByRole('button', { name: 'Invite Member' }).click();
    await page.getByPlaceholder('colleague@company.com').fill(inviteEmail);
    await page.getByRole('button', { name: 'Send Invitation' }).click();

    // Wait for success toast
    await expect(page.getByText(`Invitation sent to ${inviteEmail}`)).toBeVisible();

    // The invited email should appear in a pending invitations section
    const pendingSection = page.locator('section').filter({ hasText: 'Pending Invitations' });
    await expect(pendingSection).toBeVisible();
    await expect(pendingSection.getByText(inviteEmail, { exact: true })).toBeVisible();
    await expect(pendingSection.getByText('pending').first()).toBeVisible();

  });

  test('Pending invitations section shows correct email and pending badge', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.invite.badge');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    const inviteEmail = uniqueEmail('adm.usr.invite.badge', 'invitee');

    // Send invite via API so we skip UI flow for the invite itself
    await page.request.post(`${apiBaseURL}/organizations/${admin.orgId}/invitations`, {
      data: { emails: [inviteEmail] },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    // Reload the page so the pending section fetches fresh data
    await page.reload();
    await page.waitForURL('/admin/users');

    // Pending invitations section must be visible
    await expect(page.getByText('Pending Invitations')).toBeVisible();
    // The invited email should be listed
    await expect(page.getByText(inviteEmail)).toBeVisible();
    // A "pending" badge must be displayed for the invited email
    await expect(page.getByText('pending').first()).toBeVisible();
  });

  test('Inviting the same email twice shows a warning instead of a success', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.dup.invite');
    await goToDashboard(page, admin.email, admin.password);

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    const inviteEmail = uniqueEmail('adm.usr.dup.invite', 'invitee');

    // First invite — should succeed
    await page.getByRole('button', { name: 'Invite Member' }).click();
    await page.getByPlaceholder('colleague@company.com').fill(inviteEmail);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    await expect(page.getByText(`Invitation sent to ${inviteEmail}`)).toBeVisible();

    // Second invite — same email, modal should close and show warning
    await page.getByRole('button', { name: 'Invite Member' }).click();
    await page.getByPlaceholder('colleague@company.com').fill(inviteEmail);
    await page.getByRole('button', { name: 'Send Invitation' }).click();

    // Should show a warning toast, NOT a success toast
    await expect(
      page.getByText(`${inviteEmail} has already been invited`),
    ).toBeVisible();
    // Must NOT show a second success toast
    await expect(page.getByText(`Invitation sent to ${inviteEmail}`)).not.toBeVisible();
  });

  test('Non-admin member cannot POST /invitations via API (403)', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.inv.perm');
    const member = await setupMember(page, admin.orgId, 'adm.usr.inv.perm');

    const targetEmail = uniqueEmail('adm.usr.inv.perm', 'target');
    const res = await page.request.post(
      `${apiBaseURL}/organizations/${admin.orgId}/invitations`,
      {
        data: { emails: [targetEmail] },
        headers: { Authorization: `Bearer ${member.accessToken}` },
      },
    );

    // Member role should not be allowed to invite — expect Forbidden
    expect(res.status()).toBe(403);
  });

  // ─── Revoke Invitation Tests ──────────────────────────────────────────────

  test('Admin can revoke a pending invitation via API', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.revoke.api');
    const inviteEmail = uniqueEmail('adm.usr.revoke.api', 'invitee');

    // Create an invitation first
    const createRes = await page.request.post(
      `${apiBaseURL}/organizations/${admin.orgId}/invitations`,
      {
        data: { emails: [inviteEmail] },
        headers: { Authorization: `Bearer ${admin.accessToken}` },
      },
    );
    expect(createRes.ok()).toBeTruthy();

    // Fetch pending invitations to get the ID
    const pendingRes = await page.request.get(
      `${apiBaseURL}/organizations/${admin.orgId}/invitations`,
      { headers: { Authorization: `Bearer ${admin.accessToken}` } },
    );
    expect(pendingRes.ok()).toBeTruthy();
    const pending = (await pendingRes.json()) as { id: string; email: string }[];
    const invitation = pending.find((inv) => inv.email === inviteEmail.toLowerCase());
    expect(invitation).toBeDefined();
    const invitationId = invitation!.id;

    // Revoke the invitation
    const revokeRes = await page.request.delete(
      `${apiBaseURL}/organizations/${admin.orgId}/invitations/${invitationId}`,
      { headers: { Authorization: `Bearer ${admin.accessToken}` } },
    );
    expect(revokeRes.status()).toBe(200);

    // Invitation should no longer appear in pending list
    const afterRes = await page.request.get(
      `${apiBaseURL}/organizations/${admin.orgId}/invitations`,
      { headers: { Authorization: `Bearer ${admin.accessToken}` } },
    );
    expect(afterRes.ok()).toBeTruthy();
    const afterPending = (await afterRes.json()) as { id: string }[];
    expect(afterPending.find((inv) => inv.id === invitationId)).toBeUndefined();
  });

  test('Non-admin cannot revoke invitation via API (403)', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.revoke.perm');
    const member = await setupMember(page, admin.orgId, 'adm.usr.revoke.perm');
    const inviteEmail = uniqueEmail('adm.usr.revoke.perm', 'invitee');

    // Admin creates invitation
    const createRes = await page.request.post(
      `${apiBaseURL}/organizations/${admin.orgId}/invitations`,
      {
        data: { emails: [inviteEmail] },
        headers: { Authorization: `Bearer ${admin.accessToken}` },
      },
    );
    expect(createRes.ok()).toBeTruthy();

    // Get the invitation ID
    const pendingRes = await page.request.get(
      `${apiBaseURL}/organizations/${admin.orgId}/invitations`,
      { headers: { Authorization: `Bearer ${admin.accessToken}` } },
    );
    const pending = (await pendingRes.json()) as { id: string; email: string }[];
    const invitation = pending.find((inv) => inv.email === inviteEmail.toLowerCase());
    expect(invitation).toBeDefined();

    // Member tries to revoke — should get 403
    const revokeRes = await page.request.delete(
      `${apiBaseURL}/organizations/${admin.orgId}/invitations/${invitation!.id}`,
      { headers: { Authorization: `Bearer ${member.accessToken}` } },
    );
    expect(revokeRes.status()).toBe(403);
  });

  test('Revoke button is visible in each Pending Invitations row', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.revoke.btn');
    await goToDashboard(page, admin.email, admin.password);

    const inviteEmail = uniqueEmail('adm.usr.revoke.btn', 'invitee');

    // Create invitation via API
    await page.request.post(`${apiBaseURL}/organizations/${admin.orgId}/invitations`, {
      data: { emails: [inviteEmail] },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    // Each pending invitation row should show a Revoke button
    const pendingSection = page.locator('section').filter({ hasText: 'Pending Invitations' });
    await expect(pendingSection).toBeVisible();
    await expect(
      pendingSection.getByRole('button', { name: /revoke/i }).first(),
    ).toBeVisible();
  });

  test('Revoked invitation disappears from Pending Invitations UI', async ({ page }) => {
    const admin = await setupAdmin(page, 'adm.usr.revoke.ui');
    await goToDashboard(page, admin.email, admin.password);

    const inviteEmail = uniqueEmail('adm.usr.revoke.ui', 'invitee');

    // Create invitation via API
    await page.request.post(`${apiBaseURL}/organizations/${admin.orgId}/invitations`, {
      data: { emails: [inviteEmail] },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    await page.goto('/admin/users');
    await page.waitForURL('/admin/users');

    // Verify invitation is visible first
    const pendingSection = page.locator('section').filter({ hasText: 'Pending Invitations' });
    await expect(pendingSection).toBeVisible();
    await expect(pendingSection.getByText(inviteEmail, { exact: true })).toBeVisible();

    // Click the Revoke button for this email's row
    const revokeBtn = pendingSection
      .getByRole('row')
      .filter({ hasText: inviteEmail })
      .getByRole('button', { name: /revoke/i });
    await revokeBtn.click();

    // Confirm in the dialog (or inline confirm button)
    // The UI should show a confirm step; click the confirm button
    await page.getByRole('button', { name: /confirm/i }).click();

    // Success toast
    await expect(page.getByText(/invitation.*revoked|revoked.*invitation/i)).toBeVisible();

    // Invitation row should be gone from section
    await expect(pendingSection.getByText(inviteEmail, { exact: true })).not.toBeVisible();
  });
});
