import { expect, test } from '@playwright/test';

/**
 * Validates that unauthenticated users are redirected to the landing page (/)
 * when they attempt to access any protected route directly.
 *
 * Bug: Previously, navigating to a protected route (e.g. /onboarding, /dashboard)
 * without authentication would render the page instead of redirecting to /.
 */
test.describe('Protected Routes — unauthenticated access redirects to /', () => {
    const protectedRoutes = [
        '/onboarding',
        '/dashboard',
        '/rewards',
        '/leaderboard',
        '/profile',
        '/settings',
        '/admin',
        '/admin/users',
        '/admin/rewards',
        '/admin/settings',
    ];

    for (const route of protectedRoutes) {
        test(`unauthenticated GET ${route} redirects to /`, async ({ browser }) => {
            // Fresh context — no cookies, no tokens
            const context = await browser.newContext();
            const page = await context.newPage();
            try {
                await page.goto(route);
                // Should be redirected to the landing page
                await expect(page).toHaveURL('/', { timeout: 10_000 });
            } finally {
                await context.close();
            }
        });
    }
});
