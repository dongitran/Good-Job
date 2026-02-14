# Phase 09 — Admin Reporting

## Objective

Build the protected admin dashboard with Core Value analytics, leaderboard, and summary stats. This completes all 4 use cases from the requirements.

---

## Business Rules

1. Only users with **admin role** can access reporting endpoints and pages
2. Non-admin users get **403 Forbidden** on admin routes
3. Analytics should support **date range filtering** (this week, this month, this quarter, all time)
4. Data must reflect real-time state (no stale cache for critical stats)

---

## Backend Implementation

### API Endpoints (all require @Roles('admin'))

**GET /api/analytics/summary** — Dashboard overview
- Total kudos sent (in period)
- Total points distributed (in period)
- Active users count (sent or received at least 1 kudo)
- Average points per kudo

**GET /api/analytics/core-values** — Core Value popularity
- Query params: startDate, endDate
- Response: `[{ coreValue: "Teamwork", emoji: "handshake", count: 45, percentage: 30 }]`
- Aggregation: COUNT kudos GROUP BY core_value_id, ordered DESC

**GET /api/analytics/leaderboard** — Top point receivers
- Query params: startDate, endDate, limit (default 10)
- Response: `[{ rank: 1, user: { id, displayName, avatarUrl }, totalReceived: 350 }]`
- Aggregation: SUM points received from kudos, GROUP BY receiver_id

### Query Optimization

- Use PostgreSQL aggregate functions directly (COUNT, SUM, GROUP BY)
- Add indexes: kudos(created_at), kudos(core_value_id), kudos(receiver_id)
- For large datasets: consider materialized views or periodic cache refresh
- For now: direct queries are fine at MVP scale

### Date Range Filtering

Support predefined and custom ranges:
- `period=week` → last 7 days
- `period=month` → last 30 days
- `period=quarter` → last 90 days
- `period=all` → no date filter
- `startDate=2026-01-01&endDate=2026-01-31` → custom range

---

## Frontend Implementation

### Admin Dashboard Page (`/admin`)

**Access Control:**
- Check user role on route load
- Non-admin → redirect to home with "Access denied" toast
- Admin → render dashboard

**Layout (responsive):**

```
Desktop:
┌──────────────────────────────────────────┐
│  [Date Range Filter]                     │
├──────────┬──────────┬──────────┬─────────┤
│ Total    │ Points   │ Active   │ Avg Pts │
│ Kudos    │ Given    │ Users    │ / Kudo  │
│ 156      │ 4,820    │ 42       │ 31      │
├──────────┴──────────┼──────────┴─────────┤
│                     │                    │
│  Core Value Chart   │   Leaderboard      │
│  (Bar/Pie Chart)    │   (Ranked Table)   │
│                     │                    │
└─────────────────────┴────────────────────┘

Mobile: Stack everything vertically
```

**Components:**
- **StatCard** — Icon + label + big number + trend indicator
- **CoreValueChart** — Bar chart or pie chart (use Recharts library)
- **LeaderboardTable** — Rank + avatar + name + points received
- **DateRangeFilter** — Preset buttons + custom date picker

### Charting Library

**Recharts** — Recommended because:
- Native React components (no wrapper needed)
- Good TypeScript support
- Lightweight
- Responsive by default

### Leaderboard Table

| Rank | User | Points Received |
|:-----|:-----|:----------------|
| 1 | Alice Johnson | 350 |
| 2 | Bob Smith | 280 |
| 3 | Carol Davis | 225 |

- Top 3 highlighted with gold/silver/bronze
- Avatar + display name
- Click to view user's kudo history (optional)

---

## Tests

**Unit Tests**:
- Analytics service: aggregation queries return correct shape
- Date range filter: verify correct date calculations

**Integration Tests**:
- Admin endpoints return correct data with seed data
- Non-admin user → 403 on all admin endpoints
- Date range filtering returns only data in range

**Auth Tests**:
- No token → 401
- User token → 403
- Admin token → 200

---

## Expected Output

- Admin dashboard accessible only to admins
- Summary stats display correctly
- Core value chart renders with real data
- Leaderboard shows ranked users
- Date filtering works across all analytics
- Non-admin access properly blocked

## Grading Points

- **Foundation** (complete): All 4 use cases implemented
- **Security** (partial): Role-based access control
- **UI/UX** (partial): Charts, responsive dashboard

## Next

→ Phase 10: Security Hardening
