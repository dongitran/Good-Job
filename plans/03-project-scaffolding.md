# Phase 03 — Project Scaffolding

## Objective

Set up the monorepo, install dependencies, configure tooling, and create the Docker development environment. After this phase, running `docker-compose up` starts everything.

---

## Monorepo Structure

```
amanotes/
├── apps/
│   ├── web/                 # React 18 + Vite + TypeScript + Tailwind
│   │   ├── src/
│   │   │   ├── components/  # Shared UI components
│   │   │   ├── features/    # Feature modules (auth, kudos, rewards, admin)
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── lib/         # API client, utilities
│   │   │   ├── routes/      # Page components + routing
│   │   │   └── styles/      # Tailwind config, global styles
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── api/                 # NestJS + TypeScript + TypeORM
│       ├── src/
│       │   ├── auth/        # Auth module
│       │   ├── kudos/       # Kudos module
│       │   ├── rewards/     # Rewards module
│       │   ├── analytics/   # Admin analytics module
│       │   ├── feed/        # Feed + WebSocket module
│       │   ├── common/      # Guards, pipes, filters, decorators
│       │   └── config/      # Environment config
│       ├── Dockerfile
│       └── package.json
│
├── infrastructure/          # ArgoCD manifests (Phase 13)
├── plans/                   # This folder
├── docker-compose.yml
├── package.json             # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .eslintrc.js
├── .prettierrc
└── .github/workflows/ci.yml
```

---

## Steps

### 1. Initialize Workspace

- Create root `package.json` with pnpm workspaces
- Create `pnpm-workspace.yaml` pointing to `apps/*`
- Create shared `tsconfig.base.json` with strict mode
- Set up ESLint + Prettier with shared config

### 2. Scaffold Backend (apps/api)

- Initialize NestJS project with strict TypeScript
- Install dependencies: TypeORM, pg, class-validator, class-transformer, passport, jwt
- Configure NestJS modules: ConfigModule (env), TypeOrmModule (PostgreSQL)
- Create health check endpoint: `GET /api/health` → `{ status: "ok" }`
- Set up global validation pipe (auto-validate DTOs)
- Set up global exception filter (consistent error responses)
- Configure CORS for frontend origin
- Create multi-stage Dockerfile (build → runtime)

### 3. Scaffold Frontend (apps/web)

- Initialize with Vite + React 18 + TypeScript
- Install and configure Tailwind CSS
- Set up React Router v6 with page placeholders (Feed, Rewards, Admin, Profile, Login)
- Create API client (Axios instance with base URL from env, interceptors for JWT)
- Set up design tokens in Tailwind config (from Phase 01 design system)
- Create multi-stage Dockerfile (build → nginx serve)

### 4. Docker Compose

Services to define:
- **postgres** — PostgreSQL 16, volume for data persistence, health check
- **redis** — Redis 7, used for cache + pub/sub
- **api** — NestJS app, depends on postgres + redis, env vars from .env
- **web** — React app (nginx), depends on api

Create `.env.example` with all required variables:
- DATABASE_URL, REDIS_URL
- JWT_SECRET, JWT_EXPIRY
- FRONTEND_URL (for CORS)

### 5. CI Pipeline (.github/workflows/ci.yml)

Trigger on: push to main/develop, pull requests

Jobs:
- **lint** — ESLint + Prettier check
- **type-check** — TypeScript compilation
- **test** — Unit tests (configured in Phase 04)
- **build** — Docker image build validation

---

## Key Decisions

- **pnpm over npm** — Faster installs, better monorepo support, disk-efficient
- **Vite over CRA** — Faster dev server, modern defaults, better TypeScript
- **NestJS modular structure** — Each feature in its own module (auth, kudos, rewards, analytics, feed)
- **Multi-stage Dockerfiles** — Smaller production images, no dev dependencies in runtime
- **Shared tsconfig.base** — Consistent TypeScript settings across apps

---

## Expected Output

- `docker-compose up` starts all 4 services
- `GET /api/health` returns 200
- React app loads with navigation and placeholder pages
- ESLint + Prettier pass with no errors
- CI pipeline runs on push

## Grading Points

- **Foundation** (partial): Functional project structure
- **Code Quality** (partial): Clean structure, TypeScript strict
- **DevOps** (partial): Docker + CI established

## Next

→ Phase 04: Test Infrastructure
