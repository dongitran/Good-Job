# Phase 11 — Event Sourcing & Engineering

## Objective

Implement event-driven architecture to earn the Engineering category points (10pts). The grading criteria specifically mention Event Sourcing for point history or Pub/Sub for real-time feed updates.

---

## What the Grading Requires

> Advanced Architecture: Event Sourcing (for point history) or Pub/Sub (Redis/RabbitMQ) for real-time feed updates

We implement **both** — Event Sourcing as the architectural pattern, Pub/Sub as the transport.

---

## Architecture Approach: Hybrid Event Sourcing

**Pure Event Sourcing** = rebuild state entirely from events. Impractical for a coding test.

**Hybrid approach** = keep existing tables for reads (ledger, kudos) but add an event store as a parallel audit/replay mechanism. This demonstrates understanding without over-engineering.

```
[Command] → [Service] → [DB Transaction] → [Publish DomainEvent]
                                                    ↓
                                            [Event Store (DB)]
                                                    ↓
                                            [Event Handlers]
                                              ↓         ↓
                                        [WebSocket]  [Cache Invalidation]
```

---

## Event Store

### New Table: domain_events

| Column | Type | Description |
|:-------|:-----|:------------|
| id | UUID | Primary key |
| aggregate_type | VARCHAR | 'user', 'kudo', 'redemption' |
| aggregate_id | UUID | The entity this event belongs to |
| event_type | VARCHAR | 'KudoSent', 'PointsReceived', 'RewardRedeemed' |
| payload | JSONB | Full event data |
| metadata | JSONB | userId, IP, userAgent, timestamp |
| version | INTEGER | Per-aggregate version (ordering) |
| created_at | TIMESTAMP | When the event occurred |

Index: (aggregate_type, aggregate_id, version)

### Domain Events

| Event | When | Payload |
|:------|:-----|:--------|
| KudoSent | User sends a kudo | senderId, receiverId, points, coreValue, message |
| PointsReceived | User receives points | userId, amount, source, sourceId |
| RewardRedeemed | User redeems reward | userId, rewardId, pointsSpent |
| BudgetReset | Monthly budget resets | userId, month, newBudget |
| ReactionAdded | Emoji reaction added | kudoId, userId, emoji |

---

## NestJS CQRS Implementation

### Using @nestjs/cqrs Module

This is the idiomatic NestJS way to implement command/event patterns.

**Commands** — Represent intent (what the user wants to do):
- `SendKudoCommand` → handled by `SendKudoHandler`
- `RedeemRewardCommand` → handled by `RedeemRewardHandler`

**Events** — Represent facts (what happened):
- `KudoSentEvent` → handled by multiple event handlers
- `RewardRedeemedEvent` → handled by multiple event handlers

**Flow:**
1. Controller receives request → dispatches Command via CommandBus
2. CommandHandler executes business logic + DB transaction
3. After commit → publishes Event via EventBus
4. EventHandlers react asynchronously:
   - Store event in domain_events table
   - Broadcast via Redis Pub/Sub
   - Invalidate caches
   - Update read models (if needed)

### Refactoring Existing Code

Current flow (Phase 06):
```
Controller → Service → DB Transaction → Return
```

New flow with CQRS:
```
Controller → CommandBus.execute(SendKudoCommand)
  → SendKudoHandler → DB Transaction → EventBus.publish(KudoSentEvent)
    → EventHandler 1: Store in domain_events
    → EventHandler 2: Publish to Redis Pub/Sub
    → EventHandler 3: Invalidate feed cache
```

The key change: **side effects are decoupled from the main transaction**.

---

## Redis Pub/Sub Integration

### Current State (Phase 08)

WebSocket gateway broadcasts directly from service code.

### After This Phase

```
Service → Redis PUBLISH → Redis SUBSCRIBE → WebSocket Gateway → Clients
```

**Channels:**
- `events:kudo` — New kudo events
- `events:reaction` — Reaction changes
- `events:redemption` — Reward redemptions

**Benefits:**
- HTTP handler returns immediately (not waiting for broadcast)
- Multiple API instances share events through Redis
- WebSocket gateway is decoupled from business logic
- Easy to add new consumers (email notifications, analytics, etc.)

---

## Point History Reconstruction

### New Endpoint

**GET /api/users/:id/point-history** — Timeline of all point events
- Source: domain_events table (filtered by aggregate_type='user')
- Returns chronological list of events
- Frontend: timeline visualization on user profile

### Why This Matters

- Demonstrates that the event store can **reconstruct** a user's complete history
- Shows understanding of event sourcing's core value: the event log IS the source of truth
- Any past state can be derived by replaying events up to that point

---

## Tests

**Event Store Tests**:
- Events persisted correctly after kudo creation
- Events persisted correctly after redemption
- Event version increments per aggregate

**Event Handler Tests**:
- KudoSentEvent → triggers WebSocket broadcast
- KudoSentEvent → invalidates feed cache
- Events processed in order

**Point History Tests**:
- Reconstruct user timeline from events
- Verify balance matches ledger (cross-validation)

---

## Expected Output

- Domain events stored for every significant action
- Side effects triggered via event handlers (not inline)
- WebSocket broadcasts driven by Redis Pub/Sub
- Point history endpoint returns complete timeline
- CQRS pattern cleanly separates commands from queries

## Grading Points

- **Engineering** (complete): Event Sourcing + Pub/Sub = full 10 points

## Next

→ Phase 12: AI Innovation
