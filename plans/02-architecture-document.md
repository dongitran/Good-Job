# Phase 02 — Architecture Document

## Overview

**Status**: 🔄 In Progress
**Goal**: Define complete technical architecture for "Good Job" - Internal Recognition & Reward System
**Target Score**: >70/100 (Senior level) — aiming for 85-90+

---

## Grading Coverage Map

| Category | Points | Architecture Coverage |
|:---|:---|:---|
| Foundation | 20 | CRUD APIs, Error handling, React UI |
| Code Quality | 20 | NestJS modular structure, PostgreSQL, Unit tests, Race-condition handling |
| Integrity | 10 | Atomic transactions, Ledger pattern, Cursor pagination, High test coverage |
| Security | 10 | Rate limiting, CSRF, JWT + OAuth2 (Google), RBAC |
| UI/UX | 10 | Tailwind + shadcn/ui, Responsive, Loading states |
| Engineering | 10 | Event-driven Pub/Sub (Redis), SSE real-time feed |
| DevOps | 10 | Docker Compose, GitHub Actions CI/CD, Fly.io hosting |
| Innovation | 10 | AI semantic search (OpenAI embeddings), Monthly AI summary |

---

## 1. Tech Stack

### Frontend
```
React 18+          → UI library (required by coding test)
TypeScript 5       → Type safety
Vite               → Build tool (fast HMR, lightweight)
TanStack Query     → Server state management (caching, revalidation)
Zustand            → Client state (lightweight, simple)
React Router v7    → Client-side routing
Tailwind CSS 4     → Utility-first styling (matches prototypes)
shadcn/ui          → Component library (accessible, customizable)
Recharts           → Admin charts (simple, React-native)
SSE (EventSource)  → Real-time feed updates
```

### Backend
```
Node.js 20 LTS     → Runtime (required by coding test)
NestJS 11          → Framework (mentioned in JD, enterprise-grade)
TypeScript 5       → Type safety
TypeORM            → ORM (excellent NestJS integration, migration support)
PostgreSQL 16      → Primary database (required: relational)
Redis 7            → Pub/Sub + caching + rate limiting
Passport.js        → Authentication (JWT + OAuth2)
class-validator     → DTO validation
EventEmitter2      → Internal event bus
```

### DevOps & Infrastructure
```
Docker + Compose   → Local development & deployment
GitHub Actions     → CI/CD pipeline
Fly.io             → Live hosting (simple, free tier)
```

### AI & Innovation
```
OpenAI API         → Embeddings (text-embedding-3-small) + Summaries (GPT-4o-mini)
pgvector           → Vector similarity search in PostgreSQL
```

---

## 2. Project Structure (Monorepo)

```
good-job/
├── apps/
│   ├── web/                          # React Frontend
│   │   ├── src/
│   │   │   ├── components/           # Shared UI components
│   │   │   │   ├── ui/               # shadcn/ui primitives
│   │   │   │   ├── layout/           # AppShell, Sidebar, TopBar
│   │   │   │   ├── kudos/            # KudoCard, KudoFeed, GiveKudoModal
│   │   │   │   ├── rewards/          # RewardCard, RewardGrid, RedeemModal
│   │   │   │   └── admin/            # Charts, Leaderboard, UserTable
│   │   │   ├── pages/                # Route pages
│   │   │   │   ├── Landing.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Rewards.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   ├── KudoDetail.tsx
│   │   │   │   ├── admin/
│   │   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   │   ├── UserManagement.tsx
│   │   │   │   │   ├── RewardManagement.tsx
│   │   │   │   │   └── OrgSettings.tsx
│   │   │   │   └── auth/
│   │   │   │       ├── Login.tsx
│   │   │   │       └── Onboarding.tsx
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Utilities, API client, constants
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── types/                # Shared TypeScript types
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                          # NestJS Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/             # Auth module (JWT, OAuth, Guards)
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── strategies/   # jwt.strategy, google.strategy
│       │   │   │   ├── guards/       # jwt-auth.guard, roles.guard
│       │   │   │   └── dto/
│       │   │   ├── users/            # User management
│       │   │   ├── organizations/    # Org & tenant management
│       │   │   ├── kudos/            # Recognition (give, list, react)
│       │   │   ├── rewards/          # Reward catalog & redemption
│       │   │   ├── points/           # Point ledger & balance
│       │   │   ├── feed/             # Real-time feed (SSE)
│       │   │   ├── admin/            # Admin analytics & reporting
│       │   │   └── ai/              # AI search & summary
│       │   ├── common/
│       │   │   ├── decorators/       # @CurrentUser, @Roles, @OrgTenant
│       │   │   ├── filters/          # Global exception filter
│       │   │   ├── interceptors/     # Transform, Logging
│       │   │   ├── pipes/            # Validation pipe
│       │   │   └── guards/           # Throttle guard
│       │   ├── database/
│       │   │   ├── entities/         # TypeORM entities
│       │   │   ├── migrations/       # DB migrations
│       │   │   └── seeds/            # Demo data seeder
│       │   ├── events/               # Event definitions & handlers
│       │   ├── config/               # App configuration
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/                     # E2E tests
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml                # PostgreSQL + Redis
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
├── .env.example
├── package.json                      # Workspace root
└── README.md
```

---

## 3. Database Schema

### Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│   Organization   │       │       User       │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │──┐    │ id (PK)          │
│ name             │  │    │ email            │
│ slug             │  │    │ password_hash    │
│ industry         │  │    │ full_name        │
│ company_size     │  ├───>│ org_id (FK)      │
│ settings (JSON)  │  │    │ role (enum)      │
│ plan (enum)      │  │    │ avatar_url       │
│ trial_ends_at    │  │    │ department       │
│ created_at       │  │    │ is_active        │
│ updated_at       │  │    │ created_at       │
└──────────────────┘  │    └──────────────────┘
                      │           │
┌──────────────────┐  │           │
│   CoreValue      │  │           │         ┌──────────────────┐
├──────────────────┤  │           │         │   PointLedger    │
│ id (PK)          │  │           │         ├──────────────────┤
│ org_id (FK)      │<─┘           │    ┌───>│ id (PK)          │
│ name             │              │    │    │ org_id (FK)      │
│ emoji            │              │    │    │ user_id (FK)     │
│ color            │              │    │    │ type (enum)      │
│ is_active        │              │    │    │ amount           │
│ created_at       │              │    │    │ balance_type     │
└──────────────────┘              │    │    │ reference_type   │
                                  │    │    │ reference_id     │
┌──────────────────┐              │    │    │ description      │
│      Kudo        │              │    │    │ created_at       │
├──────────────────┤              │    │    └──────────────────┘
│ id (PK)          │──────────────┼────┘
│ org_id (FK)      │              │
│ giver_id (FK)    │──────────────┤
│ receiver_id (FK) │──────────────┘
│ points           │
│ message          │
│ value_id (FK)    │──> CoreValue
│ is_private       │
│ created_at       │
└──────────────────┘
        │
        │ 1:N
        ▼
┌──────────────────┐     ┌──────────────────┐
│  KudoReaction    │     │   KudoComment    │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │
│ kudo_id (FK)     │     │ kudo_id (FK)     │
│ user_id (FK)     │     │ user_id (FK)     │
│ emoji            │     │ content          │
│ created_at       │     │ created_at       │
└──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│     Reward       │     │   Redemption     │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │
│ org_id (FK)      │     │ org_id (FK)      │
│ name             │     │ reward_id (FK)   │
│ description      │     │ user_id (FK)     │
│ points_cost      │     │ points_spent     │
│ category         │     │ status (enum)    │
│ image_url        │     │ idempotency_key  │
│ stock            │     │ created_at       │
│ is_active        │     │ fulfilled_at     │
│ created_at       │     └──────────────────┘
└──────────────────┘

┌──────────────────┐
│  GivingBudget    │
├──────────────────┤
│ id (PK)          │
│ org_id (FK)      │
│ user_id (FK)     │
│ month (date)     │   ← first day of month
│ total_budget     │   ← allocated amount
│ spent            │   ← points given away
│ created_at       │
└──────────────────┘
  UNIQUE(user_id, month)
```

### Key Enums

```typescript
// User roles
enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}

// Organization plans
enum OrgPlan {
  FREE = 'free',
  PRO_TRIAL = 'pro_trial',
  PRO = 'pro',
}

// Point ledger entry types
enum LedgerType {
  GIVE = 'give',           // Giver: -points from giveable budget
  RECEIVE = 'receive',     // Receiver: +points to redeemable wallet
  REDEEM = 'redeem',       // User: -points from redeemable wallet
  BUDGET_RESET = 'reset',  // Monthly: new giveable budget allocation
}

// Balance type
enum BalanceType {
  GIVEABLE = 'giveable',       // Monthly budget for giving
  REDEEMABLE = 'redeemable',   // Earned wallet for redeeming
}

// Redemption status
enum RedemptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

// Reward categories
enum RewardCategory {
  SWAG = 'swag',
  GIFT_CARD = 'gift_card',
  TIME_OFF = 'time_off',
  EXPERIENCE = 'experience',
}
```

### Indexes

```sql
-- Performance-critical indexes
CREATE INDEX idx_kudos_org_created ON kudos (org_id, created_at DESC);
CREATE INDEX idx_kudos_receiver ON kudos (receiver_id, created_at DESC);
CREATE INDEX idx_kudos_giver ON kudos (giver_id, created_at DESC);
CREATE INDEX idx_kudos_value ON kudos (value_id);

CREATE INDEX idx_ledger_user_type ON point_ledger (user_id, balance_type);
CREATE INDEX idx_ledger_reference ON point_ledger (reference_type, reference_id);

CREATE UNIQUE INDEX idx_budget_user_month ON giving_budgets (user_id, month);

CREATE UNIQUE INDEX idx_reaction_unique ON kudo_reactions (kudo_id, user_id, emoji);

CREATE INDEX idx_users_org ON users (org_id);
CREATE UNIQUE INDEX idx_users_email ON users (email);

CREATE INDEX idx_redemptions_user ON redemptions (user_id, created_at DESC);
CREATE UNIQUE INDEX idx_redemptions_idempotency ON redemptions (idempotency_key);
```

---

## 4. API Design

### Authentication

```
POST   /api/auth/register          → Create account + org + start trial
POST   /api/auth/login             → Email/password login → JWT
POST   /api/auth/google            → Google OAuth2 login
POST   /api/auth/refresh           → Refresh access token
POST   /api/auth/logout            → Invalidate refresh token
```

### Users

```
GET    /api/users/me               → Current user profile
PATCH  /api/users/me               → Update own profile
GET    /api/users/:id              → Get user profile (same org)
GET    /api/users                  → List org users (search, filter)
```

### Kudos (Recognition)

```
POST   /api/kudos                  → Give a kudo (deducts giveable budget)
GET    /api/kudos                  → Feed (cursor pagination, filters)
GET    /api/kudos/:id              → Single kudo detail
POST   /api/kudos/:id/reactions    → Add emoji reaction
DELETE /api/kudos/:id/reactions     → Remove emoji reaction
POST   /api/kudos/:id/comments     → Add comment
GET    /api/kudos/:id/comments     → List comments
```

### Rewards

```
GET    /api/rewards                → Reward catalog (filters, pagination)
GET    /api/rewards/:id            → Single reward detail
POST   /api/rewards/:id/redeem     → Redeem reward (idempotency key required)
GET    /api/redemptions            → User's redemption history
```

### Points

```
GET    /api/points/balance         → Current balances (giveable + redeemable)
GET    /api/points/history         → Point ledger history (pagination)
```

### Admin

```
GET    /api/admin/analytics        → Dashboard metrics (date range filter)
GET    /api/admin/leaderboard      → Top receivers & givers
GET    /api/admin/values-report    → Core values distribution
GET    /api/admin/export           → CSV export

POST   /api/admin/users/invite     → Invite users via email
PATCH  /api/admin/users/:id        → Update user role/status
POST   /api/admin/rewards          → Create reward
PATCH  /api/admin/rewards/:id      → Update reward
DELETE /api/admin/rewards/:id      → Remove reward
PATCH  /api/admin/redemptions/:id  → Update redemption status

GET    /api/admin/organization     → Get org settings
PATCH  /api/admin/organization     → Update org settings
POST   /api/admin/core-values      → Add core value
PATCH  /api/admin/core-values/:id  → Update core value
DELETE /api/admin/core-values/:id  → Remove core value
```

### Real-time

```
GET    /api/feed/stream            → SSE endpoint (kudos feed updates)
```

### AI (Innovation)

```
GET    /api/ai/search?q=...        → Semantic search across kudos
GET    /api/ai/summary/:userId     → Monthly AI achievement summary
```

---

## 5. Core Business Logic Flows

### 5.1 Give Kudo Flow (Critical - Atomic Transaction)

```
User clicks "Send Recognition"
         │
         ▼
┌─────────────────────────┐
│  Validate Request       │
│  - Receiver exists?     │
│  - Not self?            │
│  - Points 10-50?        │
│  - Message >= 10 chars? │
│  - Core value valid?    │
└─────────┬───────────────┘
          │ Valid
          ▼
┌─────────────────────────┐
│  Check Giving Budget    │
│  (SELECT FOR UPDATE)    │  ← Pessimistic lock
│  - Get current month    │
│  - budget.spent + pts   │
│    <= budget.total?     │
└─────────┬───────────────┘
          │ Sufficient
          ▼
┌─────────────────────────────────────────┐
│  DB Transaction (SERIALIZABLE)          │
│                                         │
│  1. UPDATE giving_budgets               │
│     SET spent = spent + :points         │
│     WHERE user_id = :giver              │
│       AND month = :currentMonth         │
│                                         │
│  2. INSERT INTO kudos (...)             │
│     → new kudo record                   │
│                                         │
│  3. INSERT INTO point_ledger            │
│     → GIVE entry (giver, -points,       │
│        balance=giveable)                │
│                                         │
│  4. INSERT INTO point_ledger            │
│     → RECEIVE entry (receiver, +points, │
│        balance=redeemable)              │
│                                         │
│  COMMIT                                 │
└─────────────────┬───────────────────────┘
                  │ Success
                  ▼
┌─────────────────────────┐
│  Emit Events (async)    │
│  - kudo.created         │
│    → SSE broadcast      │
│    → Notification       │
│    → AI embedding gen   │
└─────────────────────────┘
```

### 5.2 Reward Redemption Flow (Race Condition Protection)

```
User clicks "Redeem"
         │
         ▼
┌──────────────────────────┐
│  Client sends request    │
│  with idempotency_key    │  ← UUID generated on click
│  (prevents double-click) │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│  Check idempotency_key   │
│  EXISTS in redemptions?  │──── Yes → Return existing result
└─────────┬────────────────┘
          │ No (new request)
          ▼
┌──────────────────────────────────────────┐
│  DB Transaction (SERIALIZABLE)           │
│                                          │
│  1. SELECT redeemable_balance            │
│     FROM point_ledger                    │
│     WHERE user_id = :user                │
│     FOR UPDATE                           │  ← Row lock
│                                          │
│  2. Check: balance >= reward.points_cost │
│     No → ROLLBACK + "Insufficient"       │
│                                          │
│  3. SELECT stock FROM rewards            │
│     WHERE id = :rewardId                 │
│     FOR UPDATE                           │  ← Row lock
│                                          │
│  4. Check: stock > 0                     │
│     No → ROLLBACK + "Out of stock"       │
│                                          │
│  5. UPDATE rewards                       │
│     SET stock = stock - 1                │
│                                          │
│  6. INSERT INTO point_ledger             │
│     → REDEEM entry (-points, redeemable) │
│                                          │
│  7. INSERT INTO redemptions              │
│     → with idempotency_key               │
│                                          │
│  COMMIT                                  │
└──────────────────┬───────────────────────┘
                   │ Success
                   ▼
          "Redeemed! 🎉"
```

### 5.3 Monthly Budget Reset Flow (Scheduled Job)

```
CRON: 1st of every month at 00:00 UTC
              │
              ▼
┌──────────────────────────────────┐
│  For each active organization:   │
│                                  │
│  1. Get org's budget_per_user    │
│     from org.settings            │
│                                  │
│  2. For each active user:        │
│     INSERT INTO giving_budgets   │
│     (user_id, month, total, 0)   │
│                                  │
│  3. INSERT INTO point_ledger     │
│     → BUDGET_RESET entries       │
│                                  │
│  (Batch insert for performance)  │
└──────────────────────────────────┘
```

### 5.4 Real-time Feed Flow (SSE + Redis Pub/Sub)

```
┌──────────┐     POST /api/kudos      ┌──────────┐
│  User A  │ ─────────────────────>   │  API     │
│ (Giver)  │                          │  Server  │
└──────────┘                          └────┬─────┘
                                           │
                              1. Save to DB│
                              2. Publish   │
                                           ▼
                                    ┌──────────┐
                                    │  Redis   │
                                    │  Pub/Sub │
                                    │ channel: │
                                    │ feed:{   │
                                    │  orgId}  │
                                    └────┬─────┘
                                         │
                              Subscribe  │  (all API instances)
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                         ┌────────┐ ┌────────┐ ┌────────┐
                         │SSE     │ │SSE     │ │SSE     │
                         │conn 1  │ │conn 2  │ │conn 3  │
                         └───┬────┘ └───┬────┘ └───┬────┘
                             │          │          │
                             ▼          ▼          ▼
                         ┌────────┐ ┌────────┐ ┌────────┐
                         │User B  │ │User C  │ │User D  │
                         │(feed)  │ │(feed)  │ │(feed)  │
                         └────────┘ └────────┘ └────────┘

Event payload:
{
  "type": "kudo.created",
  "data": {
    "id": "uuid",
    "giver": { "id", "name", "avatar" },
    "receiver": { "id", "name", "avatar" },
    "points": 50,
    "value": { "name": "Teamwork", "color": "#3B82F6" },
    "message": "Great sprint planning!",
    "createdAt": "2026-02-16T10:30:00Z"
  }
}
```

---

## 6. Authentication & Authorization

### Auth Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   Authentication Flow                    │
│                                                          │
│  Option A: Email/Password                                │
│  ┌──────┐  credentials  ┌──────┐  JWT pair  ┌────────┐  │
│  │Client│ ────────────> │ API  │ ────────> │Client  │  │
│  └──────┘               └──────┘            └────────┘  │
│                                                          │
│  Option B: Google OAuth2                                 │
│  ┌──────┐  redirect  ┌────────┐  code  ┌──────┐        │
│  │Client│ ────────> │Google  │ ─────> │ API  │        │
│  └──────┘           └────────┘        └──┬───┘        │
│      ▲                                    │             │
│      └────────── JWT pair ────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### JWT Token Structure

```typescript
// Access Token (short-lived: 15 minutes)
{
  sub: "user-uuid",
  email: "user@example.com",
  orgId: "org-uuid",
  role: "admin",        // member | admin | owner
  iat: 1708070400,
  exp: 1708071300
}

// Refresh Token (long-lived: 7 days, stored in httpOnly cookie)
{
  sub: "user-uuid",
  jti: "unique-token-id",  // for revocation
  iat: 1708070400,
  exp: 1708675200
}
```

### RBAC (Role-Based Access Control)

```
Permission Matrix:
─────────────────────────────────────────────────────────
Action                    │ Member │ Admin │ Owner
─────────────────────────────────────────────────────────
Give kudos                │   ✅   │  ✅   │  ✅
View feed                 │   ✅   │  ✅   │  ✅
React/Comment             │   ✅   │  ✅   │  ✅
Redeem rewards            │   ✅   │  ✅   │  ✅
View own profile          │   ✅   │  ✅   │  ✅
View admin dashboard      │   ❌   │  ✅   │  ✅
Manage users              │   ❌   │  ✅   │  ✅
Manage rewards            │   ❌   │  ✅   │  ✅
Manage core values        │   ❌   │  ✅   │  ✅
Organization settings     │   ❌   │  ❌   │  ✅
Billing & plan            │   ❌   │  ❌   │  ✅
Delete organization       │   ❌   │  ❌   │  ✅
─────────────────────────────────────────────────────────
```

### NestJS Guard Implementation

```
Request Flow:
─────────────────────────────────────────────────────────

  Request
    │
    ▼
  JwtAuthGuard          → Validate JWT, extract user
    │
    ▼
  OrgTenantGuard        → Ensure user belongs to org
    │
    ▼
  RolesGuard            → Check role permission
    │
    ▼
  ThrottlerGuard        → Rate limiting
    │
    ▼
  ValidationPipe        → DTO validation
    │
    ▼
  Controller Handler
```

---

## 7. Multi-Tenant Architecture

### Tenant Isolation Strategy: Shared Database, Org-scoped Queries

```
All queries automatically filtered by org_id:

  SELECT * FROM kudos
  WHERE org_id = :currentUserOrgId    ← injected by OrgTenantGuard
  ORDER BY created_at DESC

Why this approach:
  - Simple for MVP (no DB-per-tenant complexity)
  - Cost-effective (single DB instance)
  - Easy data management & migrations
  - org_id indexed on all tables → fast queries
```

### Tenant Context Flow

```
JWT contains orgId
       │
       ▼
OrgTenantGuard extracts orgId from JWT
       │
       ▼
@OrgTenant() decorator injects orgId into service methods
       │
       ▼
All repository queries include WHERE org_id = :orgId
```

---

## 8. Event-Driven Architecture

### Event Flow (Redis Pub/Sub)

```
┌─────────────────────────────────────────────────────────┐
│                    Event Bus (internal)                   │
│                                                          │
│  Emitter                 Events              Handlers    │
│  ──────                 ────────             ────────    │
│                                                          │
│  KudosService    →   kudo.created    →   FeedGateway    │
│                                      →   NotificationSvc│
│                                      →   AIService      │
│                                      →   AnalyticsCache │
│                                                          │
│  RewardsService  →   reward.redeemed →   NotificationSvc│
│                                      →   AnalyticsCache │
│                                                          │
│  KudosService    →   kudo.reacted    →   FeedGateway    │
│                                      →   NotificationSvc│
│                                                          │
│  KudosService    →   kudo.commented  →   FeedGateway    │
│                                      →   NotificationSvc│
│                                                          │
│  AuthService     →   user.registered →   OnboardingSvc  │
│                                      →   BudgetService  │
│                                                          │
│  CronService     →   budget.reset    →   NotificationSvc│
│                                                          │
└─────────────────────────────────────────────────────────┘

Redis Pub/Sub Channels (cross-instance):
  - feed:{orgId}           → Real-time feed updates
  - notifications:{userId} → User-specific notifications
```

### Event Payload Examples

```typescript
// kudo.created
{
  type: 'kudo.created',
  orgId: 'org-uuid',
  payload: {
    kudoId: 'kudo-uuid',
    giverId: 'user-uuid',
    receiverId: 'user-uuid',
    points: 50,
    valueId: 'value-uuid',
    message: 'Great work on...',
  },
  timestamp: '2026-02-16T10:30:00Z',
}

// reward.redeemed
{
  type: 'reward.redeemed',
  orgId: 'org-uuid',
  payload: {
    redemptionId: 'redemption-uuid',
    userId: 'user-uuid',
    rewardId: 'reward-uuid',
    pointsSpent: 500,
  },
  timestamp: '2026-02-16T10:30:00Z',
}
```

---

## 9. Security

### Security Layers

```
┌──────────────────────────────────────────────────┐
│                 Security Stack                    │
│                                                   │
│  Layer 1: Network                                 │
│  ├─ HTTPS only (TLS 1.3)                         │
│  ├─ CORS whitelist (frontend origin only)         │
│  └─ Helmet.js (security headers)                  │
│                                                   │
│  Layer 2: Rate Limiting                           │
│  ├─ Global: 100 req/min per IP                    │
│  ├─ Auth endpoints: 5 req/min per IP              │
│  ├─ Give kudo: 20 req/min per user                │
│  └─ Redeem: 5 req/min per user                    │
│                                                   │
│  Layer 3: Authentication                          │
│  ├─ JWT (access + refresh token pair)             │
│  ├─ Password hashing: bcrypt (12 rounds)          │
│  ├─ Refresh token rotation                        │
│  └─ Google OAuth2 (optional)                      │
│                                                   │
│  Layer 4: Authorization                           │
│  ├─ RBAC (member, admin, owner)                   │
│  ├─ Org-scoped data isolation                     │
│  └─ Resource ownership checks                     │
│                                                   │
│  Layer 5: Input Validation                        │
│  ├─ class-validator on all DTOs                   │
│  ├─ SQL injection: TypeORM parameterized queries  │
│  ├─ XSS: sanitize user input (DOMPurify)          │
│  └─ CSRF: SameSite cookies + custom header        │
│                                                   │
│  Layer 6: Data Integrity                          │
│  ├─ DB transactions (SERIALIZABLE isolation)      │
│  ├─ Pessimistic locking (SELECT FOR UPDATE)       │
│  ├─ Idempotency keys (redemptions)                │
│  └─ Audit trail (point_ledger table)              │
│                                                   │
└──────────────────────────────────────────────────┘
```

### CSRF Protection Strategy

```
httpOnly cookie (refresh token)
  + SameSite=Strict
  + Custom header: X-Requested-With: XMLHttpRequest

→ Browser blocks cross-origin requests that include cookies
→ Custom header not sent by forms/scripts from other domains
```

---

## 10. Caching Strategy

```
┌─────────────────────────────────────────────────────┐
│                  Redis Cache Layers                   │
│                                                      │
│  Key Pattern              TTL      Purpose           │
│  ──────────────           ───      ──────            │
│  feed:{orgId}:page:{n}    60s      Feed page cache   │
│  user:{id}:balance        30s      Point balances    │
│  org:{id}:values          5min     Core values list  │
│  rewards:{orgId}          2min     Reward catalog    │
│  analytics:{orgId}:{key}  5min     Admin dashboard   │
│                                                      │
│  Cache Invalidation:                                 │
│  - Event-driven: kudo.created → clear feed cache     │
│  - Event-driven: reward.redeemed → clear balances    │
│  - TTL-based: analytics refresh every 5min           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 11. AI Features (Innovation - 10pts)

### 11.1 Semantic Search

```
Give Kudo Flow (background):
  1. User gives kudo with message
  2. After commit → emit kudo.created event
  3. AI handler: call OpenAI text-embedding-3-small
  4. Store 1536-dim vector in kudos.embedding column (pgvector)

Search Flow:
  1. User types search query: "teamwork on mobile app"
  2. API converts query → embedding via OpenAI
  3. PostgreSQL cosine similarity search:

     SELECT *, 1 - (embedding <=> :queryVector) AS similarity
     FROM kudos
     WHERE org_id = :orgId
     ORDER BY similarity DESC
     LIMIT 20

  4. Return ranked results with similarity scores
```

### 11.2 Monthly AI Summary

```
Request: GET /api/ai/summary/:userId?month=2026-02

Flow:
  1. Fetch all kudos received by user in given month
  2. Compile messages + core values + point totals
  3. Send to GPT-4o-mini with prompt:

     "Summarize this employee's achievements for February 2026.
      They received {count} recognitions totaling {points} points.
      Top values: {values}.
      Messages: {messages}.
      Write 3-5 bullet points highlighting key contributions."

  4. Cache result in Redis (24h TTL)
  5. Return formatted summary
```

---

## 12. Testing Strategy

### Test Pyramid

```
           ╱╲
          ╱  ╲
         ╱ E2E╲           ~10 tests
        ╱──────╲          API flow tests (supertest)
       ╱        ╲
      ╱Integration╲       ~30 tests
     ╱──────────────╲     Service + DB tests
    ╱                ╲
   ╱    Unit Tests    ╲    ~50+ tests
  ╱────────────────────╲   Pure logic, no DB
 ╱                      ╲
╱────────────────────────╲
```

### Unit Tests (Required by Grading)

```typescript
// Point calculation logic
describe('PointsService', () => {
  it('should deduct from giveable budget')
  it('should add to receiver redeemable balance')
  it('should reject if insufficient budget')
  it('should reject self-giving')
  it('should reject points outside 10-50 range')
});

// Budget reset logic
describe('BudgetService', () => {
  it('should reset budget on 1st of month')
  it('should not carry over unused points')
  it('should allocate org-configured amount')
});

// Redemption logic
describe('RewardsService', () => {
  it('should deduct from redeemable balance')
  it('should reject insufficient balance')
  it('should reject out-of-stock items')
  it('should handle idempotency key (no double spend)')
});
```

### Integration Tests (Required by Grading)

```typescript
// Give Kudo flow: API → DB
describe('POST /api/kudos', () => {
  it('should create kudo and update balances atomically')
  it('should return 400 for self-giving')
  it('should return 400 for insufficient budget')
  it('should emit kudo.created event')
  it('should appear in feed after creation')
});
```

### Edge Case Tests (Required by Grading)

```typescript
// Concurrent redemption (race condition)
describe('Concurrent Redemption', () => {
  it('should handle rapid double-click (idempotency)', async () => {
    const key = uuid();
    const [res1, res2] = await Promise.all([
      request.post('/api/rewards/1/redeem').send({ idempotencyKey: key }),
      request.post('/api/rewards/1/redeem').send({ idempotencyKey: key }),
    ]);
    // One succeeds, one returns existing result
    // Balance deducted only once
  });

  it('should prevent overspending with concurrent requests', async () => {
    // User has 500 pts, item costs 500 pts
    // Send 3 concurrent requests with different idempotency keys
    // Only 1 should succeed, others should fail with "Insufficient balance"
  });
});
```

### Test Tools

```
Backend:
  - Jest                → Test runner
  - Supertest           → HTTP integration tests
  - @nestjs/testing     → NestJS test utilities
  - testcontainers      → Real PostgreSQL + Redis in Docker for integration tests

Frontend:
  - Vitest              → Test runner (Vite-native)
  - React Testing Lib   → Component testing
  - MSW                 → API mocking
```

---

## 13. DevOps & CI/CD

### Docker Compose (Local Development)

```yaml
# docker-compose.yml structure
services:
  api:
    build: ./apps/api
    ports: ["3000:3000"]
    depends_on: [postgres, redis]
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/goodjob
      REDIS_URL: redis://redis:6379

  web:
    build: ./apps/web
    ports: ["5173:5173"]
    depends_on: [api]

  postgres:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### GitHub Actions CI/CD Pipeline

```
┌──────────────────────────────────────────────┐
│              CI Pipeline (on PR)              │
│                                               │
│  1. Lint & Type Check                         │
│     ├─ eslint (frontend + backend)            │
│     └─ tsc --noEmit                           │
│                                               │
│  2. Unit Tests                                │
│     ├─ jest (backend)                         │
│     └─ vitest (frontend)                      │
│                                               │
│  3. Integration Tests                         │
│     ├─ Start PostgreSQL + Redis (services)    │
│     ├─ Run migrations                         │
│     └─ jest --config jest.integration.config   │
│                                               │
│  4. Build Check                               │
│     ├─ npm run build (api)                    │
│     └─ npm run build (web)                    │
│                                               │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│           CD Pipeline (on main merge)         │
│                                               │
│  1. Build Docker images                       │
│  2. Push to registry                          │
│  3. Deploy to Fly.io                          │
│     ├─ API: fly deploy --app goodjob-api      │
│     └─ Web: fly deploy --app goodjob-web      │
│                                               │
└──────────────────────────────────────────────┘
```

---

## 14. Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goodjob

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxx

# App
APP_URL=http://localhost:5173
API_PORT=3000
NODE_ENV=development

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## 15. Implementation Order

### Sprint 1: Foundation (Days 1-3)

```
1. Project setup
   ├─ Monorepo structure (apps/web, apps/api)
   ├─ Docker Compose (PostgreSQL + Redis)
   ├─ NestJS boilerplate with config module
   ├─ React + Vite + Tailwind setup
   └─ CI pipeline (lint + type check)

2. Auth module
   ├─ User entity + migration
   ├─ Organization entity + migration
   ├─ Register endpoint (create user + org)
   ├─ Login endpoint (JWT pair)
   ├─ JWT strategy + guards
   ├─ Google OAuth2 (optional)
   └─ Auth unit tests

3. Core data models
   ├─ All entities + migrations
   ├─ Seed script (demo data)
   └─ Database indexes
```

### Sprint 2: Core Features (Days 4-6)

```
4. Kudos module
   ├─ Give kudo (atomic transaction)
   ├─ List kudos (cursor pagination)
   ├─ Reactions + Comments
   ├─ Unit + Integration tests
   └─ Edge case tests (self-give, budget exceeded)

5. Points module
   ├─ Ledger service
   ├─ Balance calculation
   ├─ Monthly budget reset (CRON)
   └─ Unit tests

6. Rewards module
   ├─ Catalog CRUD
   ├─ Redemption with idempotency
   ├─ Race condition tests
   └─ Integration tests
```

### Sprint 3: Real-time & Admin (Days 7-8)

```
7. Real-time feed
   ├─ Redis Pub/Sub setup
   ├─ SSE endpoint
   ├─ Event handlers
   └─ Feed caching

8. Admin module
   ├─ Analytics endpoints
   ├─ Leaderboard
   ├─ Core values report
   ├─ User management
   └─ Reward management
```

### Sprint 4: Frontend (Days 9-12)

```
9. Frontend foundation
   ├─ Auth pages (login, register, onboarding)
   ├─ App shell (sidebar, topbar)
   ├─ API client (axios + interceptors)
   └─ TanStack Query setup

10. Core pages
    ├─ Dashboard (kudos feed + SSE)
    ├─ Give Kudos modal
    ├─ Rewards catalog + redemption
    ├─ User profile
    └─ Kudo detail page

11. Admin pages
    ├─ Admin dashboard (charts)
    ├─ User management
    ├─ Reward management
    └─ Organization settings
```

### Sprint 5: Polish & Deploy (Days 13-14)

```
12. AI features
    ├─ Semantic search (pgvector)
    ├─ Monthly AI summary
    └─ Search UI

13. DevOps
    ├─ Dockerfile (multi-stage builds)
    ├─ CI/CD pipeline (GitHub Actions)
    ├─ Deploy to Fly.io
    └─ Production env setup

14. Final polish
    ├─ Loading states & error handling
    ├─ Mobile responsive fixes
    ├─ README documentation
    ├─ Demo data seeding
    └─ Final test coverage check
```

---

## 16. Key Architecture Decisions

| Decision | Choice | Why |
|:---|:---|:---|
| **Framework** | NestJS | JD requires it, enterprise-grade, modular, great DI |
| **ORM** | TypeORM | Best NestJS integration, migration support, decorators |
| **DB** | PostgreSQL + pgvector | Required relational DB + enables AI vector search |
| **Real-time** | SSE (not WebSocket) | Simpler, unidirectional (server→client), HTTP-native, no library needed |
| **State mgmt** | TanStack Query + Zustand | Server state (TQ) vs client state (Zustand) separation |
| **Build tool** | Vite | Fast HMR, lightweight, great DX |
| **Auth** | JWT + httpOnly cookies | Stateless, scalable, secure refresh token storage |
| **Rate limiting** | @nestjs/throttler + Redis | Built-in NestJS support, Redis for distributed limiting |
| **Testing** | Jest + Supertest + Testcontainers | Real DB in tests, no mocking DB layer |
| **Hosting** | Fly.io | Simple CLI deploy, free tier, PostgreSQL add-on |
| **AI** | OpenAI + pgvector | Best embeddings quality, pgvector avoids separate vector DB |
| **Monorepo** | npm workspaces | Simple, no extra tools (no nx/turborepo overhead for 2 apps) |

---

**Last Updated**: 2026-02-16
**Status**: Complete
**Next**: Phase 03 — Backend Development
