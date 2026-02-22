import { expect, test } from '@playwright/test';
import { databaseUrl } from '../test-utils/auth-helpers';
import { apiBaseURL } from '../playwright.config';
import {
    setupAdmin,
    setupMember,
    goToDashboard,
    createRecognitionViaApi,
} from '../test-utils/org-helpers';

test.describe('Notifications', () => {
    test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to run notifications E2E tests.');

    // ─── API Tests ────────────────────────────────────────────────────────────

    test('GET /notifications returns empty list for new user', async ({ page }) => {
        const admin = await setupAdmin(page, 'notif.api.empty');

        const res = await page.request.get(`${apiBaseURL}/notifications`, {
            headers: { Authorization: `Bearer ${admin.accessToken}` },
        });

        expect(res.status()).toBe(200);
        const body = (await res.json()) as { data: unknown[]; total: number };
        expect(body.data).toHaveLength(0);
        expect(body.total).toBe(0);
    });

    test('GET /notifications/unread-count returns 0 for new user', async ({ page }) => {
        const admin = await setupAdmin(page, 'notif.api.unread0');

        const res = await page.request.get(`${apiBaseURL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${admin.accessToken}` },
        });

        expect(res.status()).toBe(200);
        const body = (await res.json()) as { count: number };
        expect(body.count).toBe(0);
    });

    test('Receiving kudos creates a notification for the receiver', async ({ page }) => {
        const admin = await setupAdmin(page, 'notif.api.kudos');
        const member = await setupMember(page, admin.orgId, 'notif.api.kudos');
        const kudosMessage = 'Excellent innovation on the feature!';

        await createRecognitionViaApi(
            page,
            admin.accessToken,
            member.userId,
            25,
            kudosMessage,
            admin.coreValueIds[0],
        );

        // Small delay to let the fire-and-forget notification persist
        await page.waitForTimeout(500);

        // Check receiver's unread count
        const countRes = await page.request.get(`${apiBaseURL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${member.accessToken}` },
        });
        expect(countRes.status()).toBe(200);
        const { count } = (await countRes.json()) as { count: number };
        expect(count).toBe(1);

        // Check notification content
        const listRes = await page.request.get(`${apiBaseURL}/notifications`, {
            headers: { Authorization: `Bearer ${member.accessToken}` },
        });
        expect(listRes.status()).toBe(200);
        const listBody = (await listRes.json()) as {
            data: Array<{ title: string; body: string; isRead: boolean; type: string }>;
            total: number;
        };
        expect(listBody.total).toBe(1);
        expect(listBody.data[0].title).toContain('gave you 25 points');
        expect(listBody.data[0].body).toBe(kudosMessage);
        expect(listBody.data[0].isRead).toBe(false);
        expect(listBody.data[0].type).toBe('KUDOS_RECEIVED');
    });

    test('PATCH /notifications/:id/read marks notification as read', async ({ page }) => {
        const admin = await setupAdmin(page, 'notif.api.read');
        const member = await setupMember(page, admin.orgId, 'notif.api.read');

        await createRecognitionViaApi(
            page,
            admin.accessToken,
            member.userId,
            25,
            'Outstanding teamwork on the project!',
            admin.coreValueIds[0],
        );

        await page.waitForTimeout(500);

        // Get notification ID
        const listRes = await page.request.get(`${apiBaseURL}/notifications`, {
            headers: { Authorization: `Bearer ${member.accessToken}` },
        });
        const listBody = (await listRes.json()) as { data: Array<{ id: string }> };
        const notifId = listBody.data[0].id;

        // Mark as read
        const readRes = await page.request.patch(`${apiBaseURL}/notifications/${notifId}/read`, {
            headers: { Authorization: `Bearer ${member.accessToken}` },
        });
        expect(readRes.status()).toBe(200);

        // Verify unread count is now 0
        const countRes = await page.request.get(`${apiBaseURL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${member.accessToken}` },
        });
        const { count } = (await countRes.json()) as { count: number };
        expect(count).toBe(0);
    });

    test('PATCH /notifications/read-all marks all notifications as read', async ({ page }) => {
        const admin = await setupAdmin(page, 'notif.api.readall');
        const member = await setupMember(page, admin.orgId, 'notif.api.readall');

        // Create 2 kudos → 2 notifications
        await createRecognitionViaApi(
            page,
            admin.accessToken,
            member.userId,
            25,
            'Brilliant work on task number one!',
            admin.coreValueIds[0],
        );
        await createRecognitionViaApi(
            page,
            admin.accessToken,
            member.userId,
            25,
            'Amazing effort on task number two!',
            admin.coreValueIds[1] ?? admin.coreValueIds[0],
        );

        await page.waitForTimeout(500);

        // Verify 2 unread
        const countBefore = await page.request.get(`${apiBaseURL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${member.accessToken}` },
        });
        expect(((await countBefore.json()) as { count: number }).count).toBe(2);

        // Mark all read
        const readAllRes = await page.request.patch(`${apiBaseURL}/notifications/read-all`, {
            headers: { Authorization: `Bearer ${member.accessToken}` },
        });
        expect(readAllRes.status()).toBe(200);

        // Verify 0 unread
        const countAfter = await page.request.get(`${apiBaseURL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${member.accessToken}` },
        });
        expect(((await countAfter.json()) as { count: number }).count).toBe(0);
    });

    test('Giver does NOT receive a notification for their own kudos', async ({ page }) => {
        const admin = await setupAdmin(page, 'notif.api.giver');
        const member = await setupMember(page, admin.orgId, 'notif.api.giver');

        await createRecognitionViaApi(
            page,
            admin.accessToken,
            member.userId,
            25,
            'Wonderful contribution to the team!',
            admin.coreValueIds[0],
        );

        await page.waitForTimeout(500);

        // Giver (admin) should NOT have notifications
        const countRes = await page.request.get(`${apiBaseURL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${admin.accessToken}` },
        });
        const { count } = (await countRes.json()) as { count: number };
        expect(count).toBe(0);
    });

    // ─── UI Tests ─────────────────────────────────────────────────────────────

    test('Bell icon opens dropdown showing "No notifications yet" for new user', async ({ page }) => {
        const admin = await setupAdmin(page, 'notif.ui.empty');
        await goToDashboard(page, admin.email, admin.password);

        await page.getByTestId('notification-bell').click();
        await expect(page.getByText('No notifications yet')).toBeVisible();
    });

    test('Bell badge appears after receiving kudos and dropdown shows notification', async ({ page }) => {
        const admin = await setupAdmin(page, 'notif.ui.badge');
        const member = await setupMember(page, admin.orgId, 'notif.ui.badge');
        const kudosMessage = 'Superb dedication to the sprint goal!';

        await createRecognitionViaApi(
            page,
            admin.accessToken,
            member.userId,
            25,
            kudosMessage,
            admin.coreValueIds[0],
        );

        // Login as member who received kudos
        await goToDashboard(page, member.email, member.password);

        // Wait for polling to update bell badge — badge shows unread count
        const bell = page.getByTestId('notification-bell');
        // Badge span inside the bell button shows "1"
        await expect(bell.locator('span')).toContainText('1', { timeout: 35000 });

        // Open dropdown
        await bell.click();

        // Notification text should be visible in dropdown
        await expect(page.getByText(/gave you 25 points/)).toBeVisible();
        await expect(page.getByText(kudosMessage)).toBeVisible();
    });
});
