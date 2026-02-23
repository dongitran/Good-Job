# Phase 7 — Organization Settings (Admin) + Onboarding Budget Step

## Overview

**Status**: 🚧 In Progress (Phase 0 completed, Phase 1 pending)

**Goal**: Build a full-featured Organization Settings page for admins/owners — allowing them to configure org profile, company values, points & budgets, notifications, integrations, and billing from a single unified page. Additionally, add the **missing Budget Step to the onboarding wizard** to match the 6-step prototype.

**Design Reference**:
- [Prototype 11 — Org Settings](../designs/ui/prototypes/11-organization-settings/index.html) — 6-tab settings UI
- [Prototype 02 — Onboarding](../designs/ui/prototypes/02-onboarding/index.html) — 6-step wizard (step 4 = Budget)

**Business Impact**: Consolidates all admin configuration into one place. Currently, org settings can *only* be configured during onboarding (steps 2–3). Post-onboarding editing is not possible from the web UI. The onboarding itself is also missing the Budget step (step 4) that the prototype specifies.

---

## Current State Analysis

### Audit Update (2026-02-23)

Recent codebase audit against this plan and prototype `11-settings-*.png` found:

| Area | Current Reality | Gap vs Phase 1 |
|------|------------------|----------------|
| Onboarding Budget Step | ✅ Implemented in web + E2E | Phase 0 largely complete |
| Admin Settings Route | ❌ No `/admin/settings` route | Must add route + page + guard wiring |
| Sidebar Admin Settings Link | ❌ Missing | Must add "Settings" nav item in admin section |
| Org Profile Fields | ❌ `timezone`, `language`, `companyDomain` not in DB/entity/DTO | Must add migration + entity + DTO + service update |
| Core Value CRUD | ❌ Only bulk `setCoreValues()` exists | Must add update/delete/reorder endpoints + DTOs |
| Core Value Metadata | ❌ `description`, `sortOrder` missing on entity/migration | Must add columns + response sorting |
| Usage Count | ❌ `GET /organizations/:id` does not return `usageCount` per value | Must add aggregated usage count query |
| Web Admin Settings UI | ❌ Not implemented | Must implement General/Values/Points tabs (MVP) |
| Org Types/Hook | ⚠️ Minimal `OrgData` and no `useOrgSettings` | Must extend typing + mutation hook |
| E2E Phase 1 | ❌ `admin-settings.spec.ts` not present | Must add fail-first coverage for Phase 1 |

### Known Risks Found During Audit

1. **Skip Budget Mismatch**: onboarding Step 4 skip currently avoids PATCH, but UI defaults show 200 while API fallback budget default remains 1000. This can create post-onboarding behavior mismatch.
2. **Hardcoded Kudos Range in Web**: `GiveKudosModal` still uses static min/max (10/50) instead of org-configured settings.
3. **Missing Cross-field Validation**: no API validation yet for `minPerKudo < maxPerKudo` and `monthlyGivingBudget >= maxPerKudo`.

### Implementation Note

This plan should be executed with strict TDD:
1. Add failing E2E tests for `/admin/settings` Phase 1 flows.
2. Implement API + web changes to make those tests pass.
3. Rebuild Docker services after code changes.
4. Re-run the same E2E tests and confirm green.

### What Exists

| Layer | Component | Status |
|-------|-----------|--------|
| **API** | `organizations.controller.ts` | ✅ Has `PATCH /:id` for name/industry/companySize/logoUrl |
| **API** | `organizations.service.ts` | ✅ Has `updateOrganization()`, `setCoreValues()`, `uploadOrganizationLogo()` |
| **API** | `UpdateOrganizationDto` | ⚠️ Only name/industry/companySize/logoUrl — **missing `settings` field** |
| **API** | `Organization` entity | ✅ Has `settings: OrganizationSettings` JSONB with `points` and `budget` objects |
| **API** | `core-value.entity.ts` | ⚠️ Has name, emoji, color, isActive, orgId — **missing `description` field** |
| **Web** | `Onboarding.tsx` | ⚠️ Only **5 steps** — **missing Step 4 "Points & Budget"** (prototype has 6) |
| **Web** | `Settings.tsx` | ✅ User-level only (Profile, Notifications, Appearance, Security) |
| **Web** | `App.tsx` routes | ⚠️ Has `/admin/*` routes but **no `/admin/settings`** |
| **Web** | `useOrg.ts` hook | ✅ Fetches org data (name, logoUrl, coreValues) — **missing settings fields** |
| **Web** | `OrgData` type | ⚠️ Only has id/name/logoUrl/coreValues — **missing settings, industry, companySize, plan, timezone, language** |
| **E2E** | `onboarding.spec.ts` | ⚠️ All assertions use "Step X of **5**" — will **break** when Budget Step is added |
| **E2E** | admin-settings.spec.ts | ❌ **Does not exist** |
| **Prototype** | 6 tabs | ✅ General, Company Values, Points & Budgets, Notifications, Integrations, Billing |

### Critical Gap: Prototype vs Code Comparison

**Onboarding Prototype (6 steps):**
```
1. Welcome → 2. Org → 3. Core Values → 4. Points & Budget → 5. Invite Team → 6. All Set
```

**Current Code (5 steps):**
```
1. Welcome → 2. Org → 3. Core Values → 4. Invite Team → 5. All Set
```

→ **Step 4 "Points & Budget" is completely missing from the codebase.**

### What Needs To Be Built

```
Phase 0 (Prerequisite):  Onboarding Budget Step              → Complete the 6-step wizard
Phase 1 (MVP):           General + Values + Points tabs      → Core admin functionality
Phase 2:                 Notifications tab                    → Org-level notification defaults
Phase 3:                 Integrations tab                     → Slack status display (depends on Plan #6)
Phase 4:                 Billing tab                          → Plan management & usage display
```

---

## Phase 0 — Onboarding Budget Step (Prerequisite)

> **Goal**: Add the missing "Points & Budget" step to onboarding so the wizard matches the 6-step prototype. This is a prerequisite because the API must support `settings` update before the Settings page can use it.

### 0.1 API Changes

#### [MODIFY] [update-organization.dto.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/modules/organizations/dto/update-organization.dto.ts)

Add `settings` field to support points & budget configuration:

```diff
 export class UpdateOrganizationDto {
   @IsString() @IsNotEmpty() @MaxLength(120) @IsOptional()
   name?: string;

   @IsEnum(Industry) @IsOptional()
   industry?: Industry;

   @IsEnum(CompanySize) @IsOptional()
   companySize?: CompanySize;

   @IsString() @IsOptional()
   logoUrl?: string;

+  @IsOptional()
+  @ValidateNested()
+  @Type(() => OrganizationSettingsDto)
+  settings?: OrganizationSettingsDto;
 }
```

New DTO class `OrganizationSettingsDto`:

```typescript
export class PointsSettingsDto {
  @IsNumber() @IsOptional() @Min(1) @Max(1000)
  minPerKudo?: number;

  @IsNumber() @IsOptional() @Min(1) @Max(10000)
  maxPerKudo?: number;

  @IsNumber() @IsOptional() @Min(0)
  valueInCurrency?: number;

  @IsString() @IsOptional() @MaxLength(10)
  currency?: string;
}

export class BudgetSettingsDto {
  @IsNumber() @IsOptional() @Min(50) @Max(100000)
  monthlyGivingBudget?: number;

  @IsNumber() @IsOptional() @Min(0) @Max(31)
  resetDay?: number;
  // Note: resetDay = 0 means "last day of month"

  @IsBoolean() @IsOptional()
  allowRollover?: boolean;

  @IsBoolean() @IsOptional()
  managerBonusEnabled?: boolean;

  @IsNumber() @IsOptional() @Min(0) @Max(10000)
  managerBonusAmount?: number;
}

export class OrganizationSettingsDto {
  @IsOptional() @ValidateNested() @Type(() => PointsSettingsDto)
  points?: PointsSettingsDto;

  @IsOptional() @ValidateNested() @Type(() => BudgetSettingsDto)
  budget?: BudgetSettingsDto;
}
```

#### [MODIFY] [organizations.service.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/modules/organizations/organizations.service.ts)

Update `updateOrganization()` to handle deep merge for settings JSONB:

```typescript
async updateOrganization(orgId, userId, dto) {
  // ... existing verification ...
  if (dto.settings) {
    // Deep merge: don't overwrite entire settings object
    org.settings = {
      ...org.settings,
      ...(dto.settings.points && {
        points: { ...org.settings?.points, ...dto.settings.points }
      }),
      ...(dto.settings.budget && {
        budget: { ...org.settings?.budget, ...dto.settings.budget }
      }),
    };
  }
  // ... existing save logic ...
}
```

#### [MODIFY] [organization.entity.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/database/entities/organization.entity.ts)

Extend `OrganizationSettings` interface to include new fields:

```diff
 export interface OrganizationSettings {
   points?: {
     minPerKudo: number;
     maxPerKudo: number;
     valueInCurrency: number;
     currency: string;
   };
   budget?: {
     monthlyGivingBudget: number;
     resetDay: number;
+    allowRollover?: boolean;       // Unused points carry over to next month
+    managerBonusEnabled?: boolean;  // Admins/owners get bonus budget
+    managerBonusAmount?: number;    // Extra pts/month for managers (default: 100)
   };
 }
```

### 0.2 Web — New Budget Step Component

#### [NEW] [PointsBudgetStep.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/pages/onboarding/steps/PointsBudgetStep.tsx)

Budget configuration step matching prototype step 4:

**UI Elements (from prototype 02-onboarding-step4.png):**
- **Monthly Giving Budget**: Number input (default: 200) + preset buttons [100] [200] [500] [1000]
- **Points per Recognition**: Min input (default: 1), Max input (default: 100)
- **Preview card**: *"Each member gets {budget} points/month and can give {min}–{max} points per recognition"*

```typescript
interface PointsBudgetStepProps {
  budgetData: {
    monthlyGivingBudget: number;
    minPerKudo: number;
    maxPerKudo: number;
  };
  onChange: (data: PointsBudgetStepProps['budgetData']) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}
```

**Interactions:**
- Preset buttons (100/200/500/1000) update the budget input and highlight the selected preset
- Preview text dynamically reflects current values
- Continue calls `PATCH /organizations/:id` with `{ settings: { points: { minPerKudo, maxPerKudo }, budget: { monthlyGivingBudget } } }`
- Skip advances to Invite Team without API call
- Back returns to Core Values step

#### [MODIFY] [Onboarding.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/pages/onboarding/Onboarding.tsx)

Change from 5-step to 6-step wizard:

```diff
  // New step 4 state
+ const [budgetData, setBudgetData] = useState({
+   monthlyGivingBudget: 200,
+   minPerKudo: 1,
+   maxPerKudo: 100,
+ });

+ const handleStep4Continue = async () => {
+   if (!orgId) return;
+   setIsSubmitting(true);
+   try {
+     await api.patch(`/organizations/${orgId}`, {
+       settings: {
+         points: { minPerKudo: budgetData.minPerKudo, maxPerKudo: budgetData.maxPerKudo },
+         budget: { monthlyGivingBudget: budgetData.monthlyGivingBudget },
+       },
+     });
+     setStep(5);
+   } catch {
+     toast.error('Failed to save budget settings.');
+   } finally {
+     setIsSubmitting(false);
+   }
+ };

  // Renumber steps:
  // case 1: WelcomeStep
  // case 2: OrganizationStep
  // case 3: CoreValuesStep
+ // case 4: PointsBudgetStep (NEW)
  // case 5: InviteTeamStep (was 4)
  // case 6: AllSetStep (was 5)
```

#### [MODIFY] [AllSetStep.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/pages/onboarding/steps/AllSetStep.tsx)

Add budget data to Setup Summary:

```diff
  <p>Organization</p><p>{orgName || '—'}</p>
  <p>Core Values</p><p>{valuesCount} selected</p>
+ <p>Monthly Budget</p><p>{budgetData.monthlyGivingBudget} pts/member</p>
+ <p>Points per Kudo</p><p>{budgetData.minPerKudo} – {budgetData.maxPerKudo} pts</p>
  <p>Team Members</p><p>{membersCount} invited</p>
```

#### [MODIFY] [StepIndicator.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/pages/onboarding/StepIndicator.tsx) & [OnboardingLayout.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/pages/onboarding/OnboardingLayout.tsx)

Update total steps from 5 to 6. Add step label "Budget" at position 4.

### 0.3 E2E Test Updates for Onboarding

#### [MODIFY] [onboarding.spec.ts](file:///Users/dongtran/Code/Working/amanotes/apps/e2e/tests/onboarding.spec.ts)

**All "Step X of 5" assertions must change to "Step X of 6":**

| Test Group | Old | New |
|-----------|-----|-----|
| B5, B6 (Welcome) | `'Step 1 of 5'` | `'Step 1 of 6'` |
| C7–C10 (Org) | `'Step 2 of 5'`, `'Step 3 of 5'` | `'Step 2 of 6'`, `'Step 3 of 6'` |
| D11–D17 (Values) | `'Step 3 of 5'`, `'Step 4 of 5'` | `'Step 3 of 6'`, `'Step 4 of 6'` |
| **E18–E22 (Invite)** | `'Step 4 of 5'`, `'Step 5 of 5'` | `'Step 5 of 6'`, `'Step 6 of 6'` |
| **F23–F25 (AllSet)** | `'Step 5 of 5'` | `'Step 6 of 6'` |
| **G26–G27 (Edge)** | `'Step 5 of 5'` | `'Step 6 of 6'` |
| **Happy path** | All `of 5` refs | All `of 6` refs |

**Skip navigation paths must account for extra step:**
- D11: "skip step 2 → step 3, skip step 3 → step 4" becomes "skip → step 4 (budget), skip → step 5 (invite)"
- E18: Skipping from step 3 requires **2 skips** to reach Invite (skip budget, then at invite)

**New test group for Budget Step:**

```typescript
// ─── GROUP H: STEP 4 POINTS & BUDGET ────────────────────────────────

test('H29: budget step renders correctly as step 4 of 6', async ({ page }) => {
  // Setup → skip to step 3 (values) → skip to step 4 (budget)
  // Assert: "Step 4 of 6", heading "Points & Budget"
  // Assert: monthly budget input visible, preset buttons visible
  // Assert: min/max inputs visible, preview text visible
});

test('H30: preset buttons update monthly budget input', async ({ page }) => {
  // Click [100] → input shows 100, preview updates
  // Click [500] → input shows 500, preview updates
  // Click [200] → input shows 200 (default highlighted)
});

test('H31: custom budget input overrides preset selection', async ({ page }) => {
  // Type "350" in budget input
  // Assert: no preset button highlighted
  // Assert: preview shows "350 points/month"
});

test('H32: points range inputs work and preview updates', async ({ page }) => {
  // Set min=5, max=50
  // Preview: "can give 5–50 points per recognition"
});

test('H33: continue calls PATCH /organizations/:id with settings', async ({ page }) => {
  // Fill budget=300, min=1, max=100
  // Click Continue → intercept PATCH request
  // Assert: request body includes { settings: { points: { minPerKudo: 1, maxPerKudo: 100 }, budget: { monthlyGivingBudget: 300 } } }
  // Assert: advances to step 5 (Invite Team)
});

test('H34: skip advances to Invite step without API call', async ({ page }) => {
  // Click Skip → no PATCH request
  // Assert: "Step 5 of 6", heading "Invite Your Team"
});

test('H35: back returns to Core Values step', async ({ page }) => {
  // Click Back
  // Assert: "Step 3 of 6", heading "Choose Your Core Values"
});
```

**Updated happy-path test:**

```typescript
test('happy-path: complete full 6-step onboarding end-to-end via UI', async ({ page }) => {
  // ... steps 1-3 same as before ...

  // 4b. Step 4: Points & Budget (NEW)
  await expect(page.getByText('Step 4 of 6')).toBeVisible();
  // Accept defaults or configure budget
  const patchSettingsPromise = page.waitForResponse(
    (r) => r.url().includes('/organizations/') && r.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Continue' }).click();
  expect((await patchSettingsPromise).ok()).toBeTruthy();

  // 5. Step 5: Invite Team (was step 4)
  await expect(page.getByText('Step 5 of 6')).toBeVisible();
  // ...

  // 6. Step 6: All Set (was step 5)
  await expect(page.getByText('Step 6 of 6')).toBeVisible();
  // Assert budget data in summary
  await expect(page.getByText('200 pts/member')).toBeVisible();
  await expect(page.getByText('1 – 100 pts')).toBeVisible();
  // ...
});
```

---

## Phase 1 — General + Company Values + Points & Budgets (MVP)

> **Goal**: Allow admins to edit org profile, manage core values, and configure point/budget settings — the 3 most critical tabs.

### 1.1 API Changes — Organization Entity Updates

#### [MODIFY] [organization.entity.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/database/entities/organization.entity.ts)

Add new columns:

```diff
   @Column({ type: 'jsonb', default: {} })
   settings: OrganizationSettings;

+  @Column({ nullable: true })
+  timezone: string;
+
+  @Column({ nullable: true, default: 'en' })
+  language: string;
+
+  @Column({ name: 'company_domain', nullable: true })
+  companyDomain: string;
```

#### [MODIFY] [update-organization.dto.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/modules/organizations/dto/update-organization.dto.ts)

Add fields for Phase 1 settings (extends Phase 0 DTO):

```diff
+  @IsString() @IsOptional() @MaxLength(200)
+  timezone?: string;
+
+  @IsString() @IsOptional() @MaxLength(10)
+  language?: string;
+
+  @IsString() @IsOptional() @MaxLength(253)
+  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
+    message: 'Invalid domain format',
+  })
+  companyDomain?: string;
```

#### [NEW] [migration: XXXX-AddOrgSettingsColumns.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/database/migrations)

```sql
ALTER TABLE organizations ADD COLUMN timezone VARCHAR;
ALTER TABLE organizations ADD COLUMN language VARCHAR DEFAULT 'en';
ALTER TABLE organizations ADD COLUMN company_domain VARCHAR;
```

#### [MODIFY] [organizations.service.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/modules/organizations/organizations.service.ts)

Update `updateOrganization()`:

```typescript
if (dto.timezone !== undefined) org.timezone = dto.timezone;
if (dto.language !== undefined) org.language = dto.language;
if (dto.companyDomain !== undefined) org.companyDomain = dto.companyDomain;
```

### 1.2 API — Core Values CRUD Enhancements

#### [MODIFY] [core-value.entity.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/database/entities/core-value.entity.ts)

Add missing fields:

```diff
   @Column()
   name: string;

   @Column({ nullable: true })
   emoji: string;

+  @Column({ nullable: true })
+  description: string;
+
+  @Column({ name: 'sort_order', type: 'int', default: 0 })
+  sortOrder: number;

   @Column({ nullable: true })
   color: string;
```

#### [NEW] [migration: XXXX-AddCoreValueDescriptionAndSortOrder.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/database/migrations)

```sql
ALTER TABLE core_values ADD COLUMN description VARCHAR;
ALTER TABLE core_values ADD COLUMN sort_order INTEGER DEFAULT 0;
```

#### [MODIFY] [organizations.controller.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/modules/organizations/organizations.controller.ts)

Add endpoints for individual core value management:

```typescript
@Patch(':id/core-values/:valueId')
@Roles(UserRole.ADMIN, UserRole.OWNER)
updateCoreValue(
  @Param('id', ParseUUIDPipe) id: string,
  @Param('valueId', ParseUUIDPipe) valueId: string,
  @Body() dto: UpdateCoreValueDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.organizationsService.updateCoreValue(id, user.sub, valueId, dto);
}

@Delete(':id/core-values/:valueId')
@HttpCode(200)
@Roles(UserRole.ADMIN, UserRole.OWNER)
deleteCoreValue(
  @Param('id', ParseUUIDPipe) id: string,
  @Param('valueId', ParseUUIDPipe) valueId: string,
  @CurrentUser() user: JwtPayload,
) {
  return this.organizationsService.deleteCoreValue(id, user.sub, valueId);
}

@Patch(':id/core-values/reorder')
@Roles(UserRole.ADMIN, UserRole.OWNER)
reorderCoreValues(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: ReorderCoreValuesDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.organizationsService.reorderCoreValues(id, user.sub, dto);
}
```

#### [NEW] [update-core-value.dto.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/modules/organizations/dto/update-core-value.dto.ts)

```typescript
export class UpdateCoreValueDto {
  @IsString() @IsOptional() @MaxLength(100)
  name?: string;

  @IsString() @IsOptional() @MaxLength(10)
  emoji?: string;

  @IsString() @IsOptional() @MaxLength(255)
  description?: string;

  @IsString() @IsOptional() @MaxLength(20)
  color?: string;
}

export class ReorderCoreValuesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  orderedIds: string[];
}
```

#### [MODIFY] [organizations.service.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/modules/organizations/organizations.service.ts)

Add methods:

```typescript
async updateCoreValue(orgId: string, userId: string, valueId: string, dto: UpdateCoreValueDto): Promise<CoreValue> {
  await this.verifyMembership(orgId, userId);
  const value = await this.coreValueRepo.findOne({ where: { id: valueId, orgId, isActive: true } });
  if (!value) throw new NotFoundException('Core value not found.');
  Object.assign(value, dto);
  return this.coreValueRepo.save(value);
}

async deleteCoreValue(orgId: string, userId: string, valueId: string): Promise<{ message: string }> {
  await this.verifyMembership(orgId, userId);
  const value = await this.coreValueRepo.findOne({ where: { id: valueId, orgId } });
  if (!value) throw new NotFoundException('Core value not found.');
  value.isActive = false;
  await this.coreValueRepo.save(value);
  return { message: 'Core value disabled.' };
}

async reorderCoreValues(orgId: string, userId: string, dto: ReorderCoreValuesDto): Promise<CoreValue[]> {
  await this.verifyMembership(orgId, userId);
  const values = await this.coreValueRepo.find({ where: { orgId, isActive: true } });
  const valueMap = new Map(values.map(v => [v.id, v]));
  dto.orderedIds.forEach((id, index) => {
    const value = valueMap.get(id);
    if (value) value.sortOrder = index;
  });
  return this.coreValueRepo.save(values);
}
```

#### [MODIFY] [organizations.service.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/modules/organizations/organizations.service.ts) — Core Value Usage Count

Extend `getOrganization()` to include usage count per core value:

```typescript
async getOrganization(orgId: string, userId: string): Promise<Organization & { coreValues: (CoreValue & { usageCount: number })[] }> {
  await this.verifyMembership(orgId, userId);
  const org = await this.orgRepo.findOne({ where: { id: orgId } });
  if (!org) throw new NotFoundException('Organization not found.');

  // Fetch core values WITH usage count from recognitions
  const coreValues = await this.coreValueRepo
    .createQueryBuilder('cv')
    .leftJoin('recognitions', 'r', 'r.value_id = cv.id')
    .select(['cv.*', 'COUNT(r.id)::int as "usageCount"'])
    .where('cv.org_id = :orgId', { orgId })
    .andWhere('cv.is_active = true')
    .groupBy('cv.id')
    .orderBy('cv.sort_order', 'ASC')
    .getRawMany();

  org.coreValues = coreValues;

  // ... existing logo URL signing ...
  return org;
}
```

### 1.3 Web — New Admin Settings Page

#### [NEW] [AdminSettings.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/pages/admin/AdminSettings.tsx)

Main page component with 6 tabs matching the prototype. Each tab is a separate component:

```
AdminSettings.tsx (main)
├── GeneralTab.tsx        — Org profile: name, logo, domain, timezone, language, danger zone
├── CompanyValuesTab.tsx  — Core values CRUD: add/edit/delete/reorder with usage count
├── PointsBudgetTab.tsx   — Points config: min/max, currency, budget, reset day, rollover, manager bonus
├── NotificationsTab.tsx  — (Phase 2 — placeholder)
├── IntegrationsTab.tsx   — (Phase 3 — placeholder)
└── BillingTab.tsx        — (Phase 4 — placeholder)
```

Tabbed interface with `useState<SettingsTab>` matching existing `Settings.tsx` pattern.

#### [MODIFY] [org.ts](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/types/org.ts)

Extend types:

```diff
 export interface CoreValue {
   id: string;
   name: string;
   emoji?: string;
   isActive: boolean;
+  description?: string;
+  sortOrder?: number;
+  usageCount?: number;
 }

 export interface OrgData {
   id: string;
   name: string;
   logoUrl?: string | null;
   coreValues?: CoreValue[];
+  industry?: string;
+  companySize?: string;
+  companyDomain?: string;
+  settings?: {
+    points?: {
+      minPerKudo: number;
+      maxPerKudo: number;
+      valueInCurrency: number;
+      currency: string;
+    };
+    budget?: {
+      monthlyGivingBudget: number;
+      resetDay: number;
+      allowRollover?: boolean;
+      managerBonusEnabled?: boolean;
+      managerBonusAmount?: number;
+    };
+  };
+  plan?: string;
+  timezone?: string;
+  language?: string;
 }
```

#### [NEW] [useOrgSettings.ts](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/hooks/useOrgSettings.ts)

Custom hook for org settings mutations:

```typescript
export function useOrgSettings(orgId: string) {
  // updateOrg(dto) — PATCH /organizations/:id
  // updateCoreValue(valueId, dto) — PATCH /organizations/:id/core-values/:valueId
  // deleteCoreValue(valueId) — DELETE /organizations/:id/core-values/:valueId
  // addCoreValues(values[]) — POST /organizations/:id/core-values
  // reorderCoreValues(orderedIds) — PATCH /organizations/:id/core-values/reorder
  // uploadLogo(file) — POST /organizations/:id/logo
}
```

#### [MODIFY] [App.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/App.tsx)

Add route:

```diff
+ import AdminSettings from './pages/admin/AdminSettings';
  ...
  <Route path="/admin/rewards" element={...} />
+ <Route
+   path="/admin/settings"
+   element={
+     <ProtectedRoute>
+       <AdminGuard>
+         <AdminSettings />
+       </AdminGuard>
+     </ProtectedRoute>
+   }
+ />
```

#### [MODIFY] Sidebar component

Add "Settings" link to admin section of sidebar navigation (matching prototype design — between "Manage Rewards" and the Give Kudos button).

### 1.4 Web — Tab Components Detail

#### GeneralTab

| Field | Source | API | Notes |
|-------|--------|-----|-------|
| Organization Logo | `org.logoUrl` | `POST /organizations/:id/logo` | Upload/Remove buttons |
| Organization Name | `org.name` | `PATCH /organizations/:id` | |
| Company Domain | `org.companyDomain` (new) | `PATCH /organizations/:id` | "Users with this email domain will auto-join your org" |
| Timezone | `org.timezone` (new) | `PATCH /organizations/:id` | Dropdown: Asia/Ho_Chi_Minh, America/New_York, Europe/London, etc. |
| Language | `org.language` (new) | `PATCH /organizations/:id` | Dropdown: English, Vietnamese, Japanese |
| **Danger Zone** | — | — | See section 1.5 |

#### CompanyValuesTab

| Feature | API | Notes |
|---------|-----|-------|
| List values with usage count | `GET /organizations/:id` (includes coreValues + usageCount) | Sorted by sortOrder |
| Add new value | `POST /organizations/:id/core-values` | Name + emoji + description |
| Edit value | `PATCH /organizations/:id/core-values/:valueId` (new) | Name, emoji, description |
| Delete/disable value | `DELETE /organizations/:id/core-values/:valueId` (new) | Soft delete (isActive=false) |
| Reorder values | `PATCH /organizations/:id/core-values/reorder` (new) | Drag-and-drop or up/down buttons |
| "+ Add Value" button | — | Opens inline form or modal |

#### PointsBudgetTab

| Field | Entity Path | Default | Notes |
|-------|-------------|---------|-------|
| Monthly Points per Employee | `settings.budget.monthlyGivingBudget` | 200 | |
| Point Value (VND) | `settings.points.valueInCurrency` | 1000 | "1 point = 1,000 VND" |
| Max Points per Kudos | `settings.points.maxPerKudo` | 50 | |
| Budget Reset Day | `settings.budget.resetDay` | 1 | Dropdown: "1st of each month", "15th", "Last day" (0) |
| Allow Points Rollover | `settings.budget.allowRollover` | false | Toggle: "Unused points carry over to next month" |
| Manager Bonus Budget | `settings.budget.managerBonusEnabled` | false | Toggle: "Managers get extra {amount} pts/month for team rewards" |
| Manager Bonus Amount | `settings.budget.managerBonusAmount` | 100 | Only visible when bonus enabled |

**Validation:**
- `minPerKudo` must be < `maxPerKudo` (cross-field validation)
- `monthlyGivingBudget` must be >= `maxPerKudo` (budget must allow at least one kudo)

### 1.5 Danger Zone (General Tab)

As shown in the prototype, the General tab includes a "Danger Zone" section at the bottom:

#### Export All Data

| Aspect | Detail |
|--------|--------|
| **Button** | "Export" → triggers async export |
| **Format** | ZIP file containing CSV files (members, recognitions, redemptions, point_transactions) |
| **API** | `POST /organizations/:id/export` → returns `{ jobId }`, polls `GET /organizations/:id/export/:jobId` for status |
| **Delivery** | When complete, returns download URL (signed, 24hr expiry) |
| **Scope** | Phase 1: Simple synchronous CSV export of members only. Full async export in future phase |

#### Delete Organization

| Aspect | Detail |
|--------|--------|
| **Button** | "Delete Org" (red) → confirmation modal |
| **Confirmation** | Must type org name to confirm (matching GitHub pattern) |
| **API** | `DELETE /organizations/:id` → requires password confirmation in body |
| **Behavior** | Soft-delete: sets `deletedAt`, deactivates all memberships, revokes invitations |
| **Scope** | Phase 1: Show button + confirmation modal. API implementation in future phase |

---

## Phase 2 — Notifications Tab

> **Goal**: Org-level default notification settings that apply to all members.

### Changes

#### [MODIFY] [organization.entity.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/database/entities/organization.entity.ts)

Extend `OrganizationSettings` interface:

```diff
 export interface OrganizationSettings {
   points?: { ... };
   budget?: { ... };
+  notifications?: {
+    emailDigest: boolean;       // Weekly digest email
+    pushNotifications: boolean; // Real-time push
+    slackPosts: boolean;        // Post to Slack #recognition (conditional on Slack connection)
+    monthlyLeaderboard: boolean; // Auto-announce top recognizers
+  };
 }
```

#### [NEW] [NotificationsTab.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/pages/admin/settings/NotificationsTab.tsx)

Toggle switches matching prototype design — 4 notification types:

1. Email Digest (default: ON) — "Weekly summary of recognition activity"
2. Push Notifications (default: ON) — "Real-time kudos notifications"
3. Slack Integration (default: ON) — "Post kudos to #recognition channel" — conditional: only visible when Slack is connected (Plan #6)
4. Monthly Leaderboard Announcement (default: OFF) — "Auto-announce top recognizers each month"

---

## Phase 3 — Integrations Tab

> **Goal**: Show connected integrations (Slack, MS Teams, Zapier, Google Workspace) with status and configure buttons.
> **Dependency**: Plan #6 (Slack Integration) — at minimum the Slack entity/status check API.

### Changes

#### [NEW] [IntegrationsTab.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/pages/admin/settings/IntegrationsTab.tsx)

- List integration cards (Slack, MS Teams, Zapier, Google Workspace)
- For Slack: call `GET /organizations/:id/slack` (from Plan #6) to show Connected/Not Connected status
- MS Teams, Zapier, Google Workspace: show as "Coming Soon" placeholder
- "Add to Slack" button triggers OAuth flow from Plan #6

---

## Phase 4 — Billing Tab

> **Goal**: Display current plan, usage, trial status, and upgrade path.

### Changes

#### [NEW] [BillingTab.tsx](file:///Users/dongtran/Code/Working/amanotes/apps/web/src/pages/admin/settings/BillingTab.tsx)

Read-only display of:
- Current plan (Free / Pro Trial / Pro) with pricing info
- Trial expiration date
- Member count / plan limit
- Payment method card (last 4 digits)
- Next billing date + amount
- Monthly cost estimate
- Buttons: "Change Plan", "View Invoice History", "Update" (payment), "Cancel Plan"

#### [MODIFY] [organizations.service.ts](file:///Users/dongtran/Code/Working/amanotes/apps/api/src/modules/organizations/organizations.service.ts)

Extend `getOrganization()` to include member count and plan info in response.

---

## File Structure Summary

```
apps/api/src/
├── database/
│   ├── entities/
│   │   ├── organization.entity.ts               [MODIFY] — add timezone, language, companyDomain; extend OrganizationSettings
│   │   └── core-value.entity.ts                  [MODIFY] — add description, sortOrder columns
│   └── migrations/
│       ├── XXXX-AddOrgSettingsColumns.ts          [NEW] — timezone, language, company_domain
│       └── XXXX-AddCoreValueDescSortOrder.ts      [NEW] — description, sort_order
└── modules/organizations/
    ├── dto/
    │   ├── update-organization.dto.ts            [MODIFY] — add settings, timezone, language, companyDomain
    │   ├── organization-settings.dto.ts          [NEW] — PointsSettingsDto, BudgetSettingsDto, OrganizationSettingsDto
    │   ├── update-core-value.dto.ts              [NEW] — UpdateCoreValueDto, ReorderCoreValuesDto
    │   └── create-core-values.dto.ts             [MODIFY] — add description field
    ├── organizations.controller.ts               [MODIFY] — add PATCH/DELETE core-value, reorder endpoint
    └── organizations.service.ts                  [MODIFY] — deep merge settings, core-value CRUD, usage count, reorder

apps/web/src/
├── hooks/
│   └── useOrgSettings.ts                        [NEW] — mutations hook
├── pages/onboarding/
│   ├── Onboarding.tsx                           [MODIFY] — 5→6 steps, add budget state + handler
│   ├── OnboardingLayout.tsx                     [MODIFY] — totalSteps 5→6
│   ├── StepIndicator.tsx                        [MODIFY] — add "Budget" label at step 4
│   └── steps/
│       ├── PointsBudgetStep.tsx                 [NEW] — budget config step
│       └── AllSetStep.tsx                       [MODIFY] — add budget data to summary
├── pages/admin/
│   └── AdminSettings.tsx                        [NEW] — main page with 6 tabs
├── pages/admin/settings/
│   ├── GeneralTab.tsx                           [NEW] — org profile form + danger zone
│   ├── CompanyValuesTab.tsx                     [NEW] — core values CRUD UI with usage count
│   ├── PointsBudgetTab.tsx                      [NEW] — points & budget config with toggles
│   ├── NotificationsTab.tsx                     [NEW] — Phase 2
│   ├── IntegrationsTab.tsx                      [NEW] — Phase 3
│   └── BillingTab.tsx                           [NEW] — Phase 4
├── types/org.ts                                 [MODIFY] — extend OrgData + CoreValue types
└── App.tsx                                      [MODIFY] — add /admin/settings route

apps/e2e/tests/
├── onboarding.spec.ts                           [MODIFY] — update all "Step X of 5" → "Step X of 6", add budget step tests
└── admin-settings.spec.ts                       [NEW] — admin settings E2E tests
```

---

## E2E Test Plan

### [NEW] admin-settings.spec.ts

```typescript
test.describe('Admin Organization Settings', () => {

  // ─── ROUTING & AUTH ─────────────────────────────────────────────

  test('Admin navigates to /admin/settings → page renders with 6 tabs');
  test('Non-admin user redirected to /dashboard');
  test('Sidebar shows "Settings" link in admin section');

  // ─── GENERAL TAB ───────────────────────────────────────────────

  test('General tab shows org name, logo, timezone, language');
  test('Edit org name → Save → calls PATCH API → success toast');
  test('Upload new logo → preview displays → save persists');
  test('Remove logo → preview clears');
  test('Change timezone → Save → persists after reload');
  test('Change language → Save → persists after reload');

  // ─── COMPANY VALUES TAB ────────────────────────────────────────

  test('Company Values tab lists values with usage counts');
  test('Add new value → POST /core-values → appears in list');
  test('Edit value name/emoji/description → PATCH → list updates');
  test('Delete value → DELETE → removed from list');
  test('Values are sorted by sortOrder');

  // ─── POINTS & BUDGET TAB ──────────────────────────────────────

  test('Points & Budget tab shows current settings from API');
  test('Edit monthly budget → Save → PATCH org settings');
  test('Edit max per kudo → Save → PATCH org settings');
  test('Toggle rollover → PATCH → persists');
  test('Toggle manager bonus → PATCH → persists');
  test('Validation: minPerKudo > maxPerKudo → error state');

  // ─── TAB SWITCHING ─────────────────────────────────────────────

  test('Switch between tabs → only active tab content visible');
  test('Placeholder tabs (Notifications, Integrations, Billing) show coming soon or content');
});
```

---

## Verification Plan

### Phase 0 Verification (Budget Step)

```bash
# E2E tests
pnpm run test:e2e:local -- --grep "onboarding"
```

**Checklist:**
1. All existing onboarding tests pass with updated step counts
2. New budget step tests (H29–H35) pass
3. Happy-path test includes budget step
4. AllSetStep summary shows budget data
5. Skipping budget step does not call API

### Phase 1 Verification

```bash
# API unit tests
pnpm --filter api test -- --testPathPattern="organizations"

# E2E tests
pnpm run test:e2e:local -- --grep "admin.*settings|organization settings"
```

**API Test Scenarios:**
1. `PATCH /organizations/:id` with settings object → verify JSONB deep merge
2. `PATCH /organizations/:id` with timezone/language/companyDomain → verify columns updated
3. `PATCH /organizations/:id/core-values/:valueId` → verify value updated (name, emoji, description)
4. `DELETE /organizations/:id/core-values/:valueId` → verify soft delete (isActive=false)
5. `PATCH /organizations/:id/core-values/reorder` → verify sortOrder updated
6. Non-admin user → 403 Forbidden on all admin endpoints
7. Invalid settings values (minPerKudo > maxPerKudo) → 400 validation error
8. Core value usage count returns correct count from recognitions table

**Browser Test Scenarios:**
1. Navigate to `/admin/settings` → verify 6 tabs render
2. Edit org name → save → verify API call and toast
3. Upload new logo → verify preview + API upload
4. Add/edit/delete core value → verify list updates with usage count
5. Configure points & budget → save → verify settings persisted
6. Toggle rollover/manager bonus → verify toggles persist
7. Switch tabs → verify only active tab content visible
8. Non-admin user → redirected to dashboard

**Manual Verification:**
- Compare each tab visually against prototype screenshots (11-settings-*.png)
- Test on mobile viewport (responsive)
- Verify existing onboarding flow still works after DTO changes
- Verify Budget Step works end-to-end through onboarding wizard

---

## Default Values Reference

| Setting | Onboarding Default | Prototype Default | Recommended |
|---------|-------------------|-------------------|-------------|
| monthlyGivingBudget | 200 | 200 | 200 |
| minPerKudo | 1 (prototype) | not shown | 1 |
| maxPerKudo | 100 (prototype) | 50 (settings) | 50 (settings page), 100 (onboarding) |
| valueInCurrency | — | 1000 | 1000 |
| currency | — | "VND" | "VND" |
| resetDay | — | 1 | 1 |
| allowRollover | — | false | false |
| managerBonusEnabled | — | true | false |
| managerBonusAmount | — | 100 | 100 |

> **Note:** Onboarding step shows higher maxPerKudo default (100) to be more permissive for new orgs. Settings page shows the actual configured value which defaults to 50. Admins can change this post-onboarding via the Settings page.
