# AGENTS.md — Good Job Platform

## Development Workflow (TDD)

Project theo hướng **Test-Driven Development**. Luôn follow thứ tự:

1. **Viết/chạy E2E test** để reproduce bug hoặc define expected behavior (test phải fail)
2. **Fix code / thêm tính năng**
3. **Rebuild Docker** (`docker compose up -d --build api`)
4. **Chạy lại E2E test** để confirm pass

> Không bao giờ fix code trước khi có test verify.

---

## Context

**Good Job** là nền tảng SaaS nhận diện & khen thưởng nhân viên nội bộ (Internal Recognition & Reward). Mô hình hybrid: web portal đầy đủ tính năng + tích hợp chat (Slack/Telegram).

Đọc thêm: [`plans/00-product-overview.md`](plans/00-product-overview.md)

### Workspace Structure

```
amanotes/
├── AGENTS.md              # This file — instructions for AI coding agents
├── .gitignore             # Excludes requirements/ from git
├── requirements/
│   ├── jd.md              # Job Description — role requirements & qualifications
│   ├── coding-test.md     # Coding test — use cases, grading criteria, output checklist
│   └── sample.md          # Reference links
├── designs/               # UI/UX designs, mockups, wireframes
├── apps/
│   ├── web/               # Frontend — React 18+, TypeScript
│   └── api/               # Backend — Node.js, NestJS, TypeScript
├── plans/                 # Implementation plans & design docs
├── infrastructure/        # ArgoCD deployment manifests
├── docker-compose.yml
└── README.md
```

### Important References

- **`requirements/jd.md`** — Read to understand the role expectations, tech stack preferences, and what Amanotes values (product-centric, AI-assisted workflow, agile mindset).
- **`requirements/coding-test.md`** — Read for full use case details, constraints, grading rubric (8 categories, 100 pts total), and output checklist. This is the primary spec for the project.

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| Frontend | React 18+, TypeScript, Tailwind CSS |
| Backend | Node.js, NestJS, TypeScript |
| Database | PostgreSQL (transactional data) |
| Cache/Realtime | Redis (real-time feed, caching) |
| Testing | Jest, React Testing Library, Supertest |
| DevOps | Docker, docker-compose, GitHub Actions |

---

## Conventions & Guidelines

### Code Style

- **TypeScript** strict mode for both frontend and backend
- Naming: camelCase for variables/functions, PascalCase for classes/components/types
- NestJS conventions for backend (modules, controllers, services, DTOs)
- React functional components, custom hooks, proper state management
- ESLint + Prettier

### Git & Commits

- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Clear, iterative commit history showing progressive development
- Branch strategy: `main` ← `develop` ← feature branches

### Database

- Migrations for schema management
- Ledger/audit trail pattern for point transactions
- DB-level or optimistic locking for concurrency
- Index frequently queried columns

---

## Build & Run Commands

```bash
# Development
docker-compose up -d           # Start all services (PostgreSQL, Redis, app)
npm install                    # Install dependencies (monorepo root)

# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev

# Testing
npm run test                   # Unit tests
npm run test:e2e               # Integration/E2E tests

# E2E (Playwright) — run against Docker containers (docker-compose up -d first)
cd apps/e2e && \
  E2E_BASE_URL=http://localhost:5174 \
  E2E_API_BASE_URL=http://localhost:3000/api \
  E2E_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goodjob \
  npx playwright test tests/onboarding.spec.ts \
    --project=chromium-desktop --reporter=line
npm run test:cov               # Coverage report

# Linting
npm run lint
npm run format
```

> These commands are planned and may change as the project is scaffolded.

---

## E2E Test Environment (Local)

### Infrastructure

| Service | Internal (Docker) | Host (from E2E test) |
|:--------|:-----------------|:---------------------|
| API | `http://api:3000` | `http://localhost:3000` |
| Web | `http://web:5173` | `http://localhost:5174` |
| PostgreSQL | `postgres:5432` | `localhost:5432` |
| Redis | `redis:6379` | `localhost:6379` |

### E2E env file — `apps/e2e/.env.e2e.local`
```
E2E_API_PROXY_TARGET=http://localhost:3000
E2E_WEB_PORT=5174
E2E_BASE_URL=http://localhost:5174
E2E_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goodjob
```

### Correct command to run E2E tests
```bash
cd apps/e2e
npx playwright test tests/admin-users.spec.ts --project=chromium-desktop
```

### Rebuild Docker after code changes
```bash
# Rebuild API hoặc Web image sau khi thay đổi source code
docker compose up -d --build api        # chỉ rebuild API
docker compose up -d --build web        # chỉ rebuild Web
docker compose up -d --build            # rebuild tất cả

# Sau rebuild, đợi API healthy trước khi chạy E2E (~30s)
docker compose logs -f api | grep "Application is running"
```

### Verify Email trong E2E Tests

Vì `EMAIL_SKIP_DOMAINS=example.com` nên không có email thật. Flow để verify account:

```typescript
// 1. Signup → 2. Lấy token từ DB → 3. Gọi API verify
const token = await waitForToken(email, 'verify'); // poll DB mỗi 400ms, timeout 60s
await page.request.post(`${apiBaseURL}/auth/verify-email`, { data: { token } });
```

Helper `createVerifiedUser()` trong `test-utils/auth-helpers.ts` đã wrap sẵn 3 bước trên.

### Lưu ý

- **Double-setup tests** (tạo admin + member) cần `test.setTimeout(90_000)` — mỗi user setup ~30s.

---

## Key Reminders for AI Agents

- This is a **coding test for a job application** — code quality and architecture matter more than speed.
- Always refer to **`coding-test.md`** for grading criteria before making architectural decisions.
- The JD emphasizes **AI-Assisted Workflow** and **Product-Centric Engineering** — showcase these.
- Prioritize **correctness and data integrity** (especially point transactions) over feature quantity.
- Write code that demonstrates **senior-level engineering judgment**, not just feature completion.
