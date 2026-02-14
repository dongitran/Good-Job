# Phase 08 — Live Kudos Feed

## Objective

Build the real-time kudos feed with infinite scroll, emoji reactions, and WebSocket updates. This phase introduces real-time communication and optimized query patterns.

---

## Features

1. **Infinite scroll feed** — cursor-based pagination, loads more on scroll
2. **Real-time updates** — new kudos appear at the top without page refresh
3. **Emoji reactions** — users can react to kudos with emojis
4. **Optimized queries** — efficient data loading with caching

---

## Backend Implementation

### Feed Module

**GET /api/feed** — Paginated feed of all kudos
- Joins: kudo + sender + receiver + core_value
- Includes aggregated reactions: `[{ emoji: "fire", count: 5, hasReacted: true }]`
- Cursor pagination: encode `{ createdAt, id }` as base64
- Default page size: 20
- Redis cache on first page (invalidate on new kudo)

### Reactions Module

**POST /api/kudos/:id/reactions** — Add reaction
- Input: emoji (from predefined set: fire, heart, clap, celebrate, thumbsup, laugh)
- Toggle behavior: if reaction exists → remove it, if not → add it
- Return updated reaction counts for the kudo

**DELETE /api/kudos/:id/reactions/:emoji** — Remove specific reaction

Reaction aggregation query:
- Group by emoji, count per emoji
- Include `hasReacted` flag for current user
- Cache reaction counts in Redis (invalidate on change)

### WebSocket Gateway

Using NestJS WebSocket module with Socket.IO:

**Events emitted by server:**
- `kudo:created` — Broadcast when a new kudo is sent. Payload: full kudo data.
- `kudo:reaction` — Broadcast when a reaction changes. Payload: kudoId + updated counts.

**How it connects to kudo creation:**
1. User sends kudo via REST API (POST /api/kudos)
2. KudosService creates the kudo in DB
3. KudosService publishes event to Redis Pub/Sub channel
4. WebSocket Gateway subscribes to Redis channel
5. Gateway broadcasts to all connected clients

**Why Redis Pub/Sub in between?**
- Decouples HTTP handler from WebSocket broadcast
- Works across multiple server instances (horizontal scaling)
- Gateway only needs to listen to Redis, not know about business logic

### Redis Adapter for Socket.IO

- Install `@socket.io/redis-adapter`
- Allows multiple API instances to share WebSocket connections
- Demonstrates senior-level understanding of scaling

---

## Frontend Implementation

### Feed Page

**Layout:**
- Full-width feed of kudo cards
- "Give Kudos" floating action button
- Point balance in header

**Infinite Scroll:**
- Use `IntersectionObserver` on a sentinel element at bottom
- When visible → fetch next page using cursor
- Show skeleton loaders while loading
- Show "You're all caught up" when no more items

**Real-time Updates:**
- Connect to WebSocket on page mount
- On `kudo:created` event → prepend new kudo card with slide-in animation
- On `kudo:reaction` event → update reaction counts on the relevant card
- Disconnect on page unmount

### Kudo Card Component

```
┌─────────────────────────────────────┐
│ [Avatar] Sender Name → Receiver     │
│          #CoreValue    [50 pts]     │
│                                     │
│ "Great work on the release..."      │
│                                     │
│ 🔥 5  ❤️ 3  👏 12      2 hours ago  │
└─────────────────────────────────────┘
```

- Sender avatar + name, arrow, receiver name
- Core value badge (colored chip)
- Points badge
- Message text (truncate with "show more" if long)
- Reaction bar: clickable emojis with counts
- Relative timestamp

### Reaction Interaction

1. Click emoji → optimistic update (increment count immediately)
2. Send POST /api/kudos/:id/reactions
3. If error → revert count (optimistic rollback)
4. If already reacted → remove (toggle behavior)
5. Emoji picker: 6 preset emojis as buttons (no custom picker needed)

---

## Socket.IO Connection Management

- Connect on app mount (authenticated with JWT)
- Auto-reconnect on disconnect
- Show connection status indicator (optional: subtle dot in header)
- Clean up on unmount

---

## Tests

**Unit Tests**:
- Feed service: pagination logic, cursor encoding/decoding
- Reaction service: toggle logic, aggregation

**Integration Tests**:
- GET /api/feed: verify pagination, cursor works, data shape correct
- POST /api/kudos/:id/reactions: verify toggle, counts update
- WebSocket: connect, receive kudo:created event after sending kudo

**Performance Consideration**:
- Feed query should use proper indexes (created_at DESC, id)
- Reaction aggregation should not N+1 (use subquery or batch load)

---

## Expected Output

- Feed page loads with infinite scroll
- New kudos appear in real-time via WebSocket
- Emoji reactions work with toggle and optimistic updates
- Skeleton loaders shown during data fetch
- WebSocket connection stable with auto-reconnect

## Grading Points

- **Integrity** (partial): Cursor pagination, optimized feed
- **Engineering** (partial): Pub/Sub via WebSocket + Redis
- **UI/UX** (partial): Loading states, responsive cards

## Next

→ Phase 09: Admin Reporting
