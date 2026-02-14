# Phase 05 — Database & Auth

## Objective

Create the database schema with migrations, implement the ledger pattern, and build JWT authentication. This is the most critical architectural phase — everything depends on the data model.

---

## Database Setup

### 1. TypeORM Configuration

- Connect to PostgreSQL via TypeORM module
- Enable migrations (not auto-sync in production)
- Configure naming strategy (snake_case for DB columns)

### 2. Migrations to Create

Run in order:

1. **Create users table** — id (UUID), email (unique), password_hash, display_name, avatar_url, role (enum: user/admin), timestamps
2. **Create core_values table** — id, name (unique), emoji, description. Seed with: Teamwork, Ownership, Innovation, Quality, Customer Focus
3. **Create kudos table** — id, sender_id (FK), receiver_id (FK), core_value_id (FK), points (CHECK 10-50), message, created_at. Add CHECK: sender_id != receiver_id
4. **Create giving_budgets table** — id, user_id (FK), month (date), total_budget (default 200), spent (default 0). UNIQUE(user_id, month)
5. **Create point_ledger table** — id, user_id (FK), amount, balance_after, transaction_type (enum), reference_id, reference_type, description, created_at. INDEX on (user_id, created_at)
6. **Create rewards table** — id, name, description, point_cost, image_url, stock, is_active, timestamps
7. **Create redemptions table** — id, user_id (FK), reward_id (FK), points_spent, status (enum), idempotency_key (UNIQUE), created_at
8. **Create kudo_reactions table** — id, kudo_id (FK), user_id (FK), emoji, created_at. UNIQUE(kudo_id, user_id, emoji)

### 3. Seed Data

- 5-10 demo users (1 admin, rest regular users)
- 5 core values with emojis
- 5 rewards with varying point costs (100, 250, 500, 1000, 2000)

---

## Ledger Pattern

### How It Works

The `point_ledger` table is **append-only**. Every point change creates a new row.

**Flow: User receives a kudo (50 points)**
1. Insert ledger entry: user_id=receiver, amount=+50, type=kudo_received
2. The `balance_after` field = previous balance + 50

**Flow: User redeems a reward (500 points)**
1. Insert ledger entry: user_id=redeemer, amount=-500, type=redemption
2. The `balance_after` field = previous balance - 500

**Getting current balance**: Read the latest `balance_after` for the user, or `SUM(amount)` as fallback.

### Why This Pattern?

- Full audit trail — every point change is traceable
- No lost updates — never UPDATE a balance field directly
- Debugging — can reconstruct any user's balance at any point in time
- Required by grading criteria (Integrity: 10 points)

---

## Auth System

### Backend Flow

**Register**: `POST /api/auth/register`
1. Validate email format + password strength
2. Hash password with bcrypt (12 rounds)
3. Create user record
4. Return user profile (no password)

**Login**: `POST /api/auth/login`
1. Find user by email
2. Compare password hash
3. Generate JWT access token (15min expiry)
4. Generate refresh token (7 days, stored in DB)
5. Return both tokens

**Refresh**: `POST /api/auth/refresh`
1. Validate refresh token
2. Check not revoked
3. Issue new access token
4. Return new token pair

### Guards & Decorators

- **JwtAuthGuard** — Global guard, validates JWT on every request
- **@Public()** — Decorator to skip auth (login, register, health)
- **RolesGuard** — Checks user role for protected routes
- **@Roles('admin')** — Decorator to require admin role
- **@CurrentUser()** — Param decorator to extract user from JWT

### Frontend Flow

1. Login page sends credentials → receives JWT pair
2. Store access token in memory (not localStorage for security)
3. Store refresh token in httpOnly cookie (or secure storage)
4. Axios interceptor: attach token to every request
5. On 401: attempt refresh, retry original request
6. On refresh fail: redirect to login
7. Auth context/provider wraps the app

---

## Tests for This Phase

**Unit Tests**:
- Password hashing and comparison
- JWT token generation and validation
- Ledger balance calculation logic

**Integration Tests**:
- Register → verify user in DB
- Login → verify JWT returned
- Login with wrong password → 401
- Refresh with invalid token → 401
- Access protected route without token → 401

---

## Expected Output

- All 8 migrations run successfully
- Seed data populates demo users, core values, rewards
- Auth endpoints work end-to-end (register, login, refresh)
- Frontend login flow works
- Guards protect routes correctly
- All tests pass

## Grading Points

- **Code Quality** (significant): Relational DB properly designed
- **Integrity** (partial): Ledger pattern implemented
- **Security** (partial): Password hashing, JWT auth, role-based access

## Next

→ Phase 06: Peer Recognition (Kudo)
