# Phase 13 — DevOps & Deployment

## Objective

Optimize Docker setup, build CI/CD pipeline, create ArgoCD manifests for Kubernetes, and deploy to a live URL. The grading criteria require Dockerized setup, CI/CD pipeline, and live hosting (10pts).

---

## What the Grading Requires

> Dockerized setup (docker-compose); CI/CD pipeline (GitHub Actions/GitLab CI); Live hosting

The JD also emphasizes:
> Infrastructure & Observability: Own your code from local dev to production using AWS/GCP (EKS, GKE)

---

## 1. Docker Optimization

### Production Dockerfiles (Multi-stage)

**apps/api/Dockerfile:**
- Stage 1 (build): Install deps, compile TypeScript
- Stage 2 (runtime): Copy only compiled JS + node_modules (production)
- Use `node:20-alpine` for smaller image
- Run as non-root user
- Health check: `CMD curl -f http://localhost:3000/api/health`

**apps/web/Dockerfile:**
- Stage 1 (build): Install deps, run Vite build
- Stage 2 (serve): Copy static files into `nginx:alpine`
- Custom nginx.conf for SPA routing (fallback to index.html)
- Gzip compression enabled

### docker-compose.yml (Development)

Services:
- **postgres**: PostgreSQL 16, volume mount, health check
- **redis**: Redis 7, health check
- **api**: Build from apps/api, depends on postgres + redis, hot-reload with volume mount
- **web**: Build from apps/web, depends on api, hot-reload

### docker-compose.prod.yml (Production)

- Same services but with production builds
- No volume mounts (baked into image)
- Environment variables from `.env.production`
- Resource limits (memory, CPU)

---

## 2. CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/ci.yml** — Runs on every push and PR

```
Trigger: push to main/develop, pull_request

Jobs:
  lint:
    - Checkout code
    - Install pnpm
    - Run: pnpm lint (ESLint + Prettier)

  type-check:
    - Run: pnpm type-check (TypeScript compilation)

  test:
    - Start PostgreSQL + Redis (GitHub Actions services)
    - Run migrations
    - Run: pnpm test (unit tests)
    - Run: pnpm test:e2e (integration tests)
    - Upload coverage report

  build:
    - Build Docker images (api + web)
    - Verify images build successfully
    - Run basic smoke test against built images

  deploy (only on main):
    - Push Docker images to registry (GHCR or Docker Hub)
    - Trigger deployment (ArgoCD sync or direct deploy)
```

### Branch Strategy

- `main` → production deployment (auto-deploy)
- `develop` → staging/preview (auto-deploy)
- `feature/*` → CI only (lint + test + build)

---

## 3. ArgoCD Manifests

### infrastructure/ Folder Structure

```
infrastructure/
├── base/
│   ├── namespace.yaml
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   ├── web-deployment.yaml
│   ├── web-service.yaml
│   ├── postgres-statefulset.yaml
│   ├── redis-deployment.yaml
│   ├── ingress.yaml
│   └── kustomization.yaml
└── overlays/
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    └── production/
        ├── kustomization.yaml
        └── patches/
```

### Key Manifests

**API Deployment:**
- Image from container registry
- Replicas: 2 (production)
- Environment from ConfigMap + Secrets
- Liveness/readiness probes on /api/health
- Resource limits

**Web Deployment:**
- Nginx serving static files
- Single replica sufficient
- Liveness probe on /

**Ingress:**
- Route /api/* → api-service
- Route /* → web-service
- TLS termination

**Why ArgoCD?**
- GitOps approach: infrastructure as code
- Auto-sync from Git repository
- Rollback capability
- The JD mentions K8S/GKE — ArgoCD shows familiarity with their stack

---

## 4. Live Hosting (Quick Deploy)

For the coding test demo, deploy to managed platforms:

### Option A: Railway (Recommended)
- Deploy API + PostgreSQL + Redis in one project
- Deploy Web to Vercel/Netlify
- Free tier available
- Automatic deploys from GitHub

### Option B: Fly.io
- Deploy API as a Fly app
- Managed PostgreSQL and Redis add-ons
- Deploy Web to Vercel

### Option C: Render
- Similar to Railway
- Free tier with sleep on inactivity

### Frontend Hosting
- **Vercel** or **Netlify** — free, automatic deploys, preview URLs per PR

### Environment Setup
- Production database with seed data
- Redis instance for cache + pub/sub
- Environment variables configured
- Custom domain (optional)

---

## 5. Monitoring & Observability (Bonus)

The JD mentions observability as a nice-to-have:

- **Health endpoints**: /api/health with DB + Redis connectivity check
- **Structured logging**: JSON logs with request ID, timestamp, level
- **Error tracking**: Sentry integration (free tier)
- **Basic metrics**: Request count, response time, error rate (logged)

---

## Tests

**Docker Tests**:
- Images build successfully
- Containers start and pass health checks
- docker-compose up → all services healthy

**CI Pipeline Tests**:
- Pipeline runs all stages (lint, type-check, test, build)
- Failing tests block deployment

**Deployment Verification**:
- Live URL responds
- API health check returns 200
- Frontend loads without console errors
- Basic user flow works end-to-end

---

## Expected Output

- Optimized Docker images (multi-stage, small size)
- CI/CD pipeline running on GitHub Actions
- ArgoCD manifests ready for Kubernetes deployment
- Live URL accessible with working application
- Health checks and basic monitoring

## Grading Points

- **DevOps** (complete): Docker + CI/CD + live hosting = full 10 points

## Next

→ Phase 14: Documentation & Final Polish
