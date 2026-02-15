# Phase 01 — UI/UX Design

## Overview

**Status**: ✅ Phase 1 Complete | ✅ Phase 2 Complete
**Goal**: Design complete UI flow from landing page through authenticated app experience
**Approach**: HTML prototypes with Tailwind CSS, mobile-responsive

---

## Design System (From Landing Page)

### Typography
- **Display/Headings**: Poppins (300-900)
- **Body/UI**: Inter (300-900)

### Color Palette
```css
Primary:   #7C3AED (Amanotes Purple)
Blue:      #3B82F6
Pink:      #EC4899
Orange:    #F97316
Cyan:      #06B6D4
Green:     #10B981
Yellow:    #F59E0B
Dark:      #0F172A
Dark-Alt:  #1E293B
```

### Key Patterns
- Gradient backgrounds: `linear-gradient(135deg, purple → blue/pink/orange)`
- Glass morphism: `backdrop-blur(20px)`
- Rounded corners: `rounded-3xl` (1.5rem), `rounded-4xl` (2rem)
- Animated gradients on hover

---

## Screen Architecture

### User Flow Map

```
Landing Page (✅ Done)
    ↓ Get Started
Auth Modal (Sign Up/Sign In)
    ↓ New user
Onboarding Wizard (5 steps)
    ↓
Dashboard (Main App)
    ├─ Give Kudos Modal
    ├─ Rewards Catalog
    ├─ User Profile
    └─ Admin Dashboard
```

---

## Screens to Design (Priority Order)

### ✅ 00. Landing Page
**Status**: Complete
**File**: `designs/ui/prototypes/00-landing-page/index.html`
**Screenshot**: `designs/ui/images/00-landing-page.jpg`

**Sections**:
- Hero with animated gradient
- Feature showcase
- How it works
- Pricing tiers
- CTA: "Get Started"

---

### ✅ 01. Authentication Modal
**Priority**: Must Have
**File**: `designs/ui/prototypes/01-auth-modal/index.html`

**Layout**: Modal overlay on landing page

**Components**:
- Tab switcher: Sign Up | Sign In
- **Sign Up Tab**:
  - Full name input
  - Email input
  - Password input (with strength indicator)
  - Checkbox: "I agree to Terms & Privacy"
  - Button: "Create Account & Start 14-Day Trial"
  - Divider: "or continue with"
  - Social login buttons (Google, Microsoft) - UI only
  - Footer: "Already have account? Sign In"

- **Sign In Tab**:
  - Email input
  - Password input
  - Checkbox: "Remember me" | Link: "Forgot password?"
  - Button: "Sign In"
  - Footer: "Don't have account? Sign Up"

**UX Notes**:
- Modal dims landing page background
- Close button (X) in top-right
- Click outside to close (optional)
- Mobile: Full-screen modal on small screens
- Validation: Show errors inline below fields

**Design Inspiration**: Modern SaaS (Notion, Linear, Vercel)

---

### ✅ 02. Onboarding Wizard
**Priority**: Must Have
**File**: `designs/ui/prototypes/02-onboarding/index.html`

**Layout**: Full-page multi-step wizard with progress indicator

**Steps**:

**Step 1: Welcome**
- Headline: "Welcome to Good Job! 👋"
- Subtext: "Let's set up your recognition platform in under 2 minutes"
- Progress: 1/5
- Button: "Let's Go!"

**Step 2: Create Organization**
- Form:
  - Organization name input
  - Industry dropdown (Tech, Agency, Manufacturing, Other)
  - Company size dropdown (1-10, 11-50, 51-200, 201-500, 500+)
- Progress: 2/5
- Buttons: "Back" | "Continue"

**Step 3: Choose Core Values**
- Headline: "What values drive your team?"
- Options:
  - Tabs: "Use Template" | "Custom"
  - Template presets:
    - Tech Startup: Teamwork, Innovation, Ownership, Customer-First
    - Agency: Creativity, Collaboration, Excellence, Accountability
    - Manufacturing: Safety, Quality, Efficiency, Respect
  - Custom: Text inputs to add 3-5 values
- Preview: Tag chips showing selected values
- Progress: 3/5
- Buttons: "Back" | "Continue"

**Step 4: Invite Team Members**
- Headline: "Invite your team"
- Options:
  - Email list (comma-separated textarea)
  - OR: "Skip for now" link
- Info box: "💡 You can also invite teammates later from settings"
- Progress: 4/5
- Buttons: "Back" | "Send Invites" or "Skip"

**Step 5: Demo Mode**
- Headline: "Start with sample data?"
- Card options (choose one):
  - **Option A: Demo Mode** ✨
    - Icon: 🎭
    - "Start with 5 sample kudos from demo team"
    - "Perfect for exploring features"
    - "You can clear this data anytime"
  - **Option B: Fresh Start**
    - Icon: ✨
    - "Start with a clean slate"
    - "Give your first kudos to get started"
- Progress: 5/5
- Button: "Launch Dashboard"

**UX Notes**:
- Progress bar at top (visual indicator)
- Step numbers in circles
- Animate transitions between steps (slide)
- Auto-save draft (mention in UI)
- Mobile: Stack form fields vertically

**Design Inspiration**: Stripe onboarding, Typeform

---

### ✅ 03. Dashboard (Main App Shell + Kudos Feed)
**Priority**: Must Have
**File**: `designs/ui/prototypes/03-dashboard/index.html`

**Layout**: App shell with sidebar navigation

**Sidebar** (Left, collapsible on mobile):
- Logo + Org name
- Navigation items:
  - 🏠 Dashboard (active)
  - 🎁 Rewards
  - 👤 Profile
  - ⚙️ Settings
  - 🛠 Admin (if admin role)
- Bottom: "Give Kudos" button (primary, gradient)

**Top Bar**:
- Search bar (placeholder: "Search kudos, people...")
- Points balance widget: "💰 850 pts" (Redeemable)
- Notifications bell icon (with badge)
- User avatar dropdown (name, "Sign Out")

**Main Content - Kudos Feed**:

- **Header**:
  - Title: "Recognition Feed"
  - Subtitle: "Celebrate wins across the team 🎉"
  - Filter pills: "All Values" | #Teamwork | #Innovation | #Ownership

- **Feed Cards** (Infinite scroll):
  - Each card:
    - Avatar (giver)
    - Giver name + "→" + Recipient name
    - Points badge: "50 pts"
    - Core value tag: #Teamwork (colored pill)
    - Message text
    - Timestamp: "2 hours ago"
    - Reaction bar:
      - Emoji reactions: ❤️ 12  👏 8  🎉 5  🚀 3
      - Comment count: 💬 3
    - Actions: React | Comment

- **Empty State** (if no kudos):
  - Illustration (simple SVG)
  - Headline: "No kudos yet!"
  - Subtext: "Be the first to recognize a teammate"
  - Button: "Give First Kudos"

**Sticky Elements**:
- Top bar (fixed on scroll)
- "Give Kudos" button (floating action button on mobile)

**Mobile Adaptations**:
- Sidebar → Bottom nav bar (4 items)
- Top bar → Simplified (just logo + avatar)
- Feed cards → Full width, stack content

**Design Inspiration**: LinkedIn feed, Twitter timeline, Kudos.com

---

### ✅ 04. Give Kudos Modal
**Priority**: Must Have
**File**: `designs/ui/prototypes/04-give-kudos-modal/index.html`

**Trigger**: Click "Give Kudos" button from Dashboard

**Layout**: Large modal (centered, overlay)

**Form**:
- **Recipient Selection**:
  - Searchable dropdown (autocomplete)
  - Placeholder: "Who do you want to recognize?"
  - Shows: Avatar + Name + Role

- **Points Amount**:
  - Slider: 10 ← → 50 pts
  - Current selection shown large: "30 pts"
  - Info text: "Your remaining budget: 150 pts this month"
  - Warning if insufficient: "⚠️ Not enough points (need 10 more)"

- **Core Value**:
  - Radio pills (select one):
    - #Teamwork
    - #Innovation
    - #Ownership
    - #Customer-First
  - Each pill has icon + color (from org settings)

- **Recognition Message**:
  - Textarea (min 10 chars)
  - Placeholder: "Why does this person deserve recognition?"
  - Character counter: "0 / 500"

- **Preview Card** (updates live):
  - Shows how kudos will appear in feed
  - Avatar, names, points, tag, message

**Actions**:
- Button: "Send Recognition" (gradient, disabled until valid)
- Link: "Cancel"

**UX Notes**:
- Validate on submit (show errors inline)
- Success: Show confetti animation + "Kudos sent! 🎉"
- Auto-close modal after 2 sec
- Refresh feed to show new kudos
- Mobile: Full-screen modal

**Design Inspiration**: Bonusly /give command, Slack modals

---

### ✅ 05. Rewards Catalog
**Priority**: Must Have
**File**: `designs/ui/prototypes/05-rewards-catalog/index.html`

**Layout**: App shell + Grid layout

**Header**:
- Title: "Reward Catalog"
- Subtitle: "Redeem your points for awesome perks"
- Your balance: "💰 850 pts available"

**Sidebar** (Filters):
- Categories:
  - ☐ All (default)
  - ☐ Swag (3)
  - ☐ Gift Cards (5)
  - ☐ Time Off (2)
  - ☐ Experiences (4)
- Points range slider:
  - 0 ← → 2000 pts

**Main Grid** (3 columns on desktop, 1 on mobile):
- **Reward Card**:
  - Image (product photo)
  - Title: "Company Hoodie"
  - Points cost: "500 pts" (large, gradient text)
  - Stock status: "✅ In stock" or "⚠️ Limited (3 left)" or "❌ Out of stock"
  - Short description (1-2 lines)
  - Button: "Redeem" (or "Not enough points" disabled)
  - Hover: Scale up, show shadow

**Example Rewards**:
1. Company Hoodie - 500 pts
2. $25 Coffee Gift Card - 300 pts
3. Friday Afternoon Off - 1000 pts
4. Team Lunch Budget $100 - 800 pts
5. Learning Budget $50 - 600 pts
6. Wireless Earbuds - 1200 pts

**Empty State** (no rewards):
- "No rewards available yet"
- "Ask your admin to add rewards"

**Redemption Flow** (Modal):
- Confirm redemption
- Deduct points
- Success message: "Redeemed! 🎉 Check your email for next steps"

**Design Inspiration**: Shopify, Product Hunt, Bonusly Reward Store

---

### ✅ 06. Admin Dashboard
**Priority**: Should Have
**File**: `designs/ui/prototypes/06-admin-dashboard/index.html`

**Layout**: App shell + Analytics grid

**Header**:
- Title: "Admin Dashboard"
- Date range picker: "Last 30 days ▼"
- Export button: "📊 Export Report"

**Metrics Cards** (Top row, 4 cards):
1. **Total Kudos Sent**
   - Number: 247
   - Change: "↑ 12% vs last month"
   - Mini chart (sparkline)

2. **Active Users**
   - Number: 38 / 45
   - Percentage: "84% participation"
   - Icon: 👥

3. **Points Redeemed**
   - Number: 4,250 pts
   - Value: "~$425 in rewards"
   - Icon: 🎁

4. **Top Core Value**
   - Tag: #Teamwork
   - Count: "92 mentions"
   - Icon: ⭐

**Charts Section** (2 columns):

**Left Column - Core Values Distribution**:
- Donut chart:
  - #Teamwork: 37%
  - #Innovation: 28%
  - #Ownership: 20%
  - #Customer-First: 15%
- Legend with colors

**Right Column - Recognition Trend**:
- Line chart:
  - X: Last 7 days
  - Y: Number of kudos
  - Shows daily activity

**Leaderboard Section**:

- **Top Recipients** (This Month):
  - Table:
    1. Avatar | John Doe | 350 pts | 7 kudos
    2. Avatar | Jane Smith | 280 pts | 6 kudos
    3. Avatar | Bob Lee | 250 pts | 5 kudos
  - Button: "View Full Leaderboard"

- **Top Givers** (Most Generous):
  - Similar table format
  - Shows who gave most kudos (not points received)

**Quick Actions**:
- Button: "Manage Users"
- Button: "Add Rewards"
- Button: "Organization Settings"

**Mobile Adaptations**:
- Metrics cards → Stack vertically (2x2 grid)
- Charts → Full width, stack
- Leaderboard → Horizontal scroll table

**Design Inspiration**: Google Analytics, Mixpanel, Stripe Dashboard

---

## Phase 2 Screens

### ✅ 07. User Profile Page
**File**: `designs/ui/prototypes/07-user-profile/index.html`
**Screenshots**: `designs/ui/images/07-profile-overview.png`, `07-profile-history.png`
- Avatar, bio, gradient header
- Points balance breakdown (Giveable vs Redeemable) with progress bars
- Kudos received history feed
- Redemption history table with status badges
- Monthly stats cards (Kudos Received, Given, Streak, Top Value)

### ✅ 08. Kudo Detail View
**File**: `designs/ui/prototypes/08-kudo-detail/index.html`
**Screenshots**: `designs/ui/images/08-kudo-detail-top.png`, `08-kudo-detail-bottom.png`
- Expanded kudos card with sender/receiver info
- Full message with value tags & points badge
- Emoji reaction bar (👏 ❤️ 🎉 🚀)
- Comment thread with reply actions
- "More recognition" related cards

### ✅ 09. Admin - User Management
**File**: `designs/ui/prototypes/09-admin-user-management/index.html`
**Screenshots**: `designs/ui/images/09-admin-users-overview.png`
- User table with avatars, names, emails, departments, roles
- Search + Department/Role filter dropdowns
- Import CSV & Invite Users action buttons
- Point budget display, active toggles, pagination
- Inactive user (greyed) & pending invite (highlighted) states

### ✅ 10. Admin - Reward Management
**File**: `designs/ui/prototypes/10-admin-reward-management/index.html`
**Screenshots**: `designs/ui/images/10-admin-rewards-overview.png`, `10-admin-rewards-redemptions.png`
- 4 stat cards (Total, Active, Redeemed, Budget)
- Search + category/status filters
- 6 reward cards grid (with out-of-stock state)
- Recent Redemptions table with fulfillment statuses

### ✅ 11. Organization Settings
**File**: `designs/ui/prototypes/11-organization-settings/index.html`
**Screenshots**: `designs/ui/images/11-settings-profile.png`, `11-settings-billing.png`
- Organization Profile (logo upload, company info)
- Company Values (editable card list)
- Points & Budget Configuration
- Notification Defaults (toggles)
- Billing & Plan card (Pro Plan, payment method)
- Danger Zone (delete organization)

---

## Design Deliverables Checklist

### Phase 1 (Complete ✅)
- [x] 00-landing-page ✅
- [x] 01-auth-modal ✅
- [x] 02-onboarding ✅
- [x] 03-dashboard (kudos feed) ✅
- [x] 04-give-kudos-modal ✅
- [x] 05-rewards-catalog ✅
- [x] 06-admin-dashboard ✅

### Phase 2 (Complete ✅)
- [x] 07-user-profile ✅
- [x] 08-kudo-detail ✅
- [x] 09-admin-user-management ✅
- [x] 10-admin-reward-management ✅
- [x] 11-organization-settings ✅

---

## Design Principles

### Visual Language
✅ **Gradients everywhere** - Purple → Blue, Pink, Orange variations
✅ **Glass morphism** - Subtle blur effects on cards
✅ **Micro-interactions** - Hover states, smooth transitions
✅ **Empty states** - Always show helpful placeholders
✅ **Celebration moments** - Confetti, success animations

### UX Guidelines
✅ **Mobile-first** - Design for 375px, enhance to 1920px
✅ **Accessibility** - WCAG AA contrast ratios, ARIA labels, keyboard nav
✅ **Performance** - Lazy load images, infinite scroll pagination
✅ **Real-time feel** - Show optimistic UI, smooth updates
✅ **Onboarding clarity** - Progressive disclosure, clear CTAs

### Component Reuse
- Button (4 variants: primary, secondary, ghost, danger)
- Card (with hover effects, optional gradient border)
- Modal (base component with header, body, footer)
- Avatar (with fallback to initials)
- Badge/Tag (for core values, with colors)
- Input (with validation states)
- Empty state (illustration + heading + CTA)

---

## Prototyping Workflow

### Creating New Screen

1. **Create folder**: `designs/ui/prototypes/0X-screen-name/`
2. **Copy structure** from `00-landing-page/` (fonts, Tailwind config)
3. **Design in HTML** with Tailwind classes
4. **Test responsive** (resize browser)
5. **Generate screenshot**:
   ```bash
   cd designs/ui/prototypes
   node html-to-jpg.js 0X-screen-name/index.html
   ```
6. **Screenshot auto-saved**: `0X-screen-name/0X-screen-name.jpg`
7. **Copy to images folder**:
   ```bash
   cp 0X-screen-name/0X-screen-name.jpg ../images/
   ```

### Design Review Checklist

Before marking screen as done:
- [ ] Mobile responsive (test 375px, 768px, 1440px)
- [ ] All interactive states (hover, active, disabled, error)
- [ ] Empty states designed
- [ ] Loading states designed
- [ ] Error states designed
- [ ] Accessibility: Color contrast, ARIA labels
- [ ] Typography scales correctly
- [ ] Spacing consistent with design system
- [ ] Screenshot generated

---

## Research References

### Competitor Inspiration
- **Bonusly**: Chat-first, quick recognition flow
- **Kudos.com**: Social feed UI, rich interactions
- **Matter**: Minimal setup, embedded experience
- **Lattice**: Performance-focused, analytics-heavy

### Design Systems
- **Tailwind UI**: Component patterns
- **Stripe**: Onboarding wizard UX
- **Linear**: Modern app shell navigation
- **Notion**: Progressive onboarding

### Best Practices
- [Nielsen Norman Group - Form Design](https://www.nngroup.com/articles/web-form-design/)
- [Empty States Pattern](https://emptystat.es/)
- [Microinteractions](https://microinteractions.com/)

---

## Next Steps

All 12 screens (00-11) are complete! Ready for:
1. **Design review** — Gather feedback on all prototypes
2. **Backend development** — Begin Phase 02 (API & database)
3. **Component library** — Extract reusable components from prototypes

---

**Last Updated**: 2026-02-16
**Status**: Phase 1 complete (7 screens), Phase 2 complete (5 screens) — All 12 screens done
**Next**: Backend development (Phase 02)
