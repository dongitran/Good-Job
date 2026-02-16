# Web E2E Tests (Playwright)

This workspace contains browser-based end-to-end tests for `apps/web`.

## Scope

- Validate critical user-facing flows in a real browser.
- Keep API integration tests in `apps/api` (Supertest).
- Use Playwright here for UI + browser behavior regression coverage.

## Commands

From repository root:

```bash
npm run test:e2e:web
npm run test:e2e:web:headed
npm run test:e2e:web:ui
```

From `apps/e2e`:

```bash
npm run test
npm run test:headed
npm run test:ui
npm run report
```

## Runtime Model

- By default, Playwright starts `apps/web` on `http://127.0.0.1:4173`.
- In CI, it runs against `build + preview` for deterministic behavior.
- If `E2E_BASE_URL` is set, Playwright uses that URL and skips starting `apps/web`.

Environment variables:

- `E2E_BASE_URL`: target URL for a pre-running web app.
- `E2E_WEB_PORT`: override local auto-start port (default `4173`).
