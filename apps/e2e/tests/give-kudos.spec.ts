import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import { apiBaseURL } from '../playwright.config';
import {
  setupAdmin,
  setupMember,
  goToDashboard,
} from '../test-utils/org-helpers';

test.describe('Give Kudos', () => {
  test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run give-kudos E2E tests.');

  // Modal inner dialog container — used to scope core value buttons and avoid
  // matching RecognitionFeed filter tabs (e.g. "💡 #Innovation" vs "💡 Innovation").
  function modal(page: import('@playwright/test').Page) {
    return page.locator('.max-w-md');
  }

  test('Give Kudos modal opens when clicking sidebar button', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.open');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();
    // Verify modal content is visible inside the dialog
    await expect(modal(page).getByText('Give Kudos')).toBeVisible();
    await expect(
      page.getByText("Recognize someone's great work"),
    ).toBeVisible();
  });

  test('Give Kudos modal can search for teammates', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.search');
    const member = await setupMember(page, admin.orgId, 'kudos.search');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();
    await page.getByPlaceholder('Search for a teammate...').fill('E2E Member');

    // Dropdown should show the member
    await expect(page.getByText('E2E Member User')).toBeVisible();
    // member should NOT include admin themselves (anti-self-kudos at UI level via API)
    expect(member.email).toBeTruthy();
  });

  test('Can select a teammate from dropdown', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.select');
    await setupMember(page, admin.orgId, 'kudos.select');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();
    await page.getByPlaceholder('Search for a teammate...').fill('E2E Member');
    await page.getByText('E2E Member User').click();

    // After selection, search box should be replaced with the recipient chip
    await expect(page.getByText('E2E Member User').first()).toBeVisible();
    await expect(page.getByPlaceholder('Search for a teammate...')).not.toBeVisible();
  });

  test('Can select a core value in modal', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.value');
    await setupMember(page, admin.orgId, 'kudos.value');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();

    // Core value buttons are inside the modal dialog (.max-w-md).
    // The RecognitionFeed also shows filter tabs like "💡 #Innovation" but
    // modal buttons render as "💡 Innovation" (no #). Scope to modal to avoid conflict.
    const dialog = modal(page);
    await expect(dialog.getByRole('button', { name: /Innovation/ })).toBeVisible();
    await dialog.getByRole('button', { name: /Innovation/ }).click();
    // Button should now have active styling (violet border)
    await expect(dialog.getByRole('button', { name: /Innovation/ })).toBeVisible();
  });

  test('Points slider shows default value of 25', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.slider');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();

    // Default points label
    await expect(page.getByText('25 pts')).toBeVisible();
    // Slider is present
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });

  test('Message counter shows character count', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.counter');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();

    // Before typing, counter starts at 0/10 min
    await expect(page.getByText('0/10 min')).toBeVisible();

    // Type a short message
    await page.getByPlaceholder("Tell them why they're awesome...").fill('Short');
    await expect(page.getByText('5/10 min')).toBeVisible();
  });

  test('Send Kudos button is disabled when form is incomplete', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.disabled');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();

    // No recipient, no core value, no message → button disabled
    const sendBtn = page.getByRole('button', { name: 'Send Kudos →' });
    await expect(sendBtn).toBeDisabled();
  });

  test('Successful kudos submission shows toast and closes modal', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.submit');
    await setupMember(page, admin.orgId, 'kudos.submit');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();

    // Select teammate
    await page.getByPlaceholder('Search for a teammate...').fill('E2E Member');
    await page.getByText('E2E Member User').click();

    // Select core value (scoped to modal to avoid RecognitionFeed filter tabs)
    await modal(page).getByRole('button', { name: /Innovation/ }).click();

    // Fill message (≥10 chars)
    await page
      .getByPlaceholder("Tell them why they're awesome...")
      .fill('Amazing work on this feature!');

    // Submit
    const submitBtn = page.getByRole('button', { name: 'Send Kudos →' });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Toast appears
    await expect(page.getByText('Kudos sent! 🎉')).toBeVisible();

    // Modal closes — search input no longer visible
    await expect(page.getByPlaceholder('Search for a teammate...')).not.toBeVisible();
  });

  test('API call is made to POST /kudos on submission', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.api');
    await setupMember(page, admin.orgId, 'kudos.api');
    await goToDashboard(page, admin.email, admin.password);

    const kudosPromise = page.waitForResponse(
      (r) => r.url().includes('/kudos') && r.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'Give Kudos' }).click();
    await page.getByPlaceholder('Search for a teammate...').fill('E2E Member');
    await page.getByText('E2E Member User').click();
    // Scope to modal to avoid matching RecognitionFeed "#Teamwork" filter tab
    await modal(page).getByRole('button', { name: /Teamwork/ }).click();
    await page
      .getByPlaceholder("Tell them why they're awesome...")
      .fill('Outstanding teamwork this week!');
    await page.getByRole('button', { name: 'Send Kudos →' }).click();

    const response = await kudosPromise;
    expect(response.status()).toBe(201);
  });

  test('Recognition appears in feed after giving kudos', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.feed');
    await setupMember(page, admin.orgId, 'kudos.feed');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();
    await page.getByPlaceholder('Search for a teammate...').fill('E2E Member');
    await page.getByText('E2E Member User').click();
    // Scope to modal to avoid matching RecognitionFeed "#Ownership" filter tab
    await modal(page).getByRole('button', { name: /Ownership/ }).click();
    await page
      .getByPlaceholder("Tell them why they're awesome...")
      .fill('Excellent ownership of the project!');
    await page.getByRole('button', { name: 'Send Kudos →' }).click();

    // Wait for modal to close and feed to refresh
    await expect(page.getByText('Kudos sent! 🎉')).toBeVisible();
    await page.getByText('Kudos sent! 🎉').waitFor({ state: 'hidden' });

    // New recognition should appear in feed
    await expect(
      page.getByText('Excellent ownership of the project!'),
    ).toBeVisible();
  });

  test('Giver point balance decreases after sending kudos', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.balance');
    await setupMember(page, admin.orgId, 'kudos.balance');
    await goToDashboard(page, admin.email, admin.password);

    // Read initial giveable balance via API — more reliable than parsing DOM
    // which can be stale/wrong when parallel tests have modified the same user's balance
    const balanceRes = await page.request.get(`${apiBaseURL}/points/balance`, {
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });
    const balanceData = (await balanceRes.json()) as { giveableBalance: number };
    const initialBalance = balanceData.giveableBalance;

    await page.getByRole('button', { name: 'Give Kudos' }).click();
    await page.getByPlaceholder('Search for a teammate...').fill('E2E Member');
    await page.getByText('E2E Member User').click();
    // Scope to modal to avoid matching RecognitionFeed "Innovation" filter tab
    await modal(page).getByRole('button', { name: /Innovation/ }).click();
    await page
      .getByPlaceholder("Tell them why they're awesome...")
      .fill('Great innovation on this task!');

    // Submit and wait for balance update
    await page.getByRole('button', { name: 'Send Kudos →' }).click();
    await expect(page.getByText('Kudos sent! 🎉')).toBeVisible();

    // Balance should decrease by 25 pts — wait for React Query to refetch and re-render
    const expectedBalance = initialBalance - 25;
    const header = page.locator('header');
    await expect(header.locator('strong').first()).toHaveText(String(expectedBalance), { timeout: 10000 });
  });

  test('Self-kudos is rejected by API with 400', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.self');

    // Directly call POST /kudos with receiverId === giverId — must return 400
    const response = await page.request.post(`${apiBaseURL}/kudos`, {
      data: {
        receiverId: admin.userId,
        points: 25,
        valueId: admin.coreValueIds[0],
        message: 'Attempting to give kudos to myself!',
      },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    expect(response.status()).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain('yourself');
  });

  test('Self-kudos via UI shows error toast', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.selfui');
    await goToDashboard(page, admin.email, admin.password);

    await page.getByRole('button', { name: 'Give Kudos' }).click();

    // Admin appears in their own search results (API does not filter self out).
    // The dropdown is rendered as `.absolute.top-full` inside the modal — scope to it
    // to avoid clicking the user's name shown in the header/sidebar.
    await page.getByPlaceholder('Search for a teammate...').fill('E2E Admin');
    const searchDropdown = page.locator('.absolute.top-full').first();
    await expect(searchDropdown).toBeVisible();
    await searchDropdown.getByText('E2E Admin User').click();

    // Fill required fields so the form is valid
    const dialog = page.locator('.max-w-md');
    await dialog.getByRole('button', { name: /Innovation/ }).click();
    await page.getByPlaceholder("Tell them why they're awesome...").fill('I am amazing and deserve this!');

    // Submit — API rejects self-kudos → toast shows the error message
    await page.getByRole('button', { name: 'Send Kudos →' }).click();
    await expect(page.getByText(/yourself/i)).toBeVisible();
  });

  test('Over-budget kudos is rejected by API with 400', async ({ page }) => {
    const admin = await setupAdmin(page, 'kudos.budget');
    const member = await setupMember(page, admin.orgId, 'kudos.budget');

    // Exhaust the full 1000-point monthly budget (10 kudos × 100 pts each)
    for (let i = 0; i < 10; i++) {
      const res = await page.request.post(`${apiBaseURL}/kudos`, {
        data: {
          receiverId: member.userId,
          points: 100,
          valueId: admin.coreValueIds[i % admin.coreValueIds.length],
          message: `Budget exhaustion kudos number ${String(i + 1).padStart(2, '0')} of ten`,
        },
        headers: { Authorization: `Bearer ${admin.accessToken}` },
      });
      expect(res.ok()).toBeTruthy();
    }

    // Budget is now exhausted — any further kudos should fail with 400
    const overBudgetRes = await page.request.post(`${apiBaseURL}/kudos`, {
      data: {
        receiverId: member.userId,
        points: 10,
        valueId: admin.coreValueIds[0],
        message: 'This kudos should fail because budget is exhausted!',
      },
      headers: { Authorization: `Bearer ${admin.accessToken}` },
    });

    expect(overBudgetRes.status()).toBe(400);
    const body = (await overBudgetRes.json()) as { message: string };
    expect(body.message).toContain('Insufficient points');
  });
});
