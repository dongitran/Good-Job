# AGENTS.md — Amanotes Senior Fullstack Developer Application

## Context

This workspace supports the application process for the **Senior Fullstack Developer (NodeJS, ReactJS)** position at **Amanotes**.

The candidate is building a coding test project called **"Good Job"** — an Internal Recognize & Reward System. Target score: **>70/100** (Senior level).

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
npm run test:cov               # Coverage report

# Linting
npm run lint
npm run format
```

> These commands are planned and may change as the project is scaffolded.

---

## Key Reminders for AI Agents

- This is a **coding test for a job application** — code quality and architecture matter more than speed.
- Always refer to **`coding-test.md`** for grading criteria before making architectural decisions.
- The JD emphasizes **AI-Assisted Workflow** and **Product-Centric Engineering** — showcase these.
- Prioritize **correctness and data integrity** (especially point transactions) over feature quantity.
- Write code that demonstrates **senior-level engineering judgment**, not just feature completion.
