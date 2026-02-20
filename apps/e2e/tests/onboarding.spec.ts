import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { expect, test, type Page } from '@playwright/test';
import { apiBaseURL } from '../playwright.config';

const databaseUrl = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

// ─── DB Helper ───────────────────────────────────────────────────────────────

async function waitForVerifyToken(email: string): Promise<string> {
  if (!databaseUrl) {
    throw new Error('Missing E2E_DATABASE_URL for onboarding E2E tests.');
  }

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const result = await client.query<{ token: string }>(
        `
          SELECT evt.token
          FROM email_verification_tokens evt
          INNER JOIN users u ON u.id = evt.user_id
          WHERE u.email = $1
          ORDER BY evt.created_at DESC
          LIMIT 1
        `,
        [email],
      );
      const token = result.rows[0]?.token;
      if (token) return token;
    } finally {
      await client.end();
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Timed out waiting for verify token for ${email}`);
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function createVerifiedUser(
  page: Page,
  email: string,
  password: string,
  fullName: string,
): Promise<void> {
  const signUpRes = await page.request.post(`${apiBaseURL}/auth/signup`, {
    data: { fullName, email, password },
  });
  expect(signUpRes.ok()).toBeTruthy();

  const verifyToken = await waitForVerifyToken(email);
  const verifyRes = await page.request.post(`${apiBaseURL}/auth/verify-email`, {
    data: { token: verifyToken },
  });
  expect(verifyRes.ok()).toBeTruthy();
}

async function signInApi(
  page: Page,
  email: string,
  password: string,
): Promise<{ accessToken: string; orgId: string }> {
  const signInRes = await page.request.post(`${apiBaseURL}/auth/signin`, {
    data: { email, password },
  });
  expect(signInRes.ok()).toBeTruthy();
  const { accessToken } = (await signInRes.json()) as { accessToken: string };
  expect(typeof accessToken).toBe('string');

  // Decode JWT payload (no signature verification needed for orgId)
  const payload = JSON.parse(
    Buffer.from(accessToken.split('.')[1], 'base64').toString('utf8'),
  ) as { orgId?: string };
  const orgId = payload.orgId ?? '';
  return { accessToken, orgId };
}

async function goToOnboarding(page: Page, accessToken: string): Promise<void> {
  await page.goto(`/auth/callback#access_token=${encodeURIComponent(accessToken)}`);
  await page.waitForURL('/onboarding');
}

interface SetupResult {
  email: string;
  password: string;
  orgId: string;
  accessToken: string;
}

async function setupAndGoToOnboarding(page: Page): Promise<SetupResult> {
  const email = `e2e.onboarding.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
  const password = 'password123';
  await createVerifiedUser(page, email, password, 'E2E Onboard User');
  const { accessToken, orgId } = await signInApi(page, email, password);
  await goToOnboarding(page, accessToken);
  return { email, password, orgId, accessToken };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Onboarding Wizard UI Flows (Live API)', () => {
  test.skip(
    !databaseUrl,
    'Set E2E_DATABASE_URL (or DATABASE_URL) to run onboarding E2E tests.',
  );

  // ─── GROUP A: REDIRECT & GUARD ───────────────────────────────────────────

  test('A1: new authenticated user is redirected to /onboarding', async ({ page }) => {
    const email = `e2e.guard-new.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    await createVerifiedUser(page, email, password, 'E2E Guard New');
    const { accessToken } = await signInApi(page, email, password);

    await page.goto(`/auth/callback#access_token=${encodeURIComponent(accessToken)}`);
    await expect(page).toHaveURL('/onboarding');
  });

  test('A2: authenticated unboarded user navigating to / is redirected to /onboarding', async ({
    page,
  }) => {
    const email = `e2e.guard-root.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    await createVerifiedUser(page, email, password, 'E2E Guard Root');
    const { accessToken } = await signInApi(page, email, password);

    // Inject token first so the store knows the user is authenticated
    await page.goto(`/auth/callback#access_token=${encodeURIComponent(accessToken)}`);
    await page.waitForURL('/onboarding');

    // Now navigate to / — OnboardingGuard should redirect back to /onboarding
    await page.goto('/');
    await expect(page).toHaveURL('/onboarding');
  });

  test('A3: already-onboarded user navigating to /onboarding is redirected to /', async ({
    page,
  }) => {
    const email = `e2e.guard-done.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    await createVerifiedUser(page, email, password, 'E2E Guard Done');
    const { orgId } = await signInApi(page, email, password);

    // Complete onboarding via API
    const { accessToken: freshToken } = await signInApi(page, email, password);
    const completeRes = await page.request.post(
      `${apiBaseURL}/organizations/${orgId}/complete-onboarding`,
      {
        data: { seedDemoData: false },
        headers: { Authorization: `Bearer ${freshToken}` },
      },
    );
    expect(completeRes.ok()).toBeTruthy();

    // Sign in again to get a token that has onboardingCompletedAt set.
    // Use /auth/callback to set auth state in the browser (works in every
    // environment — no cookie-domain assumptions).
    const { accessToken: completedToken } = await signInApi(page, email, password);
    await page.goto(`/auth/callback#access_token=${encodeURIComponent(completedToken)}`);
    await page.waitForURL('/dashboard');

    // Navigate to /onboarding without a full page reload (which would lose
    // in-memory auth state).  Use the History API to push the new URL, then
    // dispatch popstate so React Router picks up the change.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/onboarding');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // The Onboarding guard sees user.onboardingCompletedAt and redirects to /dashboard.
    await expect(page).toHaveURL('/dashboard', { timeout: 15_000 });
  });

  test('A4: sign-in via Landing form redirects to /onboarding', async ({ page }) => {
    const email = `e2e.landing-signin.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    // Seed account via API
    await createVerifiedUser(page, email, password, 'E2E Landing Signin');

    // page.request.post() to auth endpoints may set cookies that auto-authenticate;
    // clear them so the Landing page shows the unauthenticated sign-in form.
    await page.context().clearCookies();

    // Sign in via the Landing page UI form
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);

    const signInResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/auth/signin') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Sign In' }).last().click();
    expect((await signInResponsePromise).ok()).toBeTruthy();

    // Landing.tsx navigates to /onboarding when onboardingCompletedAt is null
    await expect(page).toHaveURL('/onboarding', { timeout: 15_000 });
  });

  // ─── GROUP B: STEP 1 WELCOME ─────────────────────────────────────────────

  test('B5: welcome step renders correctly with no Back and no Skip', async ({ page }) => {
    await setupAndGoToOnboarding(page);

    await expect(page.getByRole('heading', { name: 'Welcome to Good Job!' })).toBeVisible();
    await expect(page.getByText('Step 1 of 5')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Back/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Skip' })).not.toBeVisible();
  });

  test('B6: step indicator visual states update as wizard advances', async ({ page }) => {
    await setupAndGoToOnboarding(page);

    // Step 1: circle 1 is active (shows "1"), circles 2-5 gray
    await expect(page.getByText('Step 1 of 5')).toBeVisible();

    // Advance to step 2
    await page.getByRole('button', { name: 'Get Started' }).click();
    await expect(page.getByText('Step 2 of 5')).toBeVisible();

    // At step 2: StepIndicator renders isCompleted=true for step 1 → Check icon
    // The check is inside the first step circle (step 1 is now completed)
    const stepCircles = page.locator('.flex.items-center.justify-between .flex.flex-col');
    await expect(stepCircles.first()).toBeVisible();

    // Advance to step 3 via Skip
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.getByText('Step 3 of 5')).toBeVisible();
  });

  // ─── GROUP C: STEP 2 ORGANIZATION ───────────────────────────────────────

  test('C7: back from step 2 returns to step 1', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await expect(page.getByText('Step 2 of 5')).toBeVisible();

    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByText('Step 1 of 5')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome to Good Job!' })).toBeVisible();
  });

  test('C8: skip from step 2 goes to step 3', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    await expect(page.getByText('Step 3 of 5')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Choose Your Core Values' }),
    ).toBeVisible();
  });

  test('C9: continue is disabled until org name is filled', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();

    // Continue is disabled when name is empty
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

    // Fill the org name
    await page.getByPlaceholder('e.g. Amanotes').fill('Test Corp');
    await expect(page.getByRole('button', { name: 'Continue' })).not.toBeDisabled();

    // Clear the name → disabled again
    await page.getByPlaceholder('e.g. Amanotes').fill('');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  test('C10: org form save calls PATCH API and advances to step 3', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();

    await page.getByPlaceholder('e.g. Amanotes').fill('E2E Corp');
    // Industry and company size dropdowns
    await page.locator('select').first().selectOption('tech');
    await page.locator('select').nth(1).selectOption('1-10');

    const patchResponsePromise = page.waitForResponse(
      (r) =>
        r.url().includes('/organizations/') &&
        r.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    expect((await patchResponsePromise).ok()).toBeTruthy();

    await expect(page.getByText('Step 3 of 5')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Choose Your Core Values' }),
    ).toBeVisible();
  });

  // ─── GROUP D: STEP 3 CORE VALUES ────────────────────────────────────────

  test('D11: skip from step 3 goes to step 4', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click(); // skip step 2
    await expect(page.getByText('Step 3 of 5')).toBeVisible();

    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.getByText('Step 4 of 5')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invite Your Team' })).toBeVisible();
  });

  test('D12: continue disabled with < 3 values, enabled at exactly 3', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click(); // skip step 2

    // 0 selected → disabled
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await expect(page.getByText('0 values selected')).toBeVisible();

    // Select 1
    await page.getByText('Teamwork').click();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

    // Select 2
    await page.getByText('Innovation').click();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

    // Select 3 → enabled
    await page.getByText('Ownership').click();
    await expect(page.getByText('3 values selected')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).not.toBeDisabled();
  });

  test('D13: deselecting a value drops count below 3 and disables continue', async ({
    page,
  }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    // Select 3
    await page.getByText('Teamwork').click();
    await page.getByText('Innovation').click();
    await page.getByText('Ownership').click();
    await expect(page.getByRole('button', { name: 'Continue' })).not.toBeDisabled();

    // Deselect 1
    await page.getByText('Teamwork').click();
    await expect(page.getByText('2 values selected')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  test('D14: custom value via Add button appears selected immediately', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    await page.getByPlaceholder('Add a custom value...').fill('Integrity');
    await page.getByRole('button', { name: 'Add' }).click();

    // Card should appear
    await expect(page.getByText('Integrity')).toBeVisible();
    // Count increases (it's auto-selected)
    await expect(page.getByText('1 values selected')).toBeVisible();
    // Input is cleared
    await expect(page.getByPlaceholder('Add a custom value...')).toHaveValue('');
  });

  test('D15: custom value via Enter key adds the card', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    await page.getByPlaceholder('Add a custom value...').fill('Transparency');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Transparency')).toBeVisible();
    await expect(page.getByText('1 values selected')).toBeVisible();
  });

  test('D16: duplicate custom value is rejected (case-insensitive)', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    await page.getByPlaceholder('Add a custom value...').fill('Integrity');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('1 values selected')).toBeVisible();

    // Try adding lowercase duplicate
    await page.getByPlaceholder('Add a custom value...').fill('integrity');
    await page.getByRole('button', { name: 'Add' }).click();
    // Still 1 selected — duplicate was ignored
    await expect(page.getByText('1 values selected')).toBeVisible();
    // Only one "Integrity" card exists
    await expect(page.getByText('Integrity')).toHaveCount(1);
  });

  test('D17: continue with 3+ values calls POST core-values API and advances to step 4', async ({
    page,
  }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    await page.getByText('Teamwork').click();
    await page.getByText('Innovation').click();
    await page.getByText('Ownership').click();

    const coreValuesResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/core-values') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    expect((await coreValuesResponsePromise).ok()).toBeTruthy();

    await expect(page.getByText('Step 4 of 5')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invite Your Team' })).toBeVisible();
  });

  // ─── GROUP E: STEP 4 INVITE TEAM ────────────────────────────────────────

  test('E18: skip from step 4 goes to step 5', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click(); // skip step 2
    await page.getByRole('button', { name: 'Skip' }).click(); // skip step 3
    await expect(page.getByText('Step 4 of 5')).toBeVisible();

    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.getByText('Step 5 of 5')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: "You're All Set!" }),
    ).toBeVisible();
  });

  test('E19: email chip add / remove / validation interactions', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click(); // skip step 2
    await page.getByRole('button', { name: 'Skip' }).click(); // skip step 3

    const emailInput = page.locator('input[type="email"]');

    // Add via Enter
    await emailInput.fill('alice@example.com');
    await emailInput.press('Enter');
    await expect(page.getByText('alice@example.com')).toBeVisible();

    // Add via comma
    await emailInput.fill('bob@example.com');
    await emailInput.press(',');
    await expect(page.getByText('bob@example.com')).toBeVisible();
    await expect(page.getByText('2 teammates invited')).toBeVisible();

    // Remove alice chip
    await page.locator('span', { hasText: 'alice@example.com' }).getByRole('button').click();
    await expect(page.getByText('alice@example.com')).not.toBeVisible();
    await expect(page.getByText('1 teammate invited')).toBeVisible();

    // Invalid email → not added
    await emailInput.fill('notanemail');
    await emailInput.press('Enter');
    await expect(page.getByText('notanemail')).not.toBeVisible();
    await expect(page.getByText('1 teammate invited')).toBeVisible();

    // Duplicate → not added
    await emailInput.fill('bob@example.com');
    await emailInput.press('Enter');
    await expect(page.getByText('1 teammate invited')).toBeVisible();

    // Backspace removes last chip
    await emailInput.press('Backspace');
    await expect(page.getByText('bob@example.com')).not.toBeVisible();
    await expect(page.getByText('invited')).not.toBeVisible();
  });

  test('E20: email input onBlur adds chip', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('carol@example.com');

    // Tab out triggers onBlur
    await emailInput.press('Tab');
    await expect(page.getByText('carol@example.com')).toBeVisible();
  });

  test('E21: continue with 0 emails does NOT call invitation API', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    // No emails added — track whether invitations endpoint is called
    let invitationsCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/invitations') && req.method() === 'POST') {
        invitationsCalled = true;
      }
    });

    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Step 5 of 5')).toBeVisible();
    expect(invitationsCalled).toBe(false);
  });

  test('E22: continue with emails calls POST invitations and advances to step 5', async ({
    page,
  }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('teammate@example.com');
    await emailInput.press('Enter');

    const invitationsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/invitations') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    expect((await invitationsResponsePromise).ok()).toBeTruthy();

    await expect(page.getByText('Step 5 of 5')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: "You're All Set!" }),
    ).toBeVisible();
  });

  // ─── GROUP F: STEP 5 ALL SET ─────────────────────────────────────────────

  test('F23: launch mode toggle, no skip button, back works', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    await expect(page.getByText('Step 5 of 5')).toBeVisible();

    // Default: Demo mode selected
    await expect(page.getByText('Explore with Demo')).toBeVisible();
    await expect(page.getByText('Demo Mode')).toBeVisible();

    // Switch to Fresh
    await page.getByText('Start Fresh').click();
    await expect(page.getByText('Fresh Start')).toBeVisible();

    // No Skip button on step 5
    await expect(page.getByRole('button', { name: 'Skip' })).not.toBeVisible();

    // Back returns to step 4
    await page.getByRole('button', { name: /Back/i }).click();
    await expect(page.getByText('Step 4 of 5')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invite Your Team' })).toBeVisible();
  });

  test('F24: step 5 setup summary reflects data from previous steps', async ({ page }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();

    // Step 2: fill org name
    await page.getByPlaceholder('e.g. Amanotes').fill('Acme Inc');
    const patchPromise = page.waitForResponse(
      (r) => r.url().includes('/organizations/') && r.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    await patchPromise;

    // Step 3: select 3 values
    await page.getByText('Teamwork').click();
    await page.getByText('Innovation').click();
    await page.getByText('Ownership').click();
    const coreValuesPromise = page.waitForResponse(
      (r) => r.url().includes('/core-values') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    await coreValuesPromise;

    // Step 4: add 1 email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('summary@example.com');
    await emailInput.press('Enter');
    const invitationsPromise = page.waitForResponse(
      (r) => r.url().includes('/invitations') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    await invitationsPromise;

    // Step 5 summary
    await expect(page.getByText('Step 5 of 5')).toBeVisible();
    await expect(page.getByText('Acme Inc')).toBeVisible();
    await expect(page.getByText('3 selected')).toBeVisible();
    await expect(page.getByText('1 invited')).toBeVisible();
  });

  test('F25: launch calls complete-onboarding API, shows toast, navigates to /', async ({
    page,
  }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    const completePromise = page.waitForResponse(
      (r) => r.url().includes('/complete-onboarding') && r.request().method() === 'POST',
    );
    // Toast fires synchronously with navigate('/'), so it's not reliably
    // observable.  Assert the API call + navigation instead.
    await page.getByRole('button', { name: /Launch Good Job/i }).click();
    expect((await completePromise).ok()).toBeTruthy();
    await page.waitForURL('/dashboard', { timeout: 10_000 });
  });

  // ─── GROUP G: SESSION & EDGE CASES ──────────────────────────────────────

  test('G26: skip all intermediate steps then launch succeeds (minimal path)', async ({
    page,
  }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();

    // Skip steps 2, 3, 4
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();

    // Step 5 summary shows empty data
    await expect(page.getByText('Step 5 of 5')).toBeVisible();
    await expect(page.getByText('—')).toBeVisible(); // org name "—"
    await expect(page.getByText('0 selected')).toBeVisible();
    await expect(page.getByText('0 invited')).toBeVisible();

    // Launch
    const completePromise = page.waitForResponse(
      (r) => r.url().includes('/complete-onboarding') && r.request().method() === 'POST',
    );
    // Toast fires synchronously with navigate('/'), so it's not reliably
    // observable.  Assert the API call + navigation instead.
    await page.getByRole('button', { name: /Launch Good Job/i }).click();
    expect((await completePromise).ok()).toBeTruthy();
    await page.waitForURL('/dashboard', { timeout: 10_000 });
  });

  test('G27: page reload on /onboarding (in-progress) stays on /onboarding', async ({
    page,
  }) => {
    await setupAndGoToOnboarding(page);
    await page.getByRole('button', { name: 'Get Started' }).click();
    // Now on step 2

    const refreshPromise = page.waitForResponse(
      (r) => r.url().includes('/auth/refresh') && r.request().method() === 'POST',
    );
    await page.reload();
    expect((await refreshPromise).status()).toBe(200);

    // OnboardingGuard allows /onboarding for authenticated unboarded users
    await expect(page).toHaveURL('/onboarding');
  });

  test('G28: non-member gets 403 on org endpoints', async ({ page }) => {
    // Create User A
    const emailA = `e2e.403-usera.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    await createVerifiedUser(page, emailA, 'password123', 'E2E User A');
    const { orgId: orgIdA } = await signInApi(page, emailA, 'password123');

    // Create User B
    const emailB = `e2e.403-userb.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    await createVerifiedUser(page, emailB, 'password123', 'E2E User B');
    const { accessToken: tokenB } = await signInApi(page, emailB, 'password123');

    // User B tries to access User A's org
    const patchRes = await page.request.patch(
      `${apiBaseURL}/organizations/${orgIdA}`,
      {
        data: { name: 'Hacked' },
        headers: { Authorization: `Bearer ${tokenB}` },
      },
    );
    expect(patchRes.status()).toBe(403);

    // Also verify core-values endpoint
    const coreValuesRes = await page.request.post(
      `${apiBaseURL}/organizations/${orgIdA}/core-values`,
      {
        data: { values: [{ name: 'Hack' }] },
        headers: { Authorization: `Bearer ${tokenB}` },
      },
    );
    expect(coreValuesRes.status()).toBe(403);
  });

  // ─── FULL HAPPY PATH ─────────────────────────────────────────────────────

  test('happy-path: complete full 5-step onboarding end-to-end via UI', async ({ page }) => {
    const email = `e2e.happy.${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'password123';

    // Seed account
    await createVerifiedUser(page, email, password, 'E2E Happy Path User');

    // page.request.post() may set cookies; clear so Landing shows sign-in form.
    await page.context().clearCookies();

    // 1. Sign in via Landing form → should redirect to /onboarding
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await page.getByPlaceholder('john@company.com').fill(email);
    await page.getByPlaceholder('Enter your password').fill(password);
    const signInPromise = page.waitForResponse(
      (r) => r.url().includes('/auth/signin') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Sign In' }).last().click();
    expect((await signInPromise).ok()).toBeTruthy();
    await page.waitForURL('/onboarding');

    // 2. Step 1: Welcome
    await expect(page.getByRole('heading', { name: 'Welcome to Good Job!' })).toBeVisible();
    await page.getByRole('button', { name: 'Get Started' }).click();

    // 3. Step 2: Organization
    await expect(page.getByText('Step 2 of 5')).toBeVisible();
    await page.getByPlaceholder('e.g. Amanotes').fill('Acme Inc');
    const patchPromise = page.waitForResponse(
      (r) => r.url().includes('/organizations/') && r.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    expect((await patchPromise).ok()).toBeTruthy();

    // 4. Step 3: Core Values
    await expect(page.getByText('Step 3 of 5')).toBeVisible();
    await page.getByText('Teamwork').click();
    await page.getByText('Innovation').click();
    await page.getByText('Ownership').click();
    const coreValuesPromise = page.waitForResponse(
      (r) => r.url().includes('/core-values') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    expect((await coreValuesPromise).ok()).toBeTruthy();

    // 5. Step 4: Invite Team
    await expect(page.getByText('Step 4 of 5')).toBeVisible();
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invite@example.com');
    await emailInput.press('Enter');
    const invitationsPromise = page.waitForResponse(
      (r) => r.url().includes('/invitations') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    expect((await invitationsPromise).ok()).toBeTruthy();

    // 6. Step 5: All Set
    await expect(page.getByText('Step 5 of 5')).toBeVisible();
    await page.getByText('Start Fresh').click(); // seedDemoData = false
    const completePromise = page.waitForResponse(
      (r) => r.url().includes('/complete-onboarding') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Launch Good Job/i }).click();
    const completeResponse = await completePromise;
    expect(completeResponse.ok()).toBeTruthy();

    // Verify seedDemoData=false in request body
    const requestBody = JSON.parse(completeResponse.request().postData() ?? '{}') as {
      seedDemoData?: boolean;
    };
    expect(requestBody.seedDemoData).toBe(false);

    // 7. Toast and navigation — toast may be brief since navigate fires right after
    await expect(page.getByText('Your workspace is ready!')).toBeVisible({ timeout: 10_000 });
    await page.waitForURL('/dashboard', { timeout: 10_000 });

    // 8. Reload → stays at /dashboard (guard passes: onboardingCompletedAt is now set)
    await page.reload();
    await page.waitForURL('/dashboard');
  });
});
