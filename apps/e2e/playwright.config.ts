import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

function loadSimpleEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value;
  }
}

const rootDir = path.dirname(fileURLToPath(import.meta.url));
loadSimpleEnvFile(path.join(rootDir, '.env.e2e'));
loadSimpleEnvFile(path.join(rootDir, '.env.e2e.local'));

const webPort = Number(process.env.E2E_WEB_PORT || 4173);
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${String(webPort)}`;
const localApiProxyTarget = process.env.E2E_API_PROXY_TARGET;

// Direct API base URL for page.request.* calls (bypasses web domain proxy)
// In CI: set E2E_API_BASE_URL=https://api.good-job.xyz/api
// Locally: falls back to localApiProxyTarget + /api
export const apiBaseURL =
  process.env.E2E_API_BASE_URL ||
  (localApiProxyTarget ? `${localApiProxyTarget}/api` : undefined);

if (!process.env.E2E_BASE_URL && !localApiProxyTarget) {
  throw new Error('Missing E2E_API_PROXY_TARGET when Playwright starts local web server.');
}

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  fullyParallel: true,
  forbidOnly: false, // Temporarily disabled for debugging
  retries: process.env.CI ? 3 : 0,
  workers: process.env.CI ? 6 : undefined,
  // Default Playwright timeout is 30s — too short when 6 workers concurrently
  // hit a shared remote deployment. 60s gives enough headroom for cold-start
  // auth API calls, DB round-trips and navigation in CI.
  timeout: process.env.CI ? 60_000 : 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Generous navigation timeout for goto/waitForURL under CI load
    navigationTimeout: process.env.CI ? 45_000 : 15_000,
    // Action timeout (click, fill, etc.)
    actionTimeout: process.env.CI ? 15_000 : 10_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
      // Exclude rate-limiting tests — they run in their own sequential project
      // after this one completes, to avoid IP quota interference.
      testIgnore: ['**/auth-rate-limiting.spec.ts'],
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
      testIgnore: ['**/auth-rate-limiting.spec.ts'],
    },
    {
      // Rate-limiting tests need an empty IP quota to work correctly.
      // By depending on chromium-desktop, they only start after all parallel
      // workers have finished, so there's no concurrent quota consumption.
      name: 'rate-limiting',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/auth-rate-limiting.spec.ts'],
      dependencies: ['chromium-desktop'],
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
      command: process.env.CI
        ? `VITE_API_PROXY_TARGET=${localApiProxyTarget} npm --prefix ../.. run build:web && VITE_API_PROXY_TARGET=${localApiProxyTarget} npm --prefix ../.. run preview --workspace web -- --host 127.0.0.1 --port ${String(
          webPort,
        )}`
        : `VITE_API_PROXY_TARGET=${localApiProxyTarget} npm --prefix ../.. run dev --workspace web -- --host 127.0.0.1 --port ${String(
          webPort,
        )}`,
      url: baseURL,
      timeout: 180 * 1000,
      reuseExistingServer: !process.env.CI,
    },
});
