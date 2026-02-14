# Phase 04 — Test Infrastructure

## Objective

Set up the complete testing framework, configuration, patterns, and fixtures before writing feature code. Every subsequent phase will write tests using this infrastructure.

---

## Why a Dedicated Test Phase?

- Grading rewards tests across 3 categories: Code Quality (20pts), Integrity (10pts), Foundation (20pts)
- Setting up test infra early means every feature ships with tests from day one
- Consistent patterns prevent messy, inconsistent test code later
- The coding test specifically asks for unit, integration, and edge case tests

---

## Test Strategy Overview

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← Few: critical user journeys
                    ├─────────────────┤
                    │ Integration     │  ← Medium: API endpoint flows
                    ├─────────────────┤
                    │   Unit Tests    │  ← Many: services, utils, logic
                    └─────────────────┘
```

**Target coverage**: >80% backend, >70% frontend

---

## Backend Test Setup (apps/api)

### 1. Framework & Tools

- **Jest** — Test runner (comes with NestJS)
- **Supertest** — HTTP integration testing
- **@nestjs/testing** — NestJS test utilities (Test.createTestingModule)

### 2. Test Database

- Use a separate PostgreSQL database for tests (or in-memory SQLite for speed)
- Recommended: Docker test database via docker-compose test profile
- Each test suite: start transaction → run tests → rollback (clean state)
- Alternative: truncate all tables between test suites

### 3. Test File Organization

```
apps/api/src/
├── kudos/
│   ├── kudos.service.ts
│   ├── kudos.service.spec.ts        # Unit test
│   ├── kudos.controller.spec.ts     # Unit test
│   └── kudos.e2e-spec.ts            # Integration test
├── test/
│   ├── setup.ts                     # Global test setup
│   ├── fixtures/                    # Seed data factories
│   │   ├── user.fixture.ts
│   │   ├── kudo.fixture.ts
│   │   └── reward.fixture.ts
│   └── helpers/
│       ├── auth.helper.ts           # Get JWT for test user
│       ├── db.helper.ts             # DB cleanup utilities
│       └── request.helper.ts        # Supertest wrapper
```

### 4. Fixture Factories

Create helper functions to generate test data:
- `createTestUser(overrides?)` — Returns a user with defaults
- `createTestKudo(sender, receiver, overrides?)` — Returns a kudo
- `createTestReward(overrides?)` — Returns a reward
- `getAuthToken(user)` — Returns JWT for authenticated requests

### 5. Test Patterns

**Unit Test Pattern** (service logic):
- Mock dependencies (repositories, external services)
- Test one method per test case
- Focus on business rules and edge cases

**Integration Test Pattern** (API endpoints):
- Use real database (test DB)
- Authenticate via helper
- Send HTTP request via Supertest
- Assert response status, body, and side effects (DB state)

**Concurrency Test Pattern** (race conditions):
- Fire multiple requests in parallel using Promise.all
- Assert only valid outcomes (no overdraft, no double-spend)
- This pattern is critical for budget and redemption tests

---

## Frontend Test Setup (apps/web)

### 1. Framework & Tools

- **Vitest** — Test runner (native Vite integration, Jest-compatible API)
- **React Testing Library** — Component testing
- **MSW (Mock Service Worker)** — API mocking at network level

### 2. Test File Organization

```
apps/web/src/
├── features/
│   ├── kudos/
│   │   ├── SendKudoForm.tsx
│   │   └── SendKudoForm.test.tsx
├── test/
│   ├── setup.ts                # Global setup (MSW, cleanup)
│   ├── mocks/
│   │   ├── handlers.ts         # MSW request handlers
│   │   └── server.ts           # MSW server instance
│   └── helpers/
│       └── render.helper.ts    # Custom render with providers
```

### 3. Frontend Test Patterns

**Component Test** — Render component, interact, assert output
- Use `screen.getByRole`, `userEvent` for interactions
- Never test implementation details (state, hooks internals)

**Custom Render** — Wrapper that provides Router, Auth context, QueryClient
- Every test uses this wrapper for consistency

**API Mocking** — MSW intercepts network requests
- Define handlers for each endpoint
- Override per-test for error scenarios

---

## CI Integration

Update `.github/workflows/ci.yml` to include:
- Backend unit tests: `pnpm --filter api test`
- Backend integration tests: `pnpm --filter api test:e2e` (needs test DB)
- Frontend tests: `pnpm --filter web test`
- Coverage report: `pnpm --filter api test:cov`

---

## Test Commands

| Command | Scope | Description |
|:--------|:------|:------------|
| `pnpm test` | All | Run all unit tests |
| `pnpm --filter api test` | Backend | API unit tests |
| `pnpm --filter api test:e2e` | Backend | API integration tests |
| `pnpm --filter api test:cov` | Backend | Coverage report |
| `pnpm --filter web test` | Frontend | Component tests |

---

## Expected Output

- Jest/Vitest configured and running (even with 0 test files)
- Fixture factories ready to use
- Test helpers (auth, DB cleanup, custom render) created
- MSW configured for frontend
- CI pipeline runs tests on push
- Coverage reporting enabled

## Grading Points

- **Code Quality** (foundation): Test infrastructure ready for every phase
- **Integrity** (foundation): Concurrency test patterns prepared

## Next

→ Phase 05: Database & Auth
