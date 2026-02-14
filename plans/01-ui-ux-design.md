# Phase 01 — UI/UX Design

## Objective

Design the entire user experience before writing any code. Define user flows, page layouts, design system, and component inventory. This ensures every subsequent phase has a clear visual target.

## Why Design First?

- The JD values **Product-Centric Engineering** — designing before coding proves product thinking
- UI/UX is worth **10 points** in the grading rubric
- Grading requires: modern design, responsive, intuitive navigation, meaningful loading states
- Having a design upfront makes development faster and more consistent

---

## User Flows

**Flow A — Send Kudo**
Login → Feed → Click "Give Kudos" → Select colleague → Choose core value tag → Set points (10-50) → Write message → Confirm → Success feedback → Return to feed

**Flow B — Browse Feed**
Login → Feed page → Scroll (infinite) → See kudo cards → React with emoji → Click to view detail

**Flow C — Redeem Reward**
Login → Rewards catalog → Browse items → Click "Redeem" → Confirm dialog → Balance updated → View redemption history

**Flow D — Admin Dashboard**
Login (admin) → Admin panel → View core value chart → View leaderboard → Filter by date range

---

## Page Inventory

| Page | Route | Description |
|:-----|:------|:------------|
| Login | `/login` | Email + password, 2FA challenge |
| Register | `/register` | Create account form |
| Feed (Home) | `/` | Live kudos feed, infinite scroll |
| Send Kudo | modal overlay | Form to send recognition |
| Rewards Catalog | `/rewards` | Grid of redeemable items |
| Redemption History | `/rewards/history` | User's past redemptions |
| Profile | `/profile` | User info, balance, kudo history |
| Admin Dashboard | `/admin` | Charts + leaderboard (protected) |
| Settings | `/settings` | 2FA setup, preferences |

---

## Design System

**Colors** — Primary (vibrant, energetic), Secondary (accent), Neutral (gray scale), Semantic (green/red/amber/blue)

**Typography** — Bold headings (H1-H4), 16px body, mono for point values

**Spacing** — 4px base grid (4, 8, 12, 16, 24, 32, 48, 64)

**Breakpoints**
- Mobile: 320px — single column, bottom navigation
- Tablet: 768px — two columns, sidebar appears
- Desktop: 1024px+ — full layout with sidebar

---

## Component Inventory

**Core**: Button (with loading), Card, Avatar, Badge, Modal, Toast, Skeleton, Empty State

**Composite**:
- **KudoCard** — avatar + sender/receiver + core value badge + message + points + reactions + timestamp
- **RewardCard** — image + name + point cost + redeem button
- **PointBalance** — in navbar, animated on change
- **BudgetIndicator** — progress bar showing remaining giving budget
- **LeaderboardRow** — rank + avatar + name + points
- **CoreValueChart** — bar/pie chart for analytics
- **ReactionBar** — emoji buttons with counts

---

## Key UX Decisions

- **Send Kudo via modal** — keeps user in feed context, not a page redirect
- **Point slider** — visual slider (step of 5), shows remaining budget live
- **Infinite scroll** — no pagination buttons, modern feed experience
- **Skeleton loaders** — on every data view (not spinners)
- **Optimistic reactions** — update count immediately, revert on error
- **Confirm before redeem** — dialog prevents accidental clicks
- **Responsive nav** — sidebar on desktop, bottom tabs on mobile

---

## States for Every Page

- **Loading** — Skeleton placeholders matching layout shape
- **Empty** — Friendly message + call-to-action
- **Error** — Clear message + retry button

## Animations

- Kudo sent → confetti burst
- Balance update → number counting
- New kudo in feed → slide-in from top
- Reaction click → subtle bounce
- Toast → slide in from top-right, auto-dismiss

---

## Tools

- **Stitch MCP** for wireframes and mockups
- Tailwind CSS config for design tokens (set up in Phase 03)

## Output

- Wireframes for all pages (desktop + mobile)
- Documented user flows
- Component inventory
- Design decisions

## Next

→ Phase 02: Architecture Document
