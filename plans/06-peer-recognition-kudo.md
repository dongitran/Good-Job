# Phase 06 — Peer Recognition (Kudo)

## Objective

Implement the core feature: sending kudos with point allocation, budget enforcement, and atomic ledger recording. This is the heart of the application and the biggest contributor to Foundation points.

---

## Business Rules

1. A user can send **10–50 points** per kudo
2. Each kudo requires a **message** (mandatory) and a **core value tag**
3. Users have a **monthly giving budget of 200 points**, resets on the 1st
4. A user **cannot send a kudo to themselves**
5. A user **cannot exceed their remaining budget**
6. All point changes must be **atomic** (no partial state)

---

## Backend Implementation

### API Endpoints

**POST /api/kudos** — Send a kudo
- Input: receiverId, coreValueId, points (10-50), message
- Validates all business rules
- Executes atomic transaction
- Returns created kudo

**GET /api/kudos** — List kudos (cursor paginated)
- Returns: sender info, receiver info, core value, points, message, reaction counts, timestamp
- Cursor: base64 encoded `{ createdAt, id }`
- Default page size: 20

**GET /api/kudos/:id** — Single kudo detail with reactions

**GET /api/users/me/budget** — Current month's giving budget
- Returns: totalBudget, spent, remaining

### Transaction Flow (Send Kudo)

This is the most critical flow. Must be atomic:

```
BEGIN TRANSACTION
  1. Lock sender's giving_budget row (SELECT FOR UPDATE)
  2. Verify remaining >= requested points
  3. Verify receiver exists and is not the sender
  4. Create kudo record
  5. Update giving_budget: spent += points
  6. Create ledger entry for receiver: +points (kudo_received)
  7. Create ledger entry for sender budget: -points (kudo_sent_budget)
COMMIT
```

If any step fails → ROLLBACK → return error.

### Budget Management

- **Lazy initialization**: On first API call each month, check if budget row exists for current month. If not, create one with spent=0.
- **No cron job needed**: Budget "resets" naturally because a new month creates a new row.
- **Remaining calculation**: total_budget (200) - spent

### Core Values Module

- GET /api/core-values — List all core values
- Seeded in migration (Phase 05): Teamwork, Ownership, Innovation, Quality, Customer Focus
- Each has a name and emoji for display

---

## Frontend Implementation

### Send Kudo Modal

1. User clicks "Give Kudos" button (prominent CTA in navbar)
2. Modal opens with form:
   - **Colleague selector** — searchable dropdown, fetches from `/api/users`
   - **Core Value tags** — chip/radio group, one required
   - **Point slider** — range 10-50, step of 5
   - **Budget indicator** — progress bar showing remaining budget, updates live as slider moves
   - **Message textarea** — required, max 500 chars, character counter
3. Submit → loading state on button
4. Success → confetti animation + toast + close modal + new kudo appears in feed
5. Error → inline error message (budget exceeded, self-kudo, etc.)

### Kudo Display in Feed

Each kudo card shows:
- Sender avatar + name → "gave kudos to" → Receiver name
- Core value badge (colored chip)
- Points badge
- Message text
- Relative timestamp ("2 hours ago")
- Reaction bar (Phase 08)

---

## Validation Rules

| Rule | Where | Error |
|:-----|:------|:------|
| Points 10-50 | DTO + DB CHECK | "Points must be between 10 and 50" |
| Message required | DTO | "Message is required" |
| Message max 500 chars | DTO | "Message too long" |
| Cannot self-kudo | Service | "You cannot send kudos to yourself" |
| Budget exceeded | Service (in transaction) | "Insufficient giving budget" |
| Receiver exists | Service | "User not found" |
| Core value exists | Service | "Invalid core value" |

---

## Tests

**Unit Tests**:
- Budget calculation: 200 - spent = remaining
- Validation: points outside 10-50 range rejected
- Self-kudo prevention logic

**Integration Tests**:
- Send kudo → verify kudo in DB + ledger entries created + budget updated
- Send kudo → verify receiver balance increased

**Edge Case Tests**:
- Send kudo to yourself → 400
- Send 200 points when budget is 150 → 400
- Send kudo with points = 0 → 400
- Send kudo with points = 100 → 400
- Send kudo to non-existent user → 404

**Concurrency Tests**:
- Two concurrent kudo sends that would exceed budget → only one succeeds
- Fire 5 parallel requests spending 50 pts each (budget=200) → max 4 succeed

---

## Expected Output

- Users can send kudos with full validation
- Budget is enforced atomically
- Ledger entries created for every transaction
- Frontend modal works with live budget display
- All tests pass (including concurrency)

## Grading Points

- **Foundation** (major): Core CRUD for kudos, error handling
- **Code Quality** (significant): Unit tests, race-condition handling
- **Integrity** (partial): Atomic transactions, ledger entries

## Next

→ Phase 07: Reward Redemption
