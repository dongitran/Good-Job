# Phase 04 — Test Infrastructure

## Overview

**Status**: ✅ Planned (ready to execute)  
**Goal**: Thiết lập hạ tầng test đủ mạnh để phát triển feature ở Phase 05+ với tốc độ cao nhưng vẫn giữ data integrity, security, và quality bar ở mức Senior.

---

## 1. Hiện Trạng Sau Phase 03 (đã kiểm tra thực tế)

### 1.1 Những gì đã có

- Monorepo + CI chạy được (`lint`, `build`, `test`, `e2e`).
- Backend có:
  - Guard/decorator/auth baseline đã test.
  - Config validation + Redis lifecycle/module tests.
  - E2E isolated cho auth/rbac (`apps/api/test/auth-rbac.e2e-spec.ts`).
- Web có:
  - Playwright E2E cho landing page (desktop + mobile).
- Commands đã chạy và pass:
  - `npm run test:api`
  - `npm run test:e2e:api`
  - `npm run test:web` (nhưng chỉ echo, chưa có unit test thật)
  - `npm run test:e2e:web`
  - `npm run lint`
  - `npm run build`

### 1.2 Những khoảng trống quan trọng

- Chưa có migration thực tế trong `apps/api/src/database/migrations/`.
- Chưa có seed script thực tế trong `apps/api/src/database/seeds/`.
- Các module nghiệp vụ chính (`kudos`, `rewards`, `points`, `feed`, `admin`, `users`, `organizations`, `ai`) mới là skeleton.
- Chưa có test utilities cho transaction/concurrency/idempotency.
- Chưa có web unit/integration tests (Vitest + RTL + MSW).
- Chưa có coverage threshold bắt buộc theo module/overall.
- Chưa có test data builders/fixtures tái sử dụng.

---

## 2. Mục Tiêu Phase 04

Phase 04 không tập trung viết feature business hoàn chỉnh, mà tạo **test platform** để Phase 05-09 triển khai nhanh và an toàn:

1. Xây test pyramid rõ ràng cho API + Web.
2. Tạo test harness cho PostgreSQL + Redis + transaction.
3. Chuẩn hóa test patterns cho các luồng có rủi ro cao:
   - Atomic give kudo
   - Double-spending redemption
   - RBAC + auth guards
   - Budget reset
4. Bật quality gates trong CI (coverage + smoke + e2e tối thiểu).

---

## 3. Thiết Kế Test Pyramid

### 3.1 Backend

- **Unit tests** (nhanh, cô lập):
  - service logic, validators, guards, helpers, mapping functions
- **Integration tests** (với DB/Redis thật hoặc container test):
  - repository + transaction + locking + idempotency
- **E2E tests** (HTTP flow):
  - auth/rbac
  - give kudo flow
  - redeem flow concurrency
  - feed stream happy path

### 3.2 Frontend

- **Unit tests**:
  - utils, store, hooks
- **Component/Integration tests (RTL + MSW)**:
  - pages/components quan trọng theo flow user
- **Playwright E2E**:
  - smoke UX + route auth + critical actions

---

## 4. Work Breakdown (Execution Plan)

## Step 01 — Backend Test Harness Foundation

### Deliverables

- Tạo thư mục:
  - `apps/api/test-utils/`
  - `apps/api/test-utils/factories/`
  - `apps/api/test-utils/fixtures/`
- Helper tạo app test:
  - `createTestingApp()`
  - `createE2eApp()`
- Helper DB lifecycle:
  - `resetDatabase()`
  - `truncateAllTables()`
  - `runMigrationsForTest()`
- Helper auth token cho member/admin/owner.

### Notes

- Ưu tiên chạy migration thay vì sync schema.
- Không hardcode dữ liệu theo test case; dùng factory pattern.

---

## Step 02 — Integration Test Infrastructure (DB + Redis)

### Deliverables

- Test config riêng cho integration:
  - `apps/api/test/jest.integration.json`
- Bổ sung script:
  - `test:integration` cho `apps/api`
- Tạo suite baseline:
  - transaction commit/rollback
  - optimistic/pessimistic lock behavior
  - Redis publish/subscribe smoke

### Critical Cases Bắt Buộc

- `giving_budget` không âm khi concurrent requests.
- `redemptions.idempotency_key` chặn double submit.
- Ledger entries cân bằng theo mỗi transaction.

---

## Step 03 — E2E Expansion for Business-Critical Flows

### Deliverables

- Mở rộng E2E ở `apps/api/test/`:
  - `kudos.e2e-spec.ts`
  - `rewards.e2e-spec.ts`
  - `points.e2e-spec.ts`
  - `admin.e2e-spec.ts`
- Pattern chuẩn cho auth:
  - lấy token qua endpoint test/dev token issue.

### Scenario Matrix

1. Give kudo success.
2. Give kudo fail (self-recognition, over budget, invalid points).
3. Redemption success.
4. Redemption fail (insufficient points, out-of-stock).
5. Concurrent redemption requests (N requests cùng idempotency hoặc click spam).
6. Admin endpoint forbidden với member token.

---

## Step 04 — Frontend Test Stack Activation

### Deliverables

- Cài và cấu hình:
  - `vitest`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `msw`
- Thêm file:
  - `apps/web/src/test/setup.ts`
  - `apps/web/vitest.config.ts`
- Update script:
  - `apps/web/package.json` -> `test`, `test:watch`, `test:coverage`

### Initial Test Targets

- `src/lib/utils.ts`
- `src/stores/auth-store.ts`
- `src/lib/api.ts` (interceptor behavior với mock)
- `src/pages/Landing.tsx` render + CTA behavior

---

## Step 05 — Coverage & Quality Gates

### Deliverables

- API coverage thresholds:
  - lines >= 80%
  - branches >= 70%
  - functions >= 80%
  - statements >= 80%
- Web coverage thresholds:
  - lines >= 70% ở phase này (sẽ nâng sau khi có nhiều component)
- CI fail-fast nếu:
  - test fail
  - coverage dưới ngưỡng

### CI Updates

- Workflow tách rõ:
  - API unit
  - API integration
  - API e2e
  - Web unit/integration
  - Web e2e

---

## Step 06 — Testing Documentation & Conventions

### Deliverables

- `apps/api/README.md`:
  - cách chạy từng tầng test
  - cách bật infra e2e
  - cách debug flaky test
- `apps/web/README.md`:
  - setup MSW + RTL
  - testing guidelines cho component/page
- Convention doc ngắn:
  - naming test files
  - fixture/factory rules
  - no brittle snapshot policy

---

## 5. Định Nghĩa Done (Phase 04 Exit Criteria)

Phase 04 được xem là hoàn tất khi:

1. Có thể chạy local one-command:
   - `npm run test`
   - `npm run test:e2e:api`
   - `npm run test:e2e:web`
2. Web có test thực (không còn `echo 'No tests configured yet'`).
3. Có integration tests với DB transaction thật.
4. Có tối thiểu 1 test concurrency cho redemption.
5. CI enforce coverage thresholds.
6. Tài liệu test đủ để người khác onboard trong <= 15 phút.

---

## 6. Rủi Ro & Mitigation

### Rủi ro 1: Flaky test do time/date/concurrency
- **Mitigation**: fake timers, deterministic fixtures, retry policy có kiểm soát.

### Rủi ro 2: Test runtime quá chậm
- **Mitigation**: tách unit/integration/e2e jobs; cache dependency; chạy selective suites ở PR.

### Rủi ro 3: Drift giữa env local và CI
- **Mitigation**: dùng `.env.test` chuẩn hóa + script load env nhất quán.

### Rủi ro 4: Over-mocking làm mất giá trị kiểm thử
- **Mitigation**: ưu tiên integration cho luồng data integrity thay vì mock sâu.

---

## 7. Liên Kết Sang Phase 05+

Sau khi hoàn tất Phase 04:

- Phase 05 (Database & Auth) sẽ có test harness đầy đủ để triển khai:
  - migrations thực
  - user/org auth flow
  - RBAC production logic
- Phase 06-07 (Kudo + Reward) có sẵn guardrails cho:
  - transaction atomicity
  - idempotency
  - anti-race condition

---

## 8. Checklist Thực Thi Nhanh

- [ ] Setup API test-utils + factories + fixtures.
- [ ] Bổ sung integration test config/scripts.
- [ ] Viết test cho transaction + concurrency baseline.
- [ ] Kích hoạt Vitest + RTL + MSW cho web.
- [ ] Viết web tests đầu tiên cho `utils`, `auth-store`, `Landing`.
- [ ] Thêm coverage thresholds vào API + Web.
- [ ] Update CI jobs theo test pyramid.
- [ ] Cập nhật docs test cho cả `apps/api` và `apps/web`.

---

**Last Updated**: 2026-02-16  
**Status**: Planned and ready to implement  
**Next**: Execute Phase 04 tasks, then move to Phase 05
