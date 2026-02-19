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
  fullyParallel: true,
  forbidOnly: false, // Temporarily disabled for debugging
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
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
