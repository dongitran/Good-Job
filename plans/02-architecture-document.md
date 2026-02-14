# Phase 02 — Architecture Document

## Objective

Define the complete system architecture before writing code. Cover high-level design, data model, API contracts, and key technical decisions. This becomes the reference for all implementation phases.

---

## High-Level Architecture

```
[React SPA] ←REST→ [NestJS API] ←→ [PostgreSQL]
     ↕ WebSocket          ↕
                       [Redis]
                (cache + pub/sub + WS adapter)
```

- **Frontend**: React 18 SPA → REST API + WebSocket
- **Backend**: NestJS monolith, modular (ready for microservice extraction)
- **Database**: PostgreSQL (transactional), Redis (cache + real-time)

---

## Data Model

### Entity Relationships

```
users ──< kudos >── users (sender → receiver)
  │          └── kudo_reactions
  ├── giving_budgets (one per user per month)
  ├── redemptions >── rewards
  └── point_ledger (append-only audit trail)
```

### Core Tables

**users** — id, email, password_hash, display_name, avatar_url, role (user/admin)

**core_values** — id, name, emoji, description. Seeded: Teamwork, Ownership, Innovation, Quality, Customer Focus

**kudos** — id, sender_id, receiver_id, core_value_id, points (10-50), message. Constraint: sender != receiver

**giving_budgets** — id, user_id, month, total_budget (200), spent. Unique: (user_id, month). Lazy init on first use each month.

**point_ledger** — Append-only. id, user_id, amount (+/-), balance_after, transaction_type, reference_id. Types: kudo_received, kudo_sent_budget, redemption, budget_reset

**rewards** — id, name, description, point_cost, image_url, stock, is_active

**redemptions** — id, user_id, reward_id, points_spent, status, idempotency_key (UNIQUE)

**kudo_reactions** — id, kudo_id, user_id, emoji. Unique: (kudo_id, user_id, emoji)

---

## API Contracts

### Auth
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login → JWT |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/auth/2fa/setup | Generate TOTP QR |
| POST | /api/auth/2fa/validate | Verify TOTP |

### Kudos
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | /api/kudos | Send kudo |
| GET | /api/kudos | List (cursor paginated) |
| GET | /api/kudos/:id | Detail with reactions |
| POST | /api/kudos/:id/reactions | Toggle reaction |

### Rewards
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | /api/rewards | List catalog |
| POST | /api/rewards | Create (admin) |
| POST | /api/redemptions | Redeem reward |
| GET | /api/redemptions | User history |

### Users
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | /api/users/me | Profile |
| GET | /api/users/me/balance | Point balance |
| GET | /api/users/me/budget | Monthly budget |
| GET | /api/users | List (colleague selector) |

### Analytics (Admin only)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | /api/analytics/core-values | Popularity stats |
| GET | /api/analytics/leaderboard | Top receivers |
| GET | /api/analytics/summary | Overview |

### WebSocket Events
| Event | Direction | Description |
|:------|:----------|:------------|
| kudo:created | Server → Client | New kudo broadcast |
| kudo:reaction | Server → Client | Reaction update |

---

## Key Technical Decisions

**TypeORM over Prisma** — Native NestJS integration, fine-grained transaction control (QueryRunner), better pessimistic locking support for ledger pattern.

**Cursor Pagination over Offset** — No skipped/duplicate items during scrolling, better performance, cursor = base64 `{ createdAt, id }`.

**Pessimistic Locking** — SELECT FOR UPDATE on budget row (kudo) and balance row (redemption). Prevents race conditions on concurrent requests.

**Idempotency Key for Redemptions** — Client generates UUID, UNIQUE constraint prevents duplicates. Same key on retry → returns existing result.

**Redis Multi-role** — Cache (feed, balances), Pub/Sub (event broadcast), WebSocket adapter (Socket.IO scaling), Rate limiting (distributed counters).

**Ledger as Source of Truth** — All point mutations go through point_ledger. Balance = SUM(amount) or latest balance_after. Never update balance directly.

---

## Non-Functional Requirements

- API response < 200ms
- Concurrent operations without data corruption
- Graceful degradation when Redis is down
- JWT auth + rate limiting + CSRF + 2FA

## Next

→ Phase 03: Project Scaffolding
