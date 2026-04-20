# eScribe Parity — Complete Work Plan (Waves 1–4)

## TL;DR

> **Quick Summary**: Foundation-first implementation plan to bring this Council Meeting Management System to eScribe parity. Fixes code quality blockers (repository boilerplate, god objects, unbounded queries), then builds the critical UX features users need: rich text editing with TipTap, drag-and-drop agenda building, PDF packet generation, full-text search, bulk operations, scheduled publishing, auto-save, role delegation, and WCAG compliance.
> 
> **Deliverables**:
> - BaseRepository abstraction eliminating 116 duplicated `withFallback` patterns across 18 repositories
> - Decomposed ReportsService (862 lines → focused services)
> - Pagination on all list endpoints (backend + public portal)
> - Analytics N+1 fix (single aggregate query)
> - Frontend `useDataLoader` hook eliminating loading/error boilerplate
> - TipTap rich text editor for agenda items, staff reports, and minutes
> - Drag-and-drop agenda builder with `@dnd-kit`
> - PDF meeting packet generation
> - Server-side full-text search (Postgres FTS)
> - Bulk operations (batch approve/publish)
> - Scheduled publishing
> - Auto-save / offline draft support
> - Role delegation (substitute approvers)
> - Document versioning with diff views
> - Meeting type workflow configuration UI
> - WCAG 2.1 AA verification and fixes
> - Mobile/tablet responsive pass
> - Updated documentation
> 
> **Estimated Effort**: Large (4–6 weeks aggressive timeline)
> **Parallel Execution**: YES — 4 waves, 22 implementation tasks
> **Critical Path**: Task 1 (BaseRepository) → Task 3 (pagination) → Task 8 (TipTap agenda) → Task 11 (agenda builder) → Task 12 (PDF packets) → Task 20 (WCAG) → Final Verification

---

## Context

### Original Request
User wants a complete end-to-end municipal council meeting management system supporting all meeting types (Regular Council, Special Council, Committee of the Whole, In-Camera, other Committee meetings). Staff reports, minutes, agendas, and resolutions must be easy to create and maintain. Goal is "as close to eScribe as I can."

### Interview Summary
**Key Discussions**:
- **Approach**: Foundation First — fix code quality blockers before building features on a clean foundation
- **Rich text editor**: TipTap (block editor built on ProseMirror) selected for agenda items, reports, and minutes
- **Meeting type workflows**: Unified configurable workflow engine — meeting types define which workflow config to use, admins configure stages per type
- **Timeline**: Aggressive 4–6 weeks — focus on top gaps, ship MVP improvements fast, defer nice-to-haves
- **Documentation**: Must be updated along the way for every change
- **Testing**: Existing Jest infrastructure (~36% coverage). Tests-after approach given aggressive timeline.

**Research Findings**:
- 19 repositories with identical `withFallback` boilerplate — 116 matches across codebase
- ReportsService is 862 lines — god object handling creation, import, listing, workflow, auditing, notifications
- Only 10 of 28+ services have tests (~36% coverage), zero controller tests
- Unbounded queries — `meetings.repository.ts list()` returns all rows with no LIMIT
- N+1 pattern in analytics — one query per published report for approval history
- Frontend duplicated loading/error patterns — every page re-implements `useState + useEffect` fetching
- No rich text editor, no drag-drop agenda builder, no PDF generation, no full-text search
- No bulk operations, no scheduled publishing, no role delegation
- WCAG 2.1 AA not formally verified
- eScribe differentiators: WCAG 2.1 AA certified, modular pricing, Microsoft integration, scheduled publishing, staff report collaboration, real-time voting/roll calls, live webcasting, public portal with full-text search + subscriptions, document versioning with diff/redline views

### Gap Analysis
**Identified Gaps** (addressed):
- No BaseRepository abstraction: Task 1 extracts shared pattern
- God object ReportsService: Task 2 decomposes into focused services
- Unbounded queries everywhere: Task 3 adds pagination to all list endpoints
- Analytics N+1: Task 4 replaces per-report loop with aggregate query
- Frontend fetch boilerplate: Task 5 creates `useDataLoader` hook
- No rich text editing: Tasks 6–10 integrate TipTap across all content types
- No drag-drop agenda: Task 11 builds drag-drop agenda builder
- No PDF generation: Task 12 adds meeting packet PDF
- No search: Tasks 7 + 13 add full-text search
- No bulk ops: Task 14 adds batch approve/publish
- No scheduled publishing: Task 15 adds time-based publish
- No auto-save: Task 16 adds auto-save with offline support
- No role delegation: Task 17 adds substitute approvers
- No versioning: Task 18 adds document versioning with diff views
- No workflow config UI: Task 19 adds admin workflow configuration
- WCAG gaps: Task 20 does formal verification and fixes
- Responsive gaps: Task 21 does mobile/tablet pass

---

## Work Objectives

### Core Objective
Transform the Council Meeting Management System from its current functional-but-basic state into an eScribe-parity platform with professional content editing, efficient workflows, and enterprise compliance — by first fixing foundational code quality issues, then building critical UX features in parallel waves.

### Concrete Deliverables
- Backend: `BaseRepository` class in `backend/src/database/base.repository.ts`
- Backend: Decomposed report services (`reports-creation.service.ts`, `reports-workflow.service.ts`, `reports-query.service.ts`)
- Backend: Pagination DTOs and repository support across all modules
- Backend: Optimized analytics with single-query aggregation
- Backend: FTS migration `tsvector` columns + `search.service.ts` + `/api/search` endpoint
- Backend: Bulk operation endpoints (`POST /api/reports/bulk-action`, `POST /api/agendas/bulk-action`)
- Backend: Scheduled publishing with `node-cron` job
- Backend: Auto-save endpoint (`PATCH /api/reports/:id/autosave`, `PATCH /api/agendas/:id/autosave`)
- Backend: Role delegation tables + substitute approver logic
- Backend: Document versioning tables + version diff API
- Backend: Workflow config CRUD endpoints with per-meeting-type stage configuration
- Frontend: `useDataLoader` hook in `frontend/src/hooks/useDataLoader.ts`
- Frontend: TipTap editor component `frontend/src/components/ui/RichTextEditor.tsx`
- Frontend: TipTap-powered content editing for agendas, reports, and minutes pages
- Frontend: Drag-and-drop agenda builder `frontend/src/components/AgendaBuilder/`
- Frontend: PDF packet generation page/flow
- Frontend: Search bar component + search results page
- Frontend: Bulk action UI (multi-select rows, action bar)
- Frontend: Scheduled publish date picker in publish flows
- Frontend: Auto-save indicator component
- Frontend: Role delegation UI in admin
- Frontend: Version history panel with diff view
- Frontend: Workflow configuration admin page
- Frontend: WCAG fixes and responsive improvements
- Docs: Updated `README.md`, `IMPLEMENTATION_LOG.md`, `GO_LIVE_CHECKLIST.md`, `SECURITY_OPERATIONS_HARDENING.md`, `ENVIRONMENT_CHECKLIST.md`

### Definition of Done
- [ ] `cd backend && npm run build` exits 0
- [ ] `cd backend && npm run test` — all tests pass (existing + new)
- [ ] `cd frontend && npm run build` exits 0
- [ ] No `as any` or `@ts-ignore` introduced in new code
- [ ] All new API endpoints return correct HTTP status codes
- [ ] Documentation updated for each completed task

### Must Have
- Rich text editing for agenda items, staff reports, and minutes content
- Drag-and-drop agenda item reordering
- PDF meeting packet generation (agenda + reports + minutes bundled)
- Full-text search across published content
- Pagination on all list endpoints (public + admin)
- BaseRepository abstraction eliminating boilerplate
- ReportsService decomposed from god object
- Analytics N+1 eliminated
- useDataLoader hook for frontend
- Bulk approve/publish operations
- Scheduled publishing
- WCAG 2.1 AA compliance pass
- All documentation updated

### Must NOT Have (Guardrails)
- Do NOT replace raw `pg` driver with TypeORM/Prisma — stay consistent with existing pattern
- Do NOT introduce a separate frontend state management library (Redux/MobX) — use React hooks
- Do NOT implement video streaming integration — deferred post-MVP
- Do NOT implement Microsoft Word real-time co-authoring — use existing DOCX import/export
- Do NOT add WebSocket/SSE for auto-save — use polling or manual save with auto-save interval
- Do NOT build a custom WYSIWYG editor — use TipTap exclusively
- Do NOT over-abstract — extract BaseRepository once, don't create 5 layers of inheritance
- Do NOT add comments on every line — follow existing code comment style
- Do NOT create utility files with single-use functions — inline or group logically
- Do NOT touch auth/RBAC guards — they work, leave them alone
- Do NOT modify existing migration files — create new migrations only
- Do NOT break existing API contracts — new params optional, new endpoints additive
- Do NOT add excessive error handling beyond what exists — match project patterns

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: YES (Jest, `npm run test` in backend)
- **Automated tests**: Tests-after (given aggressive timeline)
- **Framework**: Jest (`ts-jest`) for backend, no frontend test framework currently
- **New tests**: Add tests for decomposed services, BaseRepository, search service, and pagination logic

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) — Run command, send keystrokes, validate output
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun/node REPL) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation fixes, all parallel):
├── Task 1:  Extract BaseRepository [deep]
├── Task 2:  Decompose ReportsService god object [deep]
├── Task 3:  Fix unbounded queries + add pagination [unspecified-high]
├── Task 4:  Fix analytics N+1 query [quick]
├── Task 5:  Add useDataLoader frontend hook [quick]
├── Task 6:  Install frontend dependencies (TipTap, dnd-kit, PDF libs) [quick]
└── Task 7:  Add Postgres FTS migration + search service [unspecified-high]

Wave 2 (After Wave 1 — core editor + builder, max parallel):
├── Task 8:  TipTap editor for agenda items (depends: 1, 6) [visual-engineering]
├── Task 9:  TipTap editor for staff reports (depends: 1, 2, 6) [visual-engineering]
├── Task 10: TipTap editor for minutes WYSIWYG (depends: 1, 6) [visual-engineering]
├── Task 11: Drag-and-drop agenda builder (depends: 6, 8) [visual-engineering]
├── Task 12: PDF meeting packet generation (depends: 6) [unspecified-high]
└── Task 13: Full-text search API + frontend integration (depends: 5, 7) [unspecified-high]

Wave 3 (After Wave 2 — features + polish, max parallel):
├── Task 14: Bulk operations — batch approve/publish (depends: 1, 2, 3) [unspecified-high]
├── Task 15: Scheduled publishing (depends: 1, 3) [unspecified-high]
├── Task 16: Auto-save / offline draft support (depends: 5, 9) [deep]
├── Task 17: Role delegation — substitute approvers (depends: 1) [unspecified-high]
├── Task 18: Document versioning with diff views (depends: 1, 5) [deep]
└── Task 19: Meeting type workflow configuration UI (depends: 1) [unspecified-high]

Wave 4 (After Wave 3 — compliance + documentation):
├── Task 20: WCAG 2.1 AA verification and fixes (depends: 8–11, 13) [deep]
├── Task 21: Mobile/tablet responsive pass (depends: 8–11) [visual-engineering]
└── Task 22: Comprehensive documentation update (depends: all) [writing]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]
→ Present results → Get explicit user okay

Critical Path: Task 1 → Task 8 → Task 11 → Task 20 → F1-F4 → user okay
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 7 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2, 8–19 | 1 |
| 2 | — | 9, 14 | 1 |
| 3 | — | 14, 15 | 1 |
| 4 | — | — | 1 |
| 5 | — | 13, 16, 18 | 1 |
| 6 | — | 8–12 | 1 |
| 7 | — | 13 | 1 |
| 8 | 1, 6 | 11 | 2 |
| 9 | 1, 2, 6 | 16 | 2 |
| 10 | 1, 6 | — | 2 |
| 11 | 6, 8 | — | 2 |
| 12 | 6 | — | 2 |
| 13 | 5, 7 | 20 | 2 |
| 14 | 1, 2, 3 | — | 3 |
| 15 | 1, 3 | — | 3 |
| 16 | 5, 9 | — | 3 |
| 17 | 1 | — | 3 |
| 18 | 1, 5 | — | 3 |
| 19 | 1 | — | 3 |
| 20 | 8–11, 13 | — | 4 |
| 21 | 8–11 | — | 4 |
| 22 | all | — | 4 |

### Agent Dispatch Summary

- **Wave 1** (7 tasks): T1 → `deep`, T2 → `deep`, T3 → `unspecified-high`, T4 → `quick`, T5 → `quick`, T6 → `quick`, T7 → `unspecified-high`
- **Wave 2** (6 tasks): T8 → `visual-engineering`, T9 → `visual-engineering`, T10 → `visual-engineering`, T11 → `visual-engineering`, T12 → `unspecified-high`, T13 → `unspecified-high`
- **Wave 3** (6 tasks): T14 → `unspecified-high`, T15 → `unspecified-high`, T16 → `deep`, T17 → `unspecified-high`, T18 → `deep`, T19 → `unspecified-high`
- **Wave 4** (3 tasks): T20 → `deep`, T21 → `visual-engineering`, T22 → `writing`
- **FINAL** (4 tasks): F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Extract BaseRepository with shared withFallback logic

  **What to do**:
  - Create `backend/src/database/base.repository.ts` with abstract `BaseRepository<T>` class
  - Move the duplicated `withFallback` pattern (DB-first with in-memory fallback) into a shared `protected async withFallback<T>(dbFn: () => Promise<T>, memoryFn: () => T): Promise<T>` method
  - Include shared `ensureSchema()` pattern with schema version tracking
  - Include shared `query<T>(sql, params)` helper that delegates to `PostgresService.query`
  - Extend all 18 existing repository classes to extend `BaseRepository` instead of duplicating the pattern
  - Repositories to update: `meetings`, `agendas`, `reports`, `minutes`, `actions`, `resolutions`, `meeting-types`, `workflow-config`, `public-subscriptions`, `governance-settings`, `api-settings`, `notifications`, `templates`, `motions`, `presentations`, `meeting-display`, `users`, `audit`
  - Keep in-memory fallback behavior identical — this is a refactor, not a behavior change
  - Add unit tests for `BaseRepository` covering: DB available path, DB unavailable → fallback path, schema ensure idempotency

  **Must NOT do**:
  - Do NOT add more than 2 levels of inheritance (BaseRepository → ConcreteRepository, no deeper)
  - Do NOT change the `PostgresService` class itself
  - Do NOT modify any API contracts or endpoints
  - Do NOT add TypeORM/Prisma — stay with raw `pg`

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Involves understanding a cross-cutting pattern across 18 files and safely refactoring without breaking behavior. Requires careful analysis of each repository's specific usage.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2–7)
  - **Blocks**: Tasks 8–19 (all subsequent tasks that touch repositories)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `backend/src/meetings/meetings.repository.ts:1-50` — Canonical `withFallback` pattern with `ensureSchema`, `memoryXxx` Map, and `DatabaseUnavailableError` handling. Extract this exact pattern into the base class.
  - `backend/src/reports/reports.repository.ts:1-80` — Second example of identical pattern. Compare with meetings repo to confirm shared structure.
  - `backend/src/agendas/agendas.repository.ts:1-60` — Third example showing the same `withFallback` + `ensureSchema` + in-memory Map setup.
  - `backend/src/database/postgres.service.ts` — The `PostgresService` that all repositories depend on. Understand its `query<T>()` method signature and `DatabaseUnavailableError` class that triggers fallback.

  **API/Type References**:
  - Each repository's type exports (e.g., `MeetingRecord`, `ReportRecord`, etc.) — these become the generic `T` in `BaseRepository<T>`

  **WHY Each Reference Matters**:
  - The meetings repository has the most complete/canonical implementation of the withFallback pattern — use it as the template
  - The postgres service defines the error class and query method that the base class needs to wrap
  - Comparing 3 repos ensures the abstraction covers all variations (some repos have extra methods like `transitionWorkflow`)

  **Acceptance Criteria**:

  - [ ] `backend/src/database/base.repository.ts` exists with abstract `BaseRepository<T>` class
  - [ ] All 18 repository files extend `BaseRepository` instead of duplicating `withFallback`
  - [ ] `grep -r "private.*withFallback" backend/src/` returns zero matches (no more private copies)
  - [ ] `cd backend && npm run build` exits 0
  - [ ] `cd backend && npm run test` — all existing tests pass
  - [ ] New test file `backend/src/database/base.repository.spec.ts` with ≥3 test cases

  **QA Scenarios:**

  ```
  Scenario: BaseRepository fallback works when DB is unavailable
    Tool: Bash
    Preconditions: Backend tests can run
    Steps:
      1. Run `cd backend && npx jest --testPathPattern="base.repository.spec" --verbose`
      2. Assert test "should fall back to memory when DB unavailable" passes
      3. Assert test "should use DB when available" passes
      4. Assert test "should ensure schema idempotently" passes
    Expected Result: All 3+ tests pass with exit code 0
    Failure Indicators: Any test fails, exit code non-zero
    Evidence: .sisyphus/evidence/task-1-base-repo-tests.txt

  Scenario: All repositories still work after refactor
    Tool: Bash
    Preconditions: Backend compiles and existing tests exist
    Steps:
      1. Run `cd backend && npm run build`
      2. Assert exit code 0
      3. Run `cd backend && npm run test`
      4. Assert all existing test suites pass (10 suites)
    Expected Result: Build succeeds, all tests pass
    Failure Indicators: TypeScript errors, test failures
    Evidence: .sisyphus/evidence/task-1-refactor-regression.txt
  ```

  **Commit**: YES
  - Message: `refactor(database): extract BaseRepository with shared withFallback`
  - Files: `backend/src/database/base.repository.ts`, all 18 updated repository files, `backend/src/database/base.repository.spec.ts`
  - Pre-commit: `cd backend && npm run build && npm run test`

- [ ] 2. Decompose ReportsService god object (862 lines → focused services)

  **What to do**:
  - Analyze `backend/src/reports/reports.service.ts` (862 lines) and split into 3 focused services:
    1. `reports-query.service.ts` — `list()`, `getById()`, query/filter logic, `listPendingDirector()`, `listPendingCao()`
    2. `reports-creation.service.ts` — `create()`, `update()`, `importDocx()`, attachment management
    3. `reports-workflow.service.ts` — `submit()`, `approveDirector()`, `rejectDirector()`, `approveCao()`, `rejectCao()`, `resubmit()`, `publish()`, `getApprovalHistory()`, `transitionWorkflow()`
  - Keep the existing `reports.service.ts` as a thin facade that delegates to the three sub-services for backward compatibility
  - Update `reports.module.ts` to register all new providers
  - Keep all existing API contracts identical — this is an internal refactor
  - Move the `ReportWorkflowStatus` type and `ReportApprovalEvent` interface to a shared `reports.types.ts` file
  - Update `reports.service.spec.ts` to test the decomposed services individually
  - The workflow service must maintain the transactional `transitionWorkflow` pattern from Phase 2

  **Must NOT do**:
  - Do NOT change any controller endpoints or API response shapes
  - Do NOT break the workflow transaction integrity added in Phase 2
  - Do NOT change the ReportsRepository — it stays as-is
  - Do NOT add event sourcing or CQRS patterns — keep it simple

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex refactoring of an 862-line god object that's central to the application. Requires understanding all dependencies and preserving behavior exactly.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3–7)
  - **Blocks**: Tasks 9, 14
  - **Blocked By**: None (can start immediately, but benefits from Task 1 if done first)

  **References**:

  **Pattern References**:
  - `backend/src/reports/reports.service.ts:1-862` — The entire god object. Read ALL of it. Map each method to one of the three target services.
  - `backend/src/reports/reports.controller.ts` — Understanding how the controller calls the service methods, so the facade delegates correctly.
  - `backend/src/reports/reports.module.ts` — Current module registration. Will need to add new service providers.

  **API/Type References**:
  - `backend/src/reports/reports.repository.ts:transitionWorkflow()` — The transactional workflow method added in Phase 2. The new workflow service MUST use this.
  - `backend/src/reports/dto/` — All DTOs remain unchanged. Understand their shapes for correct delegation.

  **Test References**:
  - `backend/src/reports/reports.service.spec.ts` — Existing tests. Rewrite to test decomposed services individually.

  **WHY Each Reference Matters**:
  - The full 862-line service is the ONLY source of truth for what methods exist and how they interact
  - The controller shows the public API surface that must be preserved via the facade
  - The repository's `transitionWorkflow` is critical to preserve — it handles atomic state + approval history writes
  - Existing tests define the behavioral contract that must not regress

  **Acceptance Criteria**:

  - [ ] `reports-query.service.ts`, `reports-creation.service.ts`, `reports-workflow.service.ts` all exist in `backend/src/reports/`
  - [ ] `reports.service.ts` reduced to < 100 lines (thin facade delegating to sub-services)
  - [ ] `reports.types.ts` contains shared types (`ReportWorkflowStatus`, `ReportApprovalEvent`)
  - [ ] `cd backend && npm run build` exits 0
  - [ ] `cd backend && npm run test` — all tests pass
  - [ ] New test files for each sub-service with ≥3 tests each

  **QA Scenarios:**

  ```
  Scenario: Report creation through decomposed services
    Tool: Bash
    Preconditions: Backend running, auth bypass enabled
    Steps:
      1. Start backend: `cd backend && npm run start:dev` (background)
      2. Create a report: `curl -s -X POST http://localhost:3000/api/reports -H "Content-Type: application/json" -H "X-Dev-Bypass: true" -H "X-CMMS-CSRF: test" -d '{"title":"Test Report","meetingId":"any","agendaItemId":"any"}'`
      3. Assert response status 201 or 200
      4. Assert response contains `id` and `workflowStatus: "DRAFT"`
    Expected Result: Report created successfully through the new creation service
    Failure Indicators: 500 error, missing id, wrong status
    Evidence: .sisyphus/evidence/task-2-report-creation.txt

  Scenario: Workflow transitions preserved after decomposition
    Tool: Bash
    Preconditions: Report exists in DRAFT status
    Steps:
      1. Submit report: `curl -s -X POST http://localhost:3000/api/reports/{id}/submit -H "X-Dev-Bypass: true" -H "X-CMMS-CSRF: test"`
      2. Assert status changed to PENDING_DIRECTOR_APPROVAL
      3. Get approval history: `curl -s http://localhost:3000/api/workflows/reports/{id}/history -H "X-Dev-Bypass: true"`
      4. Assert history contains SUBMITTED event
    Expected Result: Workflow transitions work identically to before decomposition
    Failure Indicators: Status not updated, history missing, transaction errors
    Evidence: .sisyphus/evidence/task-2-workflow-preserved.txt
  ```

  **Commit**: YES
  - Message: `refactor(reports): decompose ReportsService into focused services`
  - Files: `backend/src/reports/reports-query.service.ts`, `reports-creation.service.ts`, `reports-workflow.service.ts`, `reports.types.ts`, updated `reports.service.ts`, `reports.module.ts`, test files
  - Pre-commit: `cd backend && npm run build && npm run test`

- [ ] 3. Fix unbounded queries — add pagination to all list endpoints

  **What to do**:
  - Create shared pagination types in `backend/src/types/pagination.ts`:
    - `PaginationQuery { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }`
    - `PaginatedResult<T> { data: T[]; total: number; page: number; limit: number; totalPages: number }`
  - Update `meetings.repository.ts:list()` to accept pagination params and return `PaginatedResult`
  - Update `agendas.repository.ts:list()` similarly
  - Update `reports.repository.ts:list()` similarly
  - Update `minutes.repository.ts:list()` similarly
  - Update `public-portal/` endpoints to use pagination (meetings, agendas, reports, minutes)
  - Default `limit=20`, max `limit=100` enforced at DTO validation level
  - Add pagination DTOs with `class-validator` decorators
  - Update frontend API client functions to pass pagination params
  - Update frontend pages to use paginated responses (add page controls to tables)
  - Existing callers that don't pass pagination params should get default behavior (page=1, limit=20)

  **Must NOT do**:
  - Do NOT break existing API consumers — make pagination params optional with sensible defaults
  - Do NOT change the response shape for existing single-item endpoints
  - Do NOT add cursor-based pagination — offset/limit is fine for this scale
  - Do NOT modify the analytics KPI endpoint (that's Task 4)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cross-cutting change touching multiple backend modules and frontend pages. Requires coordination but is straightforward pattern work.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4–7)
  - **Blocks**: Tasks 14, 15
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `backend/src/meetings/meetings.repository.ts:60-120` — The `list()` method currently returns all rows. Add `LIMIT/OFFSET` SQL clauses here.
  - `backend/src/meetings/dto/meeting-list-query.dto.ts` — Existing query DTO. Extend with pagination fields.
  - `backend/src/meetings/dto/meeting-query.dto.ts` — Alternative query DTO. Check which one is used by the controller.

  **API/Type References**:
  - `backend/src/public-portal/public-portal.controller.ts` — Public endpoints that need pagination
  - `frontend/src/api/meetings.api.ts` — Frontend API client for meetings. Add pagination params.
  - `frontend/src/pages/Meetings/MeetingsList.tsx` — Meetings page that needs pagination UI

  **WHY Each Reference Matters**:
  - The meetings repo `list()` is the canonical unbounded query — fixing it establishes the pattern for all others
  - The public portal endpoints are externally visible and most urgently need pagination
  - Frontend pages need corresponding UI updates to use paginated data

  **Acceptance Criteria**:

  - [ ] `backend/src/types/pagination.ts` exists with `PaginationQuery` and `PaginatedResult<T>` types
  - [ ] All 4 list endpoints (meetings, agendas, reports, minutes) accept optional `page` and `limit` query params
  - [ ] Public portal endpoints return paginated results
  - [ ] `cd backend && npm run build` exits 0
  - [ ] `cd frontend && npm run build` exits 0
  - [ ] `curl "http://localhost:3000/api/meetings/paged?page=1&limit=5"` returns `{ data: [...], total: N, page: 1, limit: 5, totalPages: M }`

  **QA Scenarios:**

  ```
  Scenario: Paginated list returns correct structure
    Tool: Bash
    Preconditions: Backend running with seed data
    Steps:
      1. `curl -s "http://localhost:3000/api/meetings/paged?page=1&limit=2" -H "X-Dev-Bypass: true"`
      2. Assert response JSON has keys: `data`, `total`, `page`, `limit`, `totalPages`
      3. Assert `data` is an array with ≤2 items
      4. Assert `page` equals 1
      5. Assert `limit` equals 2
    Expected Result: Correct paginated response structure
    Failure Indicators: Missing pagination fields, data array too large, wrong page/limit values
    Evidence: .sisyphus/evidence/task-3-pagination-response.txt

  Scenario: Default pagination when no params provided
    Tool: Bash
    Preconditions: Backend running
    Steps:
      1. `curl -s "http://localhost:3000/api/meetings/paged" -H "X-Dev-Bypass: true"`
      2. Assert defaults applied: `page=1`, `limit=20`
      3. Assert `totalPages` is calculated as `Math.ceil(total / limit)`
    Expected Result: Defaults applied correctly
    Failure Indicators: Missing defaults, NaN values, crash
    Evidence: .sisyphus/evidence/task-3-default-pagination.txt
  ```

  **Commit**: YES
  - Message: `fix(api): add pagination to all list endpoints`
  - Files: `backend/src/types/pagination.ts`, updated DTOs, repositories, controllers, frontend API clients, frontend pages
  - Pre-commit: `cd backend && npm run build && npm run test`

- [ ] 4. Fix analytics N+1 query pattern

  **What to do**:
  - Read `backend/src/analytics/analytics.service.ts` lines 59–90 — the `executiveKpis()` method
  - The N+1 is at line 75–80: `publishedReports.map(async (report) => { const history = await this.reportsService.getApprovalHistory(report.id); ... })` — one query per published report
  - Replace with a single aggregate query against the approval history table:
    - `SELECT report_id, MAX(acted_at) as published_at FROM app_report_approvals WHERE action = 'PUBLISHED' GROUP BY report_id`
  - Map the result into `reportPublishedAtMap` without individual queries
  - Similarly check for N+1 patterns in `cycleTimeHours` calculation (lines 80–120)
  - Replace any per-item loops with bulk queries or pre-computed aggregations
  - Add a test for the optimized analytics query

  **Must NOT do**:
  - Do NOT change the `ExecutiveKpiSnapshot` response shape
  - Do NOT add caching layers (Redis, in-memory) — just fix the queries
  - Do NOT break the analytics endpoint response format

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Focused performance fix in a single service file. Well-defined scope.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1–3, 5–7)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `backend/src/analytics/analytics.service.ts:59-120` — The `executiveKpis()` method containing the N+1. Line 75–80 is the main culprit.
  - `backend/src/reports/reports.repository.ts` — The `getApprovalHistory` method being called in a loop. Understand its SQL to write the aggregate version.

  **Test References**:
  - `backend/src/analytics/analytics.service.spec.ts` — Existing analytics tests. Add a test verifying the optimized path.

  **WHY Each Reference Matters**:
  - The analytics service is the ONLY file that needs changing
  - Understanding the approval history SQL lets you write the correct aggregate query
  - Existing tests define the behavioral contract

  **Acceptance Criteria**:

  - [ ] No `await` calls inside `.map()` loops in `analytics.service.ts`
  - [ ] `executiveKpis()` makes ≤10 total queries (down from N+1)
  - [ ] `cd backend && npm run test` — analytics tests pass
  - [ ] Response shape of `GET /api/analytics/executive-kpis` unchanged

  **QA Scenarios:**

  ```
  Scenario: Analytics returns correct KPIs after optimization
    Tool: Bash
    Preconditions: Backend running with seed data
    Steps:
      1. `curl -s "http://localhost:3000/api/analytics/executive-kpis" -H "X-Dev-Bypass: true"`
      2. Assert response has all expected keys: `generatedAt`, `totals`, `approvals`, `publicationCoverage`, `cycleTimeHours`, `reportWorkflow`, `digest`, `monthlyPublications`
      3. Assert `totals` has numeric values for meetings, agendas, reports, minutes
    Expected Result: Full KPI response with all fields populated
    Failure Indicators: Missing keys, NaN values, 500 error
    Evidence: .sisyphus/evidence/task-4-analytics-kpis.txt

  Scenario: No N+1 queries remain
    Tool: Bash
    Preconditions: Backend source code
    Steps:
      1. `grep -n "await.*\.map\|\.map.*async" backend/src/analytics/analytics.service.ts`
      2. Assert no matches (no async operations inside map loops)
    Expected Result: Zero N+1 patterns found
    Failure Indicators: Any matches to the grep pattern
    Evidence: .sisyphus/evidence/task-4-no-n1.txt
  ```

  **Commit**: YES
  - Message: `perf(analytics): replace N+1 query with aggregate`
  - Files: `backend/src/analytics/analytics.service.ts`, `backend/src/analytics/analytics.service.spec.ts`
  - Pre-commit: `cd backend && npm run build && npm run test`

- [ ] 5. Add `useDataLoader` frontend hook

  **What to do**:
  - Create `frontend/src/hooks/useDataLoader.ts`
  - The hook should encapsulate the repeated pattern found across 28 pages:
    ```
    // Before (repeated in every page):
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => { fetch(...).then(...).catch(...); }, []);
    
    // After:
    const { data, loading, error, refetch } = useDataLoader(() => apiClient.get(...));
    ```
  - Support: auto-fetch on mount, manual refetch, loading/error states, generic typing
  - Optionally support: stale-while-revalidate, debounced refetch
  - Then refactor 3–5 representative pages to use the hook:
    - `frontend/src/pages/Meetings/MeetingsList.tsx`
    - `frontend/src/pages/Agendas/AgendaList.tsx`
    - `frontend/src/pages/Reports/ReportList.tsx`
    - `frontend/src/pages/Minutes/MinutesRegister.tsx`
    - `frontend/src/pages/Public/PublicPortal.tsx`
  - Do NOT refactor all 28 pages yet — just the 5 representative ones to validate the pattern

  **Must NOT do**:
  - Do NOT add a full data-fetching library (React Query, SWR) — this is a lightweight custom hook
  - Do NOT refactor all 28 pages in this task (just 5 representative ones)
  - Do NOT change any page's visual behavior or API calls
  - Do NOT add caching — just loading/error state management

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple custom hook + mechanical refactoring of 5 pages. Well-defined scope.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1–4, 6, 7)
  - **Blocks**: Tasks 13, 16, 18
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `frontend/src/pages/Meetings/MeetingsList.tsx` — Typical page with `useState + useEffect` fetching pattern. Use as the primary example of what to replace.
  - `frontend/src/pages/Reports/ReportList.tsx` — Another page with the same pattern. Shows how loading/error states are handled.
  - `frontend/src/api/httpClient.ts` — The existing HTTP client. The hook will wrap calls to this client.

  **API/Type References**:
  - `frontend/src/api/meetings.api.ts` — Example API client function signatures that `useDataLoader` will wrap.

  **WHY Each Reference Matters**:
  - The MeetingsList page shows the exact boilerplate pattern to eliminate
  - The httpClient shows how API calls are structured (returns Promise)
  - API client functions show the call signatures the hook needs to support

  **Acceptance Criteria**:

  - [ ] `frontend/src/hooks/useDataLoader.ts` exists and exports `useDataLoader<T>` hook
  - [ ] 5 pages refactored to use the hook (Meetings, Agendas, Reports, Minutes, PublicPortal)
  - [ ] Each refactored page has no raw `useState(false/true)` for loading or error
  - [ ] `cd frontend && npm run build` exits 0
  - [ ] Pages load identically to before (same data, same behavior)

  **QA Scenarios:**

  ```
  Scenario: useDataLoader hook manages loading state correctly
    Tool: Playwright
    Preconditions: Frontend dev server running at http://localhost:5173
    Steps:
      1. Navigate to `http://localhost:5173/meetings`
      2. Wait for page to fully load (max 10s)
      3. Assert meeting data appears in the table
      4. Assert no loading spinner is visible after data loads
      5. Navigate to `http://localhost:5173/reports`
      6. Assert reports load and display correctly
    Expected Result: Both pages load data without errors, no infinite loading states
    Failure Indicators: Loading spinner persists, error messages, empty tables
    Evidence: .sisyphus/evidence/task-5-dataloader-hook.png

  Scenario: Public portal loads with useDataLoader
    Tool: Playwright
    Preconditions: Frontend running
    Steps:
      1. Navigate to `http://localhost:5173/public`
      2. Wait for public portal to load
      3. Assert meetings/agendas/reports sections render with data
    Expected Result: Public portal loads and shows data
    Failure Indicators: Empty sections, error messages, loading forever
    Evidence: .sisyphus/evidence/task-5-public-portal.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add useDataLoader hook and refactor 5 pages`
  - Files: `frontend/src/hooks/useDataLoader.ts`, 5 refactored page files
  - Pre-commit: `cd frontend && npm run build`

- [ ] 6. Install frontend dependencies (TipTap, dnd-kit, PDF libs)

  **What to do**:
  - In `frontend/`, install the following npm packages:
    - **TipTap editor**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/pm`
    - **Drag-and-drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
    - **PDF generation**: `jspdf`, `html2canvas` (for client-side PDF generation from rendered HTML)
    - **Date handling for scheduled publish**: `date-fns` (lightweight, already-adjacent pattern)
  - Create a shared TipTap editor component skeleton at `frontend/src/components/ui/RichTextEditor.tsx`:
    - Accept `content`, `onChange`, `placeholder`, `editable` props
    - Use `@tiptap/react` `useEditor` + `EditorContent`
    - Include a basic toolbar (bold, italic, headings, lists, links)
    - Style with CSS modules or inline styles matching existing UI conventions
  - Verify `npm run build` succeeds with new dependencies
  - Do NOT integrate into any pages yet — that's Tasks 8–10

  **Must NOT do**:
  - Do NOT install a full design system (MUI, Chakra) — use existing plain CSS approach
  - Do NOT install a state management library
  - Do NOT configure TipTap extensions beyond the listed ones
  - Do NOT add any server-side PDF generation libraries to backend yet (that's Task 12)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Package installation + component skeleton. Straightforward setup task.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1–5, 7)
  - **Blocks**: Tasks 8–12 (all editor/builder/PDF tasks)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/Drawer.tsx` — Existing UI component pattern. Match the prop interface style and CSS approach.
  - `frontend/src/components/ui/StatusBadge.tsx` — Another UI component. Match the export pattern.
  - `frontend/src/styles/` — Existing CSS files. Check naming conventions and patterns.

  **External References**:
  - TipTap docs: `https://tiptap.dev/docs/editor/getting-started/install/react` — React setup guide
  - dnd-kit docs: `https://docs.dndkit.com/introduction/getting-started` — Installation and basic usage
  - jsPDF: `https://github.com/parallax/jsPDF` — Client-side PDF generation

  **WHY Each Reference Matters**:
  - Existing UI components show the code style and prop patterns the RichTextEditor should follow
  - TipTap's React guide shows the exact setup needed for `useEditor` + `EditorContent`
  - dnd-kit docs inform the installation choices

  **Acceptance Criteria**:

  - [ ] All packages listed above installed and present in `frontend/package.json`
  - [ ] `frontend/src/components/ui/RichTextEditor.tsx` exists with TipTap editor skeleton
  - [ ] `cd frontend && npm run build` exits 0 with new dependencies
  - [ ] No TypeScript errors in the new component

  **QA Scenarios:**

  ```
  Scenario: Frontend builds with all new dependencies
    Tool: Bash
    Preconditions: frontend/ directory with updated package.json
    Steps:
      1. Run `cd frontend && npm install`
      2. Assert exit code 0
      3. Run `cd frontend && npm run build`
      4. Assert exit code 0
    Expected Result: Clean install and build with all new packages
    Failure Indicators: npm errors, TypeScript compilation errors, missing peer deps
    Evidence: .sisyphus/evidence/task-6-deps-install.txt

  Scenario: RichTextEditor component renders without errors
    Tool: Playwright
    Preconditions: Frontend dev server running
    Steps:
      1. Create a temporary test page that imports and renders `<RichTextEditor content="<p>Test</p>" onChange={() => {}} />`
      2. Navigate to test page
      3. Assert the editor renders with toolbar and editable content area
    Expected Result: TipTap editor renders correctly
    Failure Indicators: Blank page, console errors, missing toolbar
    Evidence: .sisyphus/evidence/task-6-richtext-render.png
  ```

  **Commit**: YES
  - Message: `chore(frontend): install tiptap, dnd-kit, and pdf libs; add RichTextEditor skeleton`
  - Files: `frontend/package.json`, `frontend/package-lock.json`, `frontend/src/components/ui/RichTextEditor.tsx`
  - Pre-commit: `cd frontend && npm run build`

- [ ] 7. Add Postgres FTS migration + search service

  **What to do**:
  - Create migration `backend/src/database/migrations/1700000010000-full-text-search.sql`:
    - Add `tsvector` columns to `app_meetings`, `app_agendas`, `app_staff_reports`, `app_minutes`:
      - `search_vector TSVECTOR` on each table
    - Create GIN indexes on each `search_vector` column
    - Create trigger functions that auto-update `search_vector` on INSERT/UPDATE from title + description/content
    - Add triggers to each table
  - Create `backend/src/search/search.module.ts`, `search.service.ts`, `search.controller.ts`:
    - `GET /api/search?q=keyword&type=meetings|agendas|reports|minutes|all&page=1&limit=20`
    - Search across all content types using `tsvector @@ tsquery`
    - Return `PaginatedResult` with highlighted snippets using `ts_headline`
    - Rank results by relevance using `ts_rank`
  - Register `SearchModule` in `app.module.ts`
  - Add search API client function in `frontend/src/api/search.api.ts` (just the API function, UI is Task 13)

  **Must NOT do**:
  - Do NOT use Elasticsearch or external search engine — Postgres FTS is sufficient at this scale
  - Do NOT index binary content (attachments, PDFs) — text fields only
  - Do NOT add autocomplete/typeahead — simple search is sufficient for MVP
  - Do NOT modify existing tables beyond adding the search_vector column and triggers

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires SQL migration design, new NestJS module creation, and FTS query optimization. Multiple files across backend + frontend API.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1–6)
  - **Blocks**: Task 13 (frontend search integration)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `backend/src/database/migrations/1700000009000-app-integrity-constraints.sql` — Most recent migration. Follow the naming convention and SQL style.
  - `backend/src/analytics/analytics.module.ts` — Example of a NestJS module with service + controller. Follow this pattern for SearchModule.

  **API/Type References**:
  - `backend/src/types/pagination.ts` — The `PaginatedResult<T>` type from Task 3. Search results should use this.
  - `backend/src/public-portal/public-portal.controller.ts` — Public endpoint patterns. The search endpoint should follow similar auth/guard patterns.

  **External References**:
  - Postgres FTS: `https://www.postgresql.org/docs/current/textsearch.html` — Official docs for tsvector, tsquery, ts_headline, ts_rank, GIN indexes

  **WHY Each Reference Matters**:
  - The integrity constraints migration shows the SQL style and naming convention
  - The analytics module shows the NestJS module structure to replicate
  - Postgres FTS docs are essential for correct trigger and query syntax

  **Acceptance Criteria**:

  - [ ] Migration file exists with tsvector columns, GIN indexes, and triggers on all 4 tables
  - [ ] `GET /api/search?q=test` returns results with correct pagination structure
  - [ ] `GET /api/search?q=test&type=reports` filters to reports only
  - [ ] `cd backend && npm run build` exits 0
  - [ ] Search API client function exists in `frontend/src/api/search.api.ts`

  **QA Scenarios:**

  ```
  Scenario: Search returns relevant results
    Tool: Bash
    Preconditions: Backend running, migration applied, seed data loaded
    Steps:
      1. `curl -s "http://localhost:3000/api/search?q=council&type=all" -H "X-Dev-Bypass: true"`
      2. Assert response has `data` array with results
      3. Assert each result has `id`, `type`, `title`, and `rank` fields
      4. Assert `total` is a number
    Expected Result: Search returns matching content ranked by relevance
    Failure Indicators: Empty results, missing fields, 500 error
    Evidence: .sisyphus/evidence/task-7-search-results.txt

  Scenario: Search filters by content type
    Tool: Bash
    Preconditions: Backend running with mixed content types
    Steps:
      1. `curl -s "http://localhost:3000/api/search?q=test&type=meetings" -H "X-Dev-Bypass: true"`
      2. Assert all results have `type: "meeting"`
      3. `curl -s "http://localhost:3000/api/search?q=test&type=reports" -H "X-Dev-Bypass: true"`
      4. Assert all results have `type: "report"`
    Expected Result: Type filtering works correctly
    Failure Indicators: Mixed types in filtered results
    Evidence: .sisyphus/evidence/task-7-search-filter.txt

  Scenario: FTS migration applies cleanly
    Tool: Bash
    Preconditions: Database accessible
    Steps:
      1. Run the migration: `psql $DATABASE_URL -f backend/src/database/migrations/1700000010000-full-text-search.sql`
      2. Assert exit code 0
      3. Verify columns exist: `psql $DATABASE_URL -c "\d app_meetings" | grep search_vector`
    Expected Result: Migration applies without errors, tsvector columns created
    Failure Indicators: SQL errors, missing columns
    Evidence: .sisyphus/evidence/task-7-fts-migration.txt
  ```

  **Commit**: YES
  - Message: `feat(search): add Postgres FTS migration and search service`
  - Files: migration file, `backend/src/search/` module files, `frontend/src/api/search.api.ts`
  - Pre-commit: `cd backend && npm run build`

- [ ] 8. TipTap rich text editor for agenda items

  **What to do**:
  - Extend the `RichTextEditor` component from Task 6 with agenda-specific features:
    - Support for hierarchical agenda item numbering (auto-generate 1., 1.1, 1.1.1)
    - Configurable toolbar for agenda editing (headings, lists, indent/outdent, bold, links)
  - Update `frontend/src/pages/Agendas/AgendaList.tsx`:
    - Replace plain text input for agenda item content with `<RichTextEditor>`
    - When editing an agenda item, load existing HTML content into TipTap
    - Save TipTap HTML output via `PATCH /api/agendas/:id/items/:itemId`
  - Update the agenda item creation drawer to use the rich text editor
  - Update `frontend/src/components/AgendaBuilder/` if any existing components need the editor
  - Ensure the editor initializes with content from the API (edit mode) and empty (create mode)
  - Match existing drawer/modal styling conventions

  **Must NOT do**:
  - Do NOT change the agenda item data model in the backend (HTML stored in existing `content` field)
  - Do NOT build the drag-and-drop feature yet (that's Task 11)
  - Do NOT add collaboration/real-time editing
  - Do NOT change the agenda workflow or status logic

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend-focused UI component integration with rich text editor. Requires attention to UX details and visual consistency.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 10, 12, 13)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11 (drag-drop builder builds on top of this)
  - **Blocked By**: Tasks 1 (BaseRepository), 6 (TipTap install)

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/RichTextEditor.tsx` — The shared TipTap component skeleton from Task 6. Extend this.
  - `frontend/src/components/ui/Drawer.tsx` — Drawer component pattern. Agenda item editing happens in drawers.
  - `frontend/src/pages/Agendas/AgendaList.tsx` — Current agenda list page. Understand how items are created and edited.

  **API/Type References**:
  - `frontend/src/api/agendas.api.ts` — API client for agenda operations. The `updateAgendaItem` function sends content.
  - `backend/src/agendas/dto/` — Agenda DTOs showing the data shape

  **WHY Each Reference Matters**:
  - The RichTextEditor skeleton is the base component to extend
  - The Drawer shows the UI container where the editor will live
  - The AgendaList page is where integration happens — understand current text input pattern

  **Acceptance Criteria**:

  - [ ] Agenda item create/edit uses `<RichTextEditor>` instead of plain textarea
  - [ ] Editor loads existing HTML content when editing
  - [ ] Editor saves HTML content to backend on form submit
  - [ ] `cd frontend && npm run build` exits 0
  - [ ] No TypeScript errors

  **QA Scenarios:**

  ```
  Scenario: Create agenda item with rich text
    Tool: Playwright
    Preconditions: Frontend + backend running, logged in
    Steps:
      1. Navigate to `/agendas`
      2. Click to create a new agenda (or open existing)
      3. Click to add a new agenda item
      4. In the rich text editor, type "Test Item Description"
      5. Bold the text by selecting it and clicking the Bold toolbar button
      6. Click Save/Create
      7. Assert the item appears in the agenda with bold formatting preserved
    Expected Result: Rich text content saved and displayed correctly
    Failure Indicators: Plain text, lost formatting, save errors
    Evidence: .sisyphus/evidence/task-8-agenda-richtext-create.png

  Scenario: Edit existing agenda item with rich text
    Tool: Playwright
    Preconditions: An agenda item with HTML content exists
    Steps:
      1. Navigate to an agenda with existing items
      2. Click edit on an item
      3. Assert the rich text editor loads with existing formatted content
      4. Modify the content (add a heading)
      5. Save
      6. Re-open the item and assert the heading is preserved
    Expected Result: Existing content loads in editor, changes persist
    Failure Indicators: Empty editor on edit, content lost after save
    Evidence: .sisyphus/evidence/task-8-agenda-richtext-edit.png
  ```

  **Commit**: YES
  - Message: `feat(agendas): TipTap rich text editor for agenda items`
  - Files: Updated `RichTextEditor.tsx`, `AgendaList.tsx`, related components
  - Pre-commit: `cd frontend && npm run build`

- [ ] 9. TipTap rich text editor for staff reports

  **What to do**:
  - Extend the `RichTextEditor` component with report-specific features:
    - Support for report sections (heading levels, paragraphs, lists, tables)
    - Template section awareness — when a report has a `templateId`, show template section headings
  - Update `frontend/src/pages/Reports/ReportList.tsx`:
    - Replace plain text content input with `<RichTextEditor>`
    - When creating a report with a template, pre-populate editor with template section structure
    - When editing a report, load existing HTML content into TipTap
    - Save TipTap HTML output via `PATCH /api/reports/:id`
  - Update the report create/edit drawer to use the rich text editor
  - Ensure the editor handles the template-driven sections from existing template system

  **Must NOT do**:
  - Do NOT change the report data model in the backend
  - Do NOT implement DOCX round-tripping (import DOCX → TipTap → export DOCX) — existing import stays
  - Do NOT add real-time collaboration
  - Do NOT modify the report workflow or approval logic

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend UI integration for rich text editing in reports. Template-aware content editing requires UX attention.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 10, 11, 12, 13)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 16 (auto-save depends on report editor)
  - **Blocked By**: Tasks 1 (BaseRepository), 2 (ReportsService decomposition), 6 (TipTap install)

  **References**:

  **Pattern References**:
  - `frontend/src/pages/Reports/ReportList.tsx` — Current report list with create/edit flows. Understand existing text input.
  - `frontend/src/components/ui/WorkflowHistoryPanel.tsx` — Shows the workflow panel that sits alongside report editing. Don't overlap.
  - `frontend/src/components/ui/RichTextEditor.tsx` — Base TipTap component. May need report-specific toolbar config.

  **API/Type References**:
  - `frontend/src/api/reports.api.ts` — Report API client. The `updateReport` function sends content.
  - `frontend/src/api/templates.api.ts` — Template API for loading template section structure.
  - `backend/src/reports/dto/create-staff-report.dto.ts` — Report creation DTO shape

  **WHY Each Reference Matters**:
  - The ReportList page is where integration happens — understand the create/edit drawer pattern
  - The WorkflowHistoryPanel shares screen space with the editor — must not conflict
  - Template API shows how to fetch template section structure for pre-population

  **Acceptance Criteria**:

  - [ ] Report create/edit uses `<RichTextEditor>` instead of plain textarea
  - [ ] Template-linked reports pre-populate with template section headings
  - [ ] Editor loads existing HTML content when editing a saved report
  - [ ] Editor saves HTML content to backend on form submit
  - [ ] `cd frontend && npm run build` exits 0

  **QA Scenarios:**

  ```
  Scenario: Create staff report with rich text
    Tool: Playwright
    Preconditions: Frontend + backend running, logged in
    Steps:
      1. Navigate to `/reports?quick=new-report`
      2. Fill in title field with "Test Rich Text Report"
      3. In the rich text editor, type report content
      4. Add formatting: bold text, a heading, and a bullet list
      5. Click Create/Save
      6. Assert report is created and appears in the list
      7. Open the report and assert formatted content is preserved
    Expected Result: Rich text report content saved and displayed correctly
    Failure Indicators: Plain text saved, formatting lost, creation failure
    Evidence: .sisyphus/evidence/task-9-report-richtext-create.png

  Scenario: Template-linked report pre-populates sections
    Tool: Playwright
    Preconditions: A staff report template exists with sections
    Steps:
      1. Navigate to create a new report
      2. Select a template from the template dropdown
      3. Assert the rich text editor pre-populates with template section headings
      4. Fill in content under each section heading
      5. Save the report
    Expected Result: Template sections appear in editor, content saves correctly
    Failure Indicators: Empty editor after template selection, sections missing
    Evidence: .sisyphus/evidence/task-9-report-template-populate.png
  ```

  **Commit**: YES
  - Message: `feat(reports): TipTap rich text editor for staff reports`
  - Files: Updated `RichTextEditor.tsx`, `ReportList.tsx`, related components
  - Pre-commit: `cd frontend && npm run build`

- [ ] 10. TipTap WYSIWYG editor for minutes

  **What to do**:
  - Extend the `RichTextEditor` component with minutes-specific features:
    - Minutes-specific toolbar: attendance tracking, motion insertion, vote recording, action items
    - Custom TipTap extensions for structured minutes elements:
      - `<AttendanceBlock>` — who was present/absent
      - `<MotionBlock>` — motion text, mover, seconder, vote result
      - `<ActionItemBlock>` — action item with assignee and due date
  - Update `frontend/src/pages/Minutes/MinutesRegister.tsx`:
    - Replace the current JSON-structured minutes UI with a TipTap WYSIWYG editor
    - When creating minutes, initialize with a minutes template structure
    - When editing, load existing minutes content (HTML or convert from JSON if needed)
    - Save TipTap HTML output via `PATCH /api/minutes/:id`
  - The backend minutes content field should store HTML from TipTap
  - Maintain backward compatibility — if existing minutes have JSON content, render it as-is or provide migration

  **Must NOT do**:
  - Do NOT break existing minutes that have JSON-structured content — handle both formats
  - Do NOT implement automatic minutes generation from meeting data (that's AI-assisted, post-MVP)
  - Do NOT change the minutes lifecycle (start → finalize → publish)
  - Do NOT remove the attendance/motions/votes structured fields — the rich text is supplementary narrative

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex UI integration with custom TipTap extensions for structured minutes elements. Requires creative UX design for the motion/vote/attendance blocks.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9, 11, 12, 13)
  - **Parallel Group**: Wave 2
  - **Blocks**: None directly
  - **Blocked By**: Tasks 1 (BaseRepository), 6 (TipTap install)

  **References**:

  **Pattern References**:
  - `frontend/src/pages/Minutes/MinutesRegister.tsx` — Current minutes page with JSON-structured content. Understand what's being replaced.
  - `frontend/src/components/MinuteTaker/` — Existing minute-taking component directory (may be empty — check). If it has components, preserve their logic.

  **API/Type References**:
  - `frontend/src/api/minutes.api.ts` — Minutes API client. Understand the content field shape.
  - `backend/src/minutes/minutes.service.ts` — Minutes service. Understand how content is stored and retrieved.

  **External References**:
  - TipTap custom extensions: `https://tiptap.dev/docs/editor/getting-started/extend` — How to create custom node extensions for motion blocks, etc.

  **WHY Each Reference Matters**:
  - The MinutesRegister page shows the current UX that needs replacing
  - The MinuteTaker component directory may have existing logic to reuse
  - TipTap custom extension docs are essential for creating the structured minutes blocks

  **Acceptance Criteria**:

  - [ ] Minutes create/edit uses `<RichTextEditor>` with minutes-specific toolbar
  - [ ] Custom TipTap extensions render motion blocks, attendance, and action items
  - [ ] Existing JSON-structured minutes content still renders (backward compatible)
  - [ ] `cd frontend && npm run build` exits 0

  **QA Scenarios:**

  ```
  Scenario: Create minutes with rich text and structured blocks
    Tool: Playwright
    Preconditions: A meeting exists, frontend + backend running
    Steps:
      1. Navigate to `/minutes`
      2. Create new minutes for a meeting
      3. In the editor, type meeting narrative content
      4. Use the toolbar to insert a Motion Block
      5. Fill in motion text, mover, seconder
      6. Save the minutes
      7. Re-open and assert the motion block is preserved with data
    Expected Result: Minutes with structured blocks saved correctly
    Failure Indicators: Plain text saved, blocks lost, save error
    Evidence: .sisyphus/evidence/task-10-minutes-richtext.png

  Scenario: Existing JSON minutes still render
    Tool: Playwright
    Preconditions: Minutes with JSON-structured content exist in the database
    Steps:
      1. Navigate to `/minutes`
      2. Open an existing minutes record that has JSON content
      3. Assert the content renders (either as formatted JSON or converted to HTML)
      4. Assert no JavaScript errors in console
    Expected Result: Legacy JSON minutes still viewable
    Failure Indicators: Blank content, console errors, crash
    Evidence: .sisyphus/evidence/task-10-minutes-backward-compat.png
  ```

  **Commit**: YES
  - Message: `feat(minutes): TipTap WYSIWYG editor with structured blocks`
  - Files: Updated `RichTextEditor.tsx`, new custom TipTap extensions, `MinutesRegister.tsx`
  - Pre-commit: `cd frontend && npm run build`

- [ ] 11. Drag-and-drop agenda builder with dnd-kit

  **What to do**:
  - Build a dedicated agenda builder view in `frontend/src/components/AgendaBuilder/AgendaBuilder.tsx`:
    - Visual agenda outline showing all items in a tree/list structure
    - Drag-and-drop reordering using `@dnd-kit/core` + `@dnd-kit/sortable`
    - Support for hierarchical items (indent/outdent via drag or buttons)
    - Inline editing of item titles (click to edit)
    - Add/remove agenda items inline
    - Rich text content editing per item (using the `<RichTextEditor>` from Task 8)
    - "Save All" button that calls the reorder API + individual item updates
  - Add a route or modal for the agenda builder: enhance the agenda detail view to include a "Build Agenda" button that opens the builder
  - Connect to existing API:
    - `POST /api/agendas/:id/items/reorder` for reordering
    - `PATCH /api/agendas/:id/items/:itemId` for item updates
    - `POST /api/agendas/:id/items` for adding new items
    - `DELETE /api/agendas/:id/items/:itemId` for removing items
  - Add visual feedback during drag (drop indicators, placeholder)
  - Show item numbering that auto-updates on reorder

  **Must NOT do**:
  - Do NOT modify the backend agenda reorder endpoint — it already exists
  - Do NOT implement nested drag-and-drop for deeply hierarchical items (keep it flat with indentation levels)
  - Do NOT add real-time collaboration features
  - Do NOT create a new route — integrate into existing agenda detail experience

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex interactive UI component with drag-and-drop, visual hierarchy, and real-time feedback. Requires strong frontend UX skills.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 10, 12, 13)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 20, 21 (WCAG and responsive need the builder to exist)
  - **Blocked By**: Tasks 6 (dnd-kit install), 8 (agenda TipTap integration)

  **References**:

  **Pattern References**:
  - `frontend/src/pages/Agendas/AgendaList.tsx` — Current agenda list. The builder integrates from here.
  - `frontend/src/components/AgendaBuilder/` — Currently empty directory. Build the component here.
  - `frontend/src/components/ui/Drawer.tsx` — Drawer pattern for potential inline editing within the builder.

  **API/Type References**:
  - `frontend/src/api/agendas.api.ts` — All agenda API functions. The builder uses: `reorderAgendaItems`, `updateAgendaItem`, `addAgendaItem`, `deleteAgendaItem`.

  **External References**:
  - dnd-kit sortable: `https://docs.dndkit.com/presets/sortable` — The sortable preset for list reordering
  - dnd-kit examples: `https://github.com/clauderic/dnd-kit/tree/master/stories` — Real examples of sortable lists

  **WHY Each Reference Matters**:
  - The empty AgendaBuilder directory is the target location
  - The agenda API functions show exactly what endpoints are available
  - dnd-kit sortable docs show the exact API for implementing drag-and-drop lists

  **Acceptance Criteria**:

  - [ ] `frontend/src/components/AgendaBuilder/AgendaBuilder.tsx` exists with full dnd-kit integration
  - [ ] Agenda items can be dragged and dropped to reorder
  - [ ] Item numbering auto-updates after reorder
  - [ ] Save calls the reorder API with new item order
  - [ ] `cd frontend && npm run build` exits 0

  **QA Scenarios:**

  ```
  Scenario: Drag and drop reorders agenda items
    Tool: Playwright
    Preconditions: An agenda with 3+ items exists, frontend + backend running
    Steps:
      1. Navigate to the agenda detail page
      2. Click "Build Agenda" to open the builder
      3. Assert all agenda items are visible with correct numbering (1, 2, 3)
      4. Drag item 3 to position 1
      5. Assert numbering updates (former item 3 is now item 1)
      6. Click "Save"
      7. Refresh the page
      8. Assert the new order persists (item 3 is in position 1)
    Expected Result: Drag-drop reorder works and persists
    Failure Indicators: Items don't move, order doesn't save, numbering broken
    Evidence: .sisyphus/evidence/task-11-agenda-dnd-reorder.png

  Scenario: Add and remove items in builder
    Tool: Playwright
    Preconditions: Agenda builder open
    Steps:
      1. Click "Add Item" button
      2. Type "New Agenda Item" in the title field
      3. Assert new item appears at the bottom of the list
      4. Click delete on the new item
      5. Assert item is removed
    Expected Result: Items can be added and removed inline
    Failure Indicators: Add fails, delete fails, list doesn't update
    Evidence: .sisyphus/evidence/task-11-agenda-add-remove.png
  ```

  **Commit**: YES
  - Message: `feat(agendas): drag-and-drop agenda builder with dnd-kit`
  - Files: `frontend/src/components/AgendaBuilder/AgendaBuilder.tsx` and related files, updated agenda detail page
  - Pre-commit: `cd frontend && npm run build`

- [ ] 12. PDF meeting packet generation

  **What to do**:
  - Create a PDF generation utility in `frontend/src/utils/pdf-generator.ts`:
    - Use `jspdf` + `html2canvas` to render HTML content to PDF
    - Function signature: `generateMeetingPacket(meeting, agenda, reports, minutes): Promise<Blob>`
    - Generate a combined PDF with:
      1. Cover page (meeting title, date, location, type)
      2. Table of contents
      3. Agenda (formatted from rich text HTML)
      4. Staff reports (formatted from rich text HTML, one per report)
      5. Minutes (if finalized/published, formatted from rich text HTML)
    - Page breaks between major sections
    - Consistent headers/footers with page numbers
  - Add a "Generate Packet" button to:
    - `frontend/src/pages/Meetings/MeetingDetails.tsx` — per-meeting packet generation
  - Add a frontend API function to fetch all needed data for a packet:
    - `frontend/src/api/packets.api.ts` — `getPacketData(meetingId)` that fetches meeting + agenda + reports + minutes in one call
  - Create a backend endpoint `GET /api/meetings/:id/packet-data` that returns all data needed for PDF generation in a single response
  - Use browser's download functionality to save the generated PDF

  **Must NOT do**:
  - Do NOT implement server-side PDF generation (Puppeteer/Playwright on server) — client-side is sufficient and avoids server dependencies
  - Do NOT store generated PDFs in the database or filesystem — generate on demand
  - Do NOT add PDF editing/annotation features
  - Do NOT implement DOCX packet generation — PDF only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-file feature spanning backend endpoint + frontend PDF generation utility + UI integration. Requires understanding of multiple modules.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8–11, 13)
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Task 6 (jspdf + html2canvas installed)

  **References**:

  **Pattern References**:
  - `frontend/src/pages/Meetings/MeetingDetails.tsx` — Meeting detail page where the "Generate Packet" button will live
  - `frontend/src/api/meetings.api.ts` — Existing meeting API. Add `getPacketData` here or create new file.

  **API/Type References**:
  - `backend/src/meetings/meetings.controller.ts` — Meeting controller. Add the packet-data endpoint here.
  - `frontend/src/api/agendas.api.ts`, `reports.api.ts`, `minutes.api.ts` — API clients for data the PDF needs

  **External References**:
  - jsPDF: `https://github.com/parallax/jsPDF` — Client-side PDF generation
  - html2canvas: `https://html2canvas.hertzen.com/` — HTML to canvas rendering

  **WHY Each Reference Matters**:
  - MeetingDetails is the page where the feature integrates
  - Understanding the meeting controller shows how to add the new endpoint
  - jsPDF + html2canvas docs show the rendering approach

  **Acceptance Criteria**:

  - [ ] `frontend/src/utils/pdf-generator.ts` exists with `generateMeetingPacket` function
  - [ ] `GET /api/meetings/:id/packet-data` returns meeting, agenda, reports, and minutes
  - [ ] "Generate Packet" button exists on meeting detail page
  - [ ] Clicking the button downloads a PDF with all sections
  - [ ] `cd backend && npm run build` and `cd frontend && npm run build` both exit 0

  **QA Scenarios:**

  ```
  Scenario: Generate PDF meeting packet
    Tool: Playwright
    Preconditions: A meeting exists with linked agenda, reports, and minutes
    Steps:
      1. Navigate to meeting detail page
      2. Click "Generate Packet" button
      3. Wait for PDF generation (max 30s)
      4. Assert browser triggers a file download
      5. Assert downloaded file has .pdf extension
      6. Assert file size > 0 bytes
    Expected Result: PDF file downloaded with meeting content
    Failure Indicators: No download, empty file, generation error
    Evidence: .sisyphus/evidence/task-12-pdf-generation.png

  Scenario: PDF contains all sections
    Tool: Bash
    Preconditions: A PDF was generated
    Steps:
      1. Generate a PDF via the UI
      2. Use `pdfinfo` or similar to check page count > 1
      3. Assert the PDF has multiple pages (cover + content)
    Expected Result: Multi-page PDF with meeting packet content
    Failure Indicators: Single page, corrupted PDF
    Evidence: .sisyphus/evidence/task-12-pdf-contents.txt
  ```

  **Commit**: YES
  - Message: `feat(packets): PDF meeting packet generation`
  - Files: `frontend/src/utils/pdf-generator.ts`, `frontend/src/api/packets.api.ts`, updated `MeetingDetails.tsx`, new backend endpoint
  - Pre-commit: `cd backend && npm run build && cd frontend && npm run build`

- [ ] 13. Full-text search — frontend integration

  **What to do**:
  - Create a search bar component `frontend/src/components/ui/SearchBar.tsx`:
    - Global search input in the app header (next to existing global search position)
    - Debounced input (300ms) that calls `/api/search?q=...`
    - Dropdown showing top 5 results with type icons (meeting, agenda, report, minutes)
    - "View all results" link at bottom of dropdown
  - Create a search results page `frontend/src/pages/Search/SearchResults.tsx`:
    - Route: `/search?q=keyword`
    - Paginated list of results grouped by type (or filterable by type tabs)
    - Each result shows: title, type badge, excerpt with highlighted matching terms, link to detail
    - Pagination controls using standard table pagination pattern
  - Add route to `frontend/src/App.tsx` for `/search`
  - Connect to `frontend/src/api/search.api.ts` (created in Task 7)
  - Use the `useDataLoader` hook from Task 5 for data fetching

  **Must NOT do**:
  - Do NOT add autocomplete/suggestions — just a search bar with results
  - Do NOT add search filters beyond content type (no date range, status, etc.)
  - Do NOT implement saved searches or search history
  - Do NOT add search to the admin portal — internal workspace only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Frontend feature with new components, routing, and API integration. Multiple files but straightforward patterns.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8–12)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 20 (WCAG needs search to exist)
  - **Blocked By**: Tasks 5 (useDataLoader hook), 7 (search API)

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/StatusBadge.tsx` — Badge component pattern. Use for type badges on search results.
  - `frontend/src/hooks/useDataLoader.ts` — Data fetching hook. Use for search results fetching.
  - `frontend/src/App.tsx` — Route definitions. Add the `/search` route here.

  **API/Type References**:
  - `frontend/src/api/search.api.ts` — Search API client created in Task 7. Call `search(query, type, page, limit)`.
  - `frontend/src/types/` — Type definitions. May need a `SearchResult` type.

  **WHY Each Reference Matters**:
  - StatusBadge pattern shows how to render type indicators
  - useDataLoader is the standard fetching pattern to follow
  - The search API client defines the function signatures to call

  **Acceptance Criteria**:

  - [ ] `frontend/src/components/ui/SearchBar.tsx` exists with debounced search input
  - [ ] `frontend/src/pages/Search/SearchResults.tsx` exists with paginated results
  - [ ] `/search?q=test` route works and displays results
  - [ ] Search bar in header shows dropdown with top results
  - [ ] `cd frontend && npm run build` exits 0

  **QA Scenarios:**

  ```
  Scenario: Search returns results from header
    Tool: Playwright
    Preconditions: Frontend + backend running, content exists in database
    Steps:
      1. Navigate to any page
      2. Find the search input in the header
      3. Type "council" in the search bar
      4. Wait 500ms (debounce)
      5. Assert a dropdown appears with search results
      6. Assert each result has a title and type indicator
    Expected Result: Search dropdown shows matching results
    Failure Indicators: No dropdown, no results, timeout
    Evidence: .sisyphus/evidence/task-13-search-dropdown.png

  Scenario: Search results page with pagination
    Tool: Playwright
    Preconditions: Multiple matching results exist
    Steps:
      1. Navigate to `/search?q=test`
      2. Assert search results page loads with results
      3. Assert type filter tabs are visible (All, Meetings, Agendas, Reports, Minutes)
      4. Click on "Reports" tab
      5. Assert results are filtered to reports only
    Expected Result: Search results page with filtering
    Failure Indicators: No results, filter doesn't work, page error
    Evidence: .sisyphus/evidence/task-13-search-results-page.png
  ```

  **Commit**: YES
  - Message: `feat(search): full-text search frontend with results page`
  - Files: `frontend/src/components/ui/SearchBar.tsx`, `frontend/src/pages/Search/SearchResults.tsx`, updated `App.tsx`
  - Pre-commit: `cd frontend && npm run build`

- [ ] 14. Bulk operations — batch approve/publish

  **What to do**:
  - Add bulk action backend endpoints:
    - `POST /api/reports/bulk-action` — accept `{ reportIds: string[], action: 'approve-director' | 'approve-cao' | 'reject' | 'publish', comment?: string }`
    - `POST /api/agendas/bulk-action` — accept `{ agendaIds: string[], action: 'approve-director' | 'approve-cao' | 'reject' | 'publish', comment?: string }`
  - Each bulk action runs the corresponding single-action logic for each item in a transaction
  - Return partial success response: `{ succeeded: string[], failed: { id: string, reason: string }[] }`
  - Add bulk action frontend UI:
    - Multi-select checkboxes on report and agenda list tables
    - Floating action bar appears when items are selected showing available bulk actions
    - Confirmation dialog before executing bulk action
    - Progress indicator during execution
    - Toast notification with results summary (N succeeded, N failed)
  - Update `frontend/src/pages/Reports/ReportList.tsx` with multi-select
  - Update `frontend/src/pages/Agendas/AgendaList.tsx` with multi-select
  - Update `frontend/src/pages/Approvals/DirectorApprovalQueue.tsx` and `CaoApprovalQueue.tsx` with bulk approve/reject

  **Must NOT do**:
  - Do NOT add bulk delete — too dangerous for municipal records
  - Do NOT add bulk edit (changing fields on multiple items) — scope creep
  - Do NOT execute bulk actions without a confirmation dialog
  - Do NOT allow bulk publish without each item being in APPROVED status first

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Full-stack feature spanning backend API design + frontend multi-select UI + confirmation flow. Multiple files.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 15–19)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Tasks 1 (BaseRepository), 2 (ReportsService decomposition), 3 (pagination)

  **References**:

  **Pattern References**:
  - `backend/src/reports/reports-workflow.service.ts` — Workflow actions (from Task 2 decomposition). Bulk actions call these existing methods.
  - `backend/src/agendas/agendas.service.ts` — Agenda workflow methods. Same pattern for bulk.
  - `frontend/src/pages/Reports/ReportList.tsx` — Report list page where multi-select goes.
  - `frontend/src/pages/Approvals/DirectorApprovalQueue.tsx` — Approval queue where bulk approve is most useful.

  **API/Type References**:
  - `frontend/src/api/reports.api.ts` — Add `bulkReportAction` function
  - `frontend/src/api/agendas.api.ts` — Add `bulkAgendaAction` function

  **WHY Each Reference Matters**:
  - The workflow services contain the business logic to reuse in bulk operations
  - The approval queues are the primary use case for bulk approve
  - Existing API clients show the pattern for new bulk endpoints

  **Acceptance Criteria**:

  - [ ] `POST /api/reports/bulk-action` accepts array of IDs and action type
  - [ ] `POST /api/agendas/bulk-action` accepts array of IDs and action type
  - [ ] Frontend tables have multi-select checkboxes
  - [ ] Floating action bar appears with bulk action buttons when items selected
  - [ ] Confirmation dialog before bulk action execution
  - [ ] `cd backend && npm run build && cd frontend && npm run build` both exit 0

  **QA Scenarios:**

  ```
  Scenario: Bulk approve reports from director queue
    Tool: Playwright
    Preconditions: Multiple reports in PENDING_DIRECTOR_APPROVAL status, logged in as director
    Steps:
      1. Navigate to the director approval queue
      2. Check the checkboxes for 3 pending reports
      3. Assert floating action bar appears with "Approve" button
      4. Click "Approve"
      5. Assert confirmation dialog appears
      6. Confirm the action
      7. Assert toast notification shows "3 succeeded, 0 failed"
      8. Assert the 3 reports are no longer in the queue
    Expected Result: Bulk approve works for multiple reports
    Failure Indicators: Action bar missing, confirmation doesn't appear, partial failures
    Evidence: .sisyphus/evidence/task-14-bulk-approve.png

  Scenario: Bulk action with partial failure
    Tool: Bash
    Preconditions: Backend running, mixed report statuses
    Steps:
      1. `curl -s -X POST http://localhost:3000/api/reports/bulk-action -H "Content-Type: application/json" -H "X-Dev-Bypass: true" -H "X-CMMS-CSRF: test" -d '{"reportIds":["valid-id","invalid-id"],"action":"approve-director"}'`
      2. Assert response has `succeeded` and `failed` arrays
      3. Assert valid-id is in succeeded, invalid-id is in failed
    Expected Result: Partial success response with details
    Failure Indicators: All fail, all succeed when one should fail, 500 error
    Evidence: .sisyphus/evidence/task-14-bulk-partial.txt
  ```

  **Commit**: YES
  - Message: `feat(workflows): bulk approve/publish operations`
  - Files: Backend bulk-action endpoints, frontend multi-select UI, updated list pages and approval queues
  - Pre-commit: `cd backend && npm run build && cd frontend && npm run build`

- [ ] 15. Scheduled publishing

  **What to do**:
  - Install `node-cron` in backend: `npm install node-cron @types/node-cron`
  - Create `backend/src/publishing/publishing.module.ts`, `publishing.service.ts`, `publishing.scheduler.ts`:
    - `PublishingScheduler` runs a cron job every minute checking for items due to be published
    - Query: `SELECT * FROM app_agendas WHERE status = 'APPROVED' AND scheduled_publish_at <= NOW()`
    - Same for reports and minutes
    - Call existing publish methods on the respective services
  - Add `scheduled_publish_at` column to relevant tables via migration:
    - `backend/src/database/migrations/1700000011000-scheduled-publishing.sql`
    - Add `scheduled_publish_at TIMESTAMPTZ` to `app_agendas`, `app_staff_reports`, `app_minutes`
    - Add `scheduled_by UUID` and `scheduled_at TIMESTAMPTZ` columns
  - Update existing publish endpoints to accept optional `scheduledPublishAt` date:
    - `POST /api/agendas/:id/publish` — accept `{ scheduledPublishAt?: string }`
    - `POST /api/reports/:id/publish` — accept `{ scheduledPublishAt?: string }`
    - `POST /api/minutes/:id/publish` — accept `{ scheduledPublishAt?: string }`
    - If `scheduledPublishAt` provided, set status to `SCHEDULED` and save the timestamp instead of publishing immediately
  - Add frontend date/time picker in publish confirmation dialog:
    - "Publish Now" vs "Schedule for later" toggle
    - Date/time picker when "Schedule for later" selected
  - Register `PublishingModule` in `app.module.ts`
  - Add env var `SCHEDULED_PUBLISHING_ENABLED` (default: `true`) to control scheduler

  **Must NOT do**:
  - Do NOT implement scheduled unpublishing
  - Do NOT add recurring publish schedules
  - Do NOT implement timezone handling beyond UTC — store as UTC, display in local
  - Do NOT add email notifications for scheduled publish events (existing notification system handles this)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Full-stack feature with database migration, cron scheduler, API changes, and frontend date picker. Cross-cutting.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14, 16–19)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Tasks 1 (BaseRepository), 3 (pagination)

  **References**:

  **Pattern References**:
  - `backend/src/reports/reports-workflow.service.ts:publish()` — Existing publish logic. The scheduler calls this when the scheduled time arrives.
  - `backend/src/agendas/agendas.service.ts:publish()` — Same for agendas.
  - `backend/src/minutes/minutes.service.ts:publish()` — Same for minutes.
  - `backend/src/database/migrations/1700000009000-app-integrity-constraints.sql` — Migration naming and style convention.

  **API/Type References**:
  - `frontend/src/api/reports.api.ts` — `publishReport(id)` function. Update to accept optional scheduledPublishAt.
  - `frontend/src/api/agendas.api.ts` — `publishAgenda(id)` function. Same update.
  - `frontend/src/api/minutes.api.ts` — `publishMinutes(id)` function. Same update.

  **External References**:
  - node-cron: `https://github.com/node-cron/node-cron` — Cron scheduler for Node.js

  **WHY Each Reference Matters**:
  - Existing publish methods contain the business logic to reuse
  - Migration naming convention ensures consistency
  - node-cron is the lightweight scheduler needed (no need for Bull/BullMQ for this)

  **Acceptance Criteria**:

  - [ ] `scheduled_publish_at` column exists on agendas, reports, and minutes tables
  - [ ] `POST /api/agendas/:id/publish` accepts optional `scheduledPublishAt`
  - [ ] Cron scheduler checks every minute for items due to publish
  - [ ] Frontend has "Schedule for later" option in publish dialogs
  - [ ] `cd backend && npm run build && cd frontend && npm run build` both exit 0

  **QA Scenarios:**

  ```
  Scenario: Schedule agenda for future publish
    Tool: Bash
    Preconditions: An agenda in APPROVED status exists
    Steps:
      1. `curl -s -X POST http://localhost:3000/api/agendas/{id}/publish -H "Content-Type: application/json" -H "X-Dev-Bypass: true" -H "X-CMMS-CSRF: test" -d '{"scheduledPublishAt":"2099-01-01T00:00:00Z"}'`
      2. Assert response status is `SCHEDULED`
      3. Assert `scheduled_publish_at` is set to the future date
      4. Verify agenda is NOT yet visible on public portal
    Expected Result: Agenda scheduled but not published
    Failure Indicators: Immediately published, status not SCHEDULED
    Evidence: .sisyphus/evidence/task-15-schedule-publish.txt

  Scenario: Scheduler publishes overdue items
    Tool: Bash
    Preconditions: An item scheduled for past date exists
    Steps:
      1. Set `scheduled_publish_at` to a past timestamp directly in DB
      2. Wait for next cron tick (≤60 seconds)
      3. Query the item and assert status changed to PUBLISHED
      4. Assert `published_at` is now set
    Expected Result: Scheduler publishes the overdue item
    Failure Indicators: Status remains SCHEDULED, not published
    Evidence: .sisyphus/evidence/task-15-scheduler-exec.txt
  ```

  **Commit**: YES
  - Message: `feat(publishing): scheduled publishing with cron scheduler`
  - Files: Migration, `backend/src/publishing/` module, updated publish endpoints, frontend date picker
  - Pre-commit: `cd backend && npm run build`

- [ ] 16. Auto-save / offline draft support

  **What to do**:
  - Create `frontend/src/hooks/useAutoSave.ts`:
    - Accept a save function and content to save
    - Debounce saves (3-second delay after last edit)
    - Track save status: `idle | saving | saved | error`
    - Expose `saveStatus` and `forceSave` for manual save
  - Add auto-save indicator component `frontend/src/components/ui/AutoSaveIndicator.tsx`:
    - Shows: "Saving...", "All changes saved", "Save failed — retry"
    - Subtle positioning in editor headers
  - Add backend auto-save endpoints (lightweight, no workflow side effects):
    - `PATCH /api/reports/:id/autosave` — update content without changing status or triggering notifications
    - `PATCH /api/agendas/:id/items/:itemId/autosave` — same for agenda items
    - These bypass workflow guards — they only update content fields
  - Add offline draft support using `localStorage`:
    - When save fails (network error), store content in `localStorage` with key `draft:{type}:{id}`
    - On next successful load of the same item, check for local draft and prompt to restore
    - Add `frontend/src/utils/draftStorage.ts` for localStorage draft management
  - Integrate auto-save into the TipTap editor in report editing (Task 9's pages)

  **Must NOT do**:
  - Do NOT add conflict resolution (last-write-wins with timestamp is fine)
  - Do NOT implement real-time collaboration or operational transforms
  - Do NOT use IndexedDB — localStorage is sufficient for text drafts
  - Do NOT auto-save to workflow endpoints (which trigger notifications) — use dedicated autosave endpoints

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires careful design of debouncing logic, offline detection, localStorage management, and backend endpoint isolation from workflow.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14, 15, 17–19)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Tasks 5 (useDataLoader pattern), 9 (report TipTap integration)

  **References**:

  **Pattern References**:
  - `frontend/src/hooks/usePersistentState.ts` — Existing hook for localStorage persistence. Follow similar patterns.
  - `frontend/src/hooks/useDataLoader.ts` — Data fetching hook from Task 5. The auto-save hook should follow similar patterns.
  - `frontend/src/pages/Reports/ReportList.tsx` — Where the report editor lives. Integrate auto-save indicator here.

  **API/Type References**:
  - `backend/src/reports/reports-workflow.service.ts` — The autosave endpoint must NOT trigger workflow transitions. Understand what the regular update does to avoid it.
  - `backend/src/reports/reports.repository.ts` — Repository with update method. The autosave endpoint calls a simpler version.

  **WHY Each Reference Matters**:
  - usePersistentState shows the localStorage pattern already in use
  - The workflow service shows what NOT to trigger during autosave
  - The report editor page is where auto-save integrates

  **Acceptance Criteria**:

  - [ ] `frontend/src/hooks/useAutoSave.ts` exists with debounce and status tracking
  - [ ] `frontend/src/components/ui/AutoSaveIndicator.tsx` shows save status
  - [ ] `PATCH /api/reports/:id/autosave` updates content without workflow side effects
  - [ ] Offline drafts stored in localStorage and prompt to restore on reconnect
  - [ ] `cd backend && npm run build && cd frontend && npm run build` both exit 0

  **QA Scenarios:**

  ```
  Scenario: Auto-save triggers after edit
    Tool: Playwright
    Preconditions: Report editor open with TipTap
    Steps:
      1. Open a report for editing
      2. Type new content in the editor
      3. Wait 4 seconds (debounce is 3s)
      4. Assert auto-save indicator shows "All changes saved"
      5. Refresh the page
      6. Assert the new content is present
    Expected Result: Content auto-saved and persisted
    Failure Indicators: Indicator stuck on "Saving...", content lost on refresh
    Evidence: .sisyphus/evidence/task-16-autosave-trigger.png

  Scenario: Offline draft preserved
    Tool: Playwright
    Preconditions: Report editor open
    Steps:
      1. Use browser DevTools to go offline (or simulate via Playwright)
      2. Type content in the editor
      3. Wait for save attempt to fail
      4. Assert indicator shows "Save failed"
      5. Reload the page (still offline)
      6. Assert a prompt appears offering to restore the draft
    Expected Result: Draft preserved in localStorage, restore offered
    Failure Indicators: No draft prompt, content lost
    Evidence: .sisyphus/evidence/task-16-offline-draft.png
  ```

  **Commit**: YES
  - Message: `feat(editor): auto-save with offline draft support`
  - Files: `useAutoSave.ts`, `AutoSaveIndicator.tsx`, `draftStorage.ts`, backend autosave endpoints
  - Pre-commit: `cd backend && npm run build && cd frontend && npm run build`

- [ ] 17. Role delegation — substitute approvers

  **What to do**:
  - Create migration `backend/src/database/migrations/1700000012000-role-delegation.sql`:
    - Add `app_role_delegations` table: `id, delegator_user_id, delegate_user_id, start_at, end_at, created_at, is_active`
    - FK to `app_users` for both delegator and delegate
    - Check constraint: `end_at > start_at`
  - Create `backend/src/delegations/delegations.module.ts`, `delegations.service.ts`, `delegations.controller.ts`:
    - CRUD endpoints for managing delegations
    - `POST /api/delegations` — create a delegation (delegator = current user)
    - `GET /api/delegations` — list current user's delegations
    - `DELETE /api/delegations/:id` — revoke a delegation
    - `GET /api/delegations/active-substitutes` — get active delegates for current user (used by approval system)
  - Integrate into the approval system:
    - When checking approval permissions, also check if any active delegation exists where the current user is a delegate for someone with approval authority
    - If so, allow the delegate to approve on behalf of the delegator
    - Log the approval with both the actual actor and the on-behalf-of user
  - Add frontend UI in admin portal:
    - `frontend/src/pages/Admin/DelegationAdmin.tsx` — manage delegations
    - Add route to admin portal routes
    - Show "Approving on behalf of [Name]" badge when acting as delegate

  **Must NOT do**:
  - Do NOT allow chain delegation (delegate delegating to another delegate)
  - Do NOT implement auto-expiration notifications — just check dates at runtime
  - Do NOT allow delegating admin/super-admin roles
  - Do NOT modify the existing RBAC guard — add delegation check as supplementary logic

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Full-stack feature with database design, backend business logic, and admin UI. Requires careful permission modeling.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14–16, 18, 19)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 1 (BaseRepository)

  **References**:

  **Pattern References**:
  - `backend/src/reports/reports-workflow.service.ts:approveDirector()` — The approval method that needs delegation awareness
  - `backend/src/reports/reports-workflow.service.ts:approveCao()` — Same for CAO approval
  - `backend/src/core/guards/` — Existing guard patterns. Do NOT modify, but understand how they work.
  - `frontend/src/pages/Admin/UsersAdmin.tsx` — User admin page. The delegation admin should follow similar patterns.

  **API/Type References**:
  - `backend/src/users/users.repository.ts` — User lookups for delegation targets
  - `backend/src/audit/audit.service.ts` — Audit logging for delegation actions (who approved on behalf of whom)

  **WHY Each Reference Matters**:
  - The approval methods are where delegation logic integrates
  - The guards define how permissions are checked — delegation supplements, not replaces
  - The audit service must record delegation usage for compliance

  **Acceptance Criteria**:

  - [ ] `app_role_delegations` table exists with correct schema
  - [ ] CRUD endpoints work for delegation management
  - [ ] Active delegates can approve items on behalf of delegator
  - [ ] Approval history records show on-behalf-of information
  - [ ] Admin UI allows creating and revoking delegations
  - [ ] `cd backend && npm run build && cd frontend && npm run build` both exit 0

  **QA Scenarios:**

  ```
  Scenario: Delegate approves on behalf of delegator
    Tool: Bash
    Preconditions: A delegation exists (user B acting for user A), a report pending user A's approval
    Steps:
      1. As user B (the delegate), call approve: `curl -s -X POST http://localhost:3000/api/workflows/reports/{reportId}/approve-director -H "X-Dev-Bypass: true" -H "X-CMMS-CSRF: test"`
      2. Assert approval succeeds
      3. Check approval history: assert the event shows both the delegate (user B) and on-behalf-of (user A)
    Expected Result: Delegate can approve, audit trail shows delegation
    Failure Indicators: 403 forbidden, missing delegation audit info
    Evidence: .sisyphus/evidence/task-17-delegate-approve.txt

  Scenario: Expired delegation is rejected
    Tool: Bash
    Preconditions: A delegation with end_at in the past
    Steps:
      1. As the delegate, attempt to approve a pending item
      2. Assert 403 Forbidden (delegation expired)
    Expected Result: Expired delegation cannot be used
    Failure Indicators: Approval succeeds despite expired delegation
    Evidence: .sisyphus/evidence/task-17-expired-delegation.txt
  ```

  **Commit**: YES
  - Message: `feat(rbac): role delegation and substitute approvers`
  - Files: Migration, `backend/src/delegations/` module, updated approval logic, `DelegationAdmin.tsx`
  - Pre-commit: `cd backend && npm run build && cd frontend && npm run build`

- [ ] 18. Document versioning with diff views

  **What to do**:
  - Create migration `backend/src/database/migrations/1700000013000-document-versioning.sql`:
    - Add `app_document_versions` table: `id, document_type, document_id, version_number, content_snapshot, created_by, created_at, change_summary`
    - `document_type` enum: `AGENDA`, `REPORT`, `MINUTES`
    - Unique constraint on `(document_type, document_id, version_number)`
    - FK constraints to respective parent tables
  - Create `backend/src/versioning/versioning.module.ts`, `versioning.service.ts`, `versioning.controller.ts`:
    - `GET /api/versions/:documentType/:documentId` — list all versions
    - `GET /api/versions/:documentType/:documentId/:versionNumber` — get specific version
    - `GET /api/versions/:documentType/:documentId/diff?from=N&to=M` — get diff between two versions
    - Version creation happens automatically on every save (check if content changed, increment version)
  - Implement diff logic:
    - For text content: word-level diff (use `diff` npm package or similar)
    - Return diff in a structured format: `{ additions: [...], deletions: [...], unchanged: [...] }`
    - Render as HTML with green/red highlighting
  - Add frontend version history panel:
    - `frontend/src/components/ui/VersionHistory.tsx` — shows version list with timestamps and authors
    - Click a version to see content at that point
    - Select two versions to see a diff view
    - Diff view with green/red highlighting for additions/deletions
  - Add version history to report detail, agenda detail, and minutes detail views

  **Must NOT do**:
  - Do NOT implement version restore/rollback in this task — just viewing and diffing
  - Do NOT store binary attachments in version snapshots — text content only
  - Do NOT add branching or merging — simple linear version history
  - Do NOT implement auto-versioning on every keystroke — only on explicit saves

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Database schema design, version comparison logic, and complex UI (diff view with highlighting). Requires careful architecture.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14–17, 19)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Tasks 1 (BaseRepository), 5 (useDataLoader)

  **References**:

  **Pattern References**:
  - `backend/src/reports/reports.repository.ts:update()` — The update method where version snapshots should be triggered
  - `backend/src/agendas/agendas.repository.ts:update()` — Same for agendas
  - `frontend/src/components/ui/WorkflowHistoryPanel.tsx` — Similar UI pattern for showing history. The version history panel should follow this style.

  **API/Type References**:
  - `frontend/src/api/reports.api.ts` — Add `getReportVersions`, `getReportVersionDiff` functions
  - `frontend/src/api/agendas.api.ts` — Same for agendas

  **External References**:
  - diff npm package: `https://www.npmjs.com/package/diff` — JavaScript text diffing library

  **WHY Each Reference Matters**:
  - The repository update methods are where to hook version creation
  - WorkflowHistoryPanel shows the existing history UI pattern to follow
  - The diff library handles the comparison algorithm

  **Acceptance Criteria**:

  - [ ] `app_document_versions` table exists
  - [ ] Saving a report/agenda/minutes creates a version snapshot
  - [ ] `GET /api/versions/report/:id` returns version list
  - [ ] `GET /api/versions/report/:id/diff?from=1&to=2` returns structured diff
  - [ ] Frontend shows version history with diff view
  - [ ] `cd backend && npm run build && cd frontend && npm run build` both exit 0

  **QA Scenarios:**

  ```
  Scenario: Version created on save
    Tool: Bash
    Preconditions: A report exists with v1 content
    Steps:
      1. Update the report content: `curl -s -X PATCH http://localhost:3000/api/reports/{id} -H "Content-Type: application/json" -H "X-Dev-Bypass: true" -H "X-CMMS-CSRF: test" -d '{"content":"<p>Updated content</p>"}'`
      2. Get versions: `curl -s http://localhost:3000/api/versions/report/{id} -H "X-Dev-Bypass: true"`
      3. Assert version list has 2 entries (v1 and v2)
    Expected Result: New version created on save
    Failure Indicators: Only 1 version, 500 error
    Evidence: .sisyphus/evidence/task-18-version-created.txt

  Scenario: Diff between versions
    Tool: Bash
    Preconditions: A document with 2+ versions
    Steps:
      1. `curl -s "http://localhost:3000/api/versions/report/{id}/diff?from=1&to=2" -H "X-Dev-Bypass: true"`
      2. Assert response has `additions` and `deletions` arrays
      3. Assert additions contain the new content
      4. Assert deletions contain the old content
    Expected Result: Structured diff with additions and deletions
    Failure Indicators: Empty diff, wrong direction, missing fields
    Evidence: .sisyphus/evidence/task-18-version-diff.txt
  ```

  **Commit**: YES
  - Message: `feat(docs): document versioning with diff views`
  - Files: Migration, `backend/src/versioning/` module, `frontend/src/components/ui/VersionHistory.tsx`, updated detail pages
  - Pre-commit: `cd backend && npm run build && cd frontend && npm run build`

- [ ] 19. Meeting type workflow configuration UI

  **What to do**:
  - Create `backend/src/workflows/workflow-templates.service.ts`:
    - `GET /api/workflow-templates` — list available workflow templates (one per meeting type)
    - `GET /api/workflow-templates/:meetingTypeCode` — get the workflow stages for a meeting type
    - `PATCH /api/workflow-templates/:meetingTypeCode` — update workflow stages (add/remove/reorder stages, configure approvers per stage)
    - Default templates: Regular Council, Special Council, Committee of the Whole, In-Camera, custom committees
  - Create migration for workflow template storage:
    - `backend/src/database/migrations/1700000014000-workflow-templates.sql`
    - `app_workflow_templates` table: `id, meeting_type_code, stages (JSONB), created_at, updated_at`
    - `stages` JSONB structure: `[{ name, type, required_roles, is_mandatory, order }]`
  - Seed default workflow templates matching the current hardcoded flows:
    - Reports: DRAFT → PENDING_DIRECTOR_APPROVAL → PENDING_CAO_APPROVAL → APPROVED → PUBLISHED
    - Agendas: DRAFT → PENDING_DIRECTOR_APPROVAL → PENDING_CAO_APPROVAL → APPROVED → PUBLISHED
    - Minutes: DRAFT → IN_PROGRESS → FINALIZED → PUBLISHED
  - Create frontend admin page `frontend/src/pages/Admin/WorkflowTemplatesAdmin.tsx`:
    - List meeting types with their configured workflow stages
    - Drag-and-drop stage reordering
    - Toggle stages on/off
    - Configure which roles are required at each stage
    - Preview the workflow as a visual pipeline
  - Add route to admin portal: `/admin-portal/workflow-templates`

  **Must NOT do**:
  - Do NOT implement custom stage types beyond the existing ones (approval, review, publish)
  - Do NOT allow creating new meeting types from the workflow config — that's in MeetingTypesAdmin
  - Do NOT remove the existing hardcoded workflow logic yet — templates are configuration, not replacement
  - Do NOT add conditional branching (if/else paths in workflows) — linear workflows only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Full-stack feature with database design, API, and complex admin UI. Cross-cutting workflow configuration.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14–18)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 1 (BaseRepository)

  **References**:

  **Pattern References**:
  - `backend/src/workflows/workflow-config.repository.ts` — Existing workflow config repository. Understand its structure.
  - `backend/src/meeting-types/meeting-types.repository.ts` — Meeting type definitions. The workflow templates link to these.
  - `frontend/src/pages/Admin/MeetingTypesAdmin.tsx` — Meeting type admin page. The workflow templates admin should be adjacent to this.

  **API/Type References**:
  - `backend/src/meeting-types/` — Meeting type codes and names that the workflow templates reference
  - `frontend/src/pages/Admin/TemplatesAdmin.tsx` — Template admin page. Similar UI patterns for the workflow templates.

  **WHY Each Reference Matters**:
  - The existing workflow config repository shows the current workflow storage pattern
  - Meeting types define the keys that workflow templates attach to
  - The existing admin pages show the UI patterns to follow

  **Acceptance Criteria**:

  - [ ] `app_workflow_templates` table exists with seed data for all meeting types
  - [ ] CRUD endpoints for workflow template management
  - [ ] Admin UI at `/admin-portal/workflow-templates` with stage configuration
  - [ ] Default workflows match existing hardcoded behavior
  - [ ] `cd backend && npm run build && cd frontend && npm run build` both exit 0

  **QA Scenarios:**

  ```
  Scenario: View default workflow templates
    Tool: Bash
    Preconditions: Migration applied, seed data loaded
    Steps:
      1. `curl -s "http://localhost:3000/api/workflow-templates" -H "X-Dev-Bypass: true"`
      2. Assert response includes templates for REGULAR_COUNCIL, SPECIAL_COUNCIL, COMMITTEE_OF_WHOLE, IN_CAMERA
      3. Assert each template has a `stages` array with proper ordering
    Expected Result: Default workflow templates with stages
    Failure Indicators: Missing templates, empty stages, wrong ordering
    Evidence: .sisyphus/evidence/task-19-workflow-templates.txt

  Scenario: Configure workflow stages in admin UI
    Tool: Playwright
    Preconditions: Admin logged in, frontend + backend running
    Steps:
      1. Navigate to `/admin-portal/workflow-templates`
      2. Assert meeting types listed with their workflow stages
      3. Select "Regular Council" meeting type
      4. Assert stages displayed in order
      5. Toggle a stage off and save
      6. Assert the change persists after page reload
    Expected Result: Workflow stage configuration editable and persisted
    Failure Indicators: Stages not displayed, save fails, changes not persisted
    Evidence: .sisyphus/evidence/task-19-workflow-config-ui.png
  ```

  **Commit**: YES
  - Message: `feat(admin): meeting type workflow configuration UI`
  - Files: Migration, `backend/src/workflows/workflow-templates.service.ts`, `WorkflowTemplatesAdmin.tsx`, route additions
  - Pre-commit: `cd backend && npm run build && cd frontend && npm run build`

- [ ] 20. WCAG 2.1 AA verification and fixes

  **What to do**:
  - Run automated accessibility audit using axe-core or Lighthouse on all public-facing pages:
    - Public portal pages (`/public/*`, `/public/live-meeting/*`)
    - Login page
    - Search results page
  - Fix critical WCAG 2.1 AA violations found:
    - **Perceivable**: Ensure all images have alt text, color contrast ratios ≥ 4.5:1 for normal text, form inputs have associated labels, content is screen-reader navigable
    - **Operable**: All interactive elements reachable via keyboard (Tab, Enter, Escape), focus indicators visible, no keyboard traps, skip-to-content link
    - **Understandable**: Form validation errors associated with fields via `aria-describedby`, consistent navigation, error prevention on critical forms
    - **Robust**: Proper ARIA roles on custom components (TipTap editor, dnd-kit items, search dropdown), valid HTML5, no duplicate IDs
  - Add `aria-label` attributes to icon-only buttons (toolbar buttons in TipTap, action buttons)
  - Add `role="application"` to TipTap editor instances (interactive rich text area)
  - Add `aria-live="polite"` regions for dynamic content updates (auto-save indicator, search results, toast notifications)
  - Ensure focus management: modals trap focus, closing modals returns focus to trigger
  - Add skip-to-main-content link at top of page
  - Verify with keyboard-only navigation on all pages
  - Document WCAG compliance status in `docs/ACCESSIBILITY.md`

  **Must NOT do**:
  - Do NOT aim for WCAG AAA — AA is the target
  - Do NOT redesign the entire UI — fix violations, don't redesign
  - Do NOT add accessibility overlays or widgets (those create more problems)
  - Do NOT skip automated testing — use Playwright with axe-core for systematic checking

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Systematic audit and remediation across all pages. Requires understanding of WCAG standards and careful HTML/ARIA fixes without breaking functionality.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 21, 22)
  - **Parallel Group**: Wave 4
  - **Blocks**: Final Verification
  - **Blocked By**: Tasks 8–11 (editor components must exist to audit), Task 13 (search must exist)

  **References**:

  **Pattern References**:
  - `frontend/src/components/ui/Drawer.tsx` — Check for focus trap on modals/drawers
  - `frontend/src/components/ui/StatusBadge.tsx` — Check for color-only status indicators (need text/screen reader text)
  - `frontend/src/components/ui/RichTextEditor.tsx` — TipTap editor needs ARIA roles
  - `frontend/src/components/ui/SearchBar.tsx` — Search dropdown needs keyboard navigation and ARIA

  **API/Type References**:
  - All page components in `frontend/src/pages/` — Each page needs keyboard navigation verification

  **External References**:
  - WCAG 2.1 AA: `https://www.w3.org/TR/WCAG21/` — Official specification
  - axe-core: `https://github.com/dequelabs/axe-core` — Automated accessibility testing
  - Playwright accessibility: `https://playwright.dev/docs/accessibility-testing` — Playwright axe integration

  **WHY Each Reference Matters**:
  - UI components are where most violations live
  - WCAG spec defines the exact requirements to verify
  - axe-core + Playwright provide automated checking

  **Acceptance Criteria**:

  - [ ] Automated axe-core scan on all public pages: 0 critical violations
  - [ ] All interactive elements reachable via keyboard Tab navigation
  - [ ] Skip-to-content link present and functional
  - [ ] All form inputs have visible labels
  - [ ] Color contrast ratios ≥ 4.5:1 for normal text
  - [ ] `docs/ACCESSIBILITY.md` created with compliance status
  - [ ] `cd frontend && npm run build` exits 0

  **QA Scenarios:**

  ```
  Scenario: Automated axe-core accessibility audit
    Tool: Playwright (with axe-core)
    Preconditions: Frontend running at http://localhost:5173
    Steps:
      1. Run axe-core audit on: `/public`, `/public/live-meeting/*`, `/login`, `/search?q=test`
      2. Assert zero critical WCAG 2.1 AA violations on each page
      3. Assert zero serious violations on each page
    Expected Result: All pages pass automated accessibility checks
    Failure Indicators: Any critical or serious violations found
    Evidence: .sisyphus/evidence/task-20-axe-audit.txt

  Scenario: Keyboard-only navigation
    Tool: Playwright
    Preconditions: Frontend running, logged in
    Steps:
      1. Navigate to `/meetings` without using mouse
      2. Tab through all interactive elements (buttons, links, form inputs)
      3. Assert focus indicator is visible on every focused element
      4. Open a meeting detail drawer using Enter key
      5. Close drawer using Escape key
      6. Assert focus returns to the trigger element
    Expected Result: Full keyboard navigation works
    Failure Indicators: Focus disappears, elements unreachable, focus trapped
    Evidence: .sisyphus/evidence/task-20-keyboard-nav.png
  ```

  **Commit**: YES
  - Message: `fix(a11y): WCAG 2.1 AA verification and remediation`
  - Files: Updated components across `frontend/src/`, new `docs/ACCESSIBILITY.md`
  - Pre-commit: `cd frontend && npm run build`

- [ ] 21. Mobile/tablet responsive pass

  **What to do**:
  - Test all primary pages at mobile (375px), tablet (768px), and desktop (1280px) breakpoints:
    - `/meetings`, `/agendas`, `/reports`, `/minutes`, `/dashboard`
    - `/public`, `/public/live-meeting/*`
    - `/admin-portal/*` (lower priority — primarily desktop)
    - `/search`
  - Fix responsive issues found:
    - **Sidebar**: Collapse to hamburger menu on mobile, slide-out drawer on tablet
    - **Tables**: Add horizontal scroll or convert to card layout on mobile
    - **Drawers**: Full-screen on mobile, slide-over on tablet
    - **TipTap editor**: Full-width on mobile with simplified toolbar
    - **Agenda builder**: Stacked layout on mobile (drag handles remain accessible)
    - **Search bar**: Expand to full-width on mobile
    - **Bulk action bar**: Fixed bottom bar on mobile
  - Add touch-friendly interaction targets: minimum 44px touch targets on buttons
  - Ensure no horizontal overflow on any page at mobile width
  - Test on both Chrome DevTools device emulation and real devices if possible

  **Must NOT do**:
  - Do NOT build separate mobile apps or a separate mobile site — responsive design only
  - Do NOT redesign page layouts — just make existing layouts responsive
  - Do NOT add mobile-specific features (swipe gestures, pull-to-refresh)
  - Do NOT optimize admin portal for mobile (desktop-primary is acceptable)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: CSS-focused responsive design work across many pages. Requires visual attention to detail at multiple breakpoints.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 20, 22)
  - **Parallel Group**: Wave 4
  - **Blocks**: Final Verification
  - **Blocked By**: Tasks 8–11 (editor/builder components must exist to make responsive)

  **References**:

  **Pattern References**:
  - `frontend/src/components/layout/` — Layout components (sidebar, header). These need responsive breakpoints.
  - `frontend/src/styles/` — Existing CSS. Check for existing responsive patterns.
  - `frontend/src/components/ui/Drawer.tsx` — Drawer component that needs mobile adaptation.

  **API/Type References**:
  - All page components in `frontend/src/pages/` — Each page's responsive behavior needs checking

  **WHY Each Reference Matters**:
  - Layout components define the shell that wraps all pages — responsive fixes here cascade
  - Existing CSS shows whether there are responsive patterns already in use
  - The drawer is the primary overlay component and needs mobile treatment

  **Acceptance Criteria**:

  - [ ] All primary pages render correctly at 375px, 768px, and 1280px widths
  - [ ] Sidebar collapses to hamburger on mobile
  - [ ] Tables are usable on mobile (scrollable or card layout)
  - [ ] No horizontal overflow at mobile width
  - [ ] Touch targets ≥ 44px on all interactive elements
  - [ ] `cd frontend && npm run build` exits 0

  **QA Scenarios:**

  ```
  Scenario: Mobile layout at 375px width
    Tool: Playwright
    Preconditions: Frontend running
    Steps:
      1. Set viewport to 375x812 (iPhone X)
      2. Navigate to `/meetings`
      3. Assert sidebar is hidden, hamburger menu visible
      4. Click hamburger menu — assert sidebar slides in
      5. Assert meeting data is visible and usable (table scrolls horizontally or cards layout)
      6. Navigate to `/reports`
      7. Assert reports page is usable on mobile
    Expected Result: All pages usable at mobile width
    Failure Indicators: Overlapping elements, invisible content, horizontal scroll on body
    Evidence: .sisyphus/evidence/task-21-mobile-375.png

  Scenario: Tablet layout at 768px width
    Tool: Playwright
    Preconditions: Frontend running
    Steps:
      1. Set viewport to 768x1024 (iPad)
      2. Navigate to `/agendas`
      3. Open the agenda builder
      4. Assert drag handles are visible and touch-friendly
      5. Navigate to `/public`
      6. Assert public portal renders correctly at tablet width
    Expected Result: Tablet layout works for all features
    Failure Indicators: Tiny touch targets, broken layout, content overflow
    Evidence: .sisyphus/evidence/task-21-tablet-768.png
  ```

  **Commit**: YES
  - Message: `fix(ui): mobile and tablet responsive pass`
  - Files: Updated CSS across layout, component, and page files
  - Pre-commit: `cd frontend && npm run build`

- [ ] 22. Comprehensive documentation update

  **What to do**:
  - Update `README.md`:
    - Add section on rich text editing (TipTap)
    - Add section on search functionality
    - Add section on PDF packet generation
    - Add section on bulk operations
    - Add section on scheduled publishing
    - Add section on role delegation
    - Add section on document versioning
    - Add section on workflow configuration
    - Update API endpoint lists with all new endpoints
    - Update environment variables section with new env vars
  - Update `docs/IMPLEMENTATION_LOG.md`:
    - Add entries for all 22 tasks completed
    - Include technical decisions made during implementation
    - Note any deviations from the original plan
  - Update `docs/GO_LIVE_CHECKLIST.md`:
    - Add checklist items for new features (search, PDF, bulk ops, etc.)
    - Add accessibility verification steps
    - Add responsive testing steps
  - Update `docs/SECURITY_OPERATIONS_HARDENING.md`:
    - Document role delegation security model
    - Document autosave endpoint security (bypass workflow guards)
    - Document search endpoint access controls
  - Update `docs/ENVIRONMENT_CHECKLIST.md`:
    - Add new environment variables (`SCHEDULED_PUBLISHING_ENABLED`, etc.)
    - Add new npm dependencies
  - Create `docs/ACCESSIBILITY.md`:
    - WCAG 2.1 AA compliance status
    - Testing methodology
    - Known limitations
    - Remediation history
  - Ensure all documentation is consistent and cross-referenced

  **Must NOT do**:
  - Do NOT add screenshots to docs (they go stale) — use text descriptions
  - Do NOT create new docs beyond `docs/ACCESSIBILITY.md` — update existing
  - Do NOT add API documentation beyond README (no Swagger/OpenAPI setup)
  - Do NOT duplicate information — cross-reference existing docs

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation-focused task requiring clear, consistent writing across multiple files.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 20, 21)
  - **Parallel Group**: Wave 4
  - **Blocks**: Final Verification
  - **Blocked By**: All implementation tasks (1–21 should be complete)

  **References**:

  **Pattern References**:
  - `README.md` — Current README structure and style. Follow the same organization.
  - `docs/IMPLEMENTATION_LOG.md` — Current log format. Follow the same entry format.
  - `docs/GO_LIVE_CHECKLIST.md` — Current checklist format. Follow the same checklist style.
  - `docs/SECURITY_OPERATIONS_HARDENING.md` — Current security docs. Follow the same format.
  - `docs/ENVIRONMENT_CHECKLIST.md` — Current env docs. Follow the same format.

  **WHY Each Reference Matters**:
  - Each existing doc file has an established style that must be followed
  - README is the primary entry point and must be comprehensive
  - Implementation log captures the history for future reference

  **Acceptance Criteria**:

  - [ ] `README.md` updated with all new feature sections and endpoints
  - [ ] `docs/IMPLEMENTATION_LOG.md` has entries for all 22 tasks
  - [ ] `docs/GO_LIVE_CHECKLIST.md` updated with new verification steps
  - [ ] `docs/SECURITY_OPERATIONS_HARDENING.md` updated with delegation and autosave security
  - [ ] `docs/ENVIRONMENT_CHECKLIST.md` updated with new env vars
  - [ ] `docs/ACCESSIBILITY.md` created with WCAG compliance status
  - [ ] No broken cross-references between docs

  **QA Scenarios:**

  ```
  Scenario: Documentation completeness check
    Tool: Bash
    Preconditions: All docs updated
    Steps:
      1. Grep README.md for each new feature keyword: "TipTap", "search", "PDF", "bulk", "scheduled", "delegation", "versioning", "workflow"
      2. Assert each keyword appears at least once
      3. Grep IMPLEMENTATION_LOG.md for "Task" references 1–22
      4. Assert all 22 task references present
      5. Verify docs/ACCESSIBILITY.md exists and is non-empty
    Expected Result: All documentation comprehensive and complete
    Failure Indicators: Missing feature references, missing task entries, empty files
    Evidence: .sisyphus/evidence/task-22-docs-complete.txt

  Scenario: No broken internal links
    Tool: Bash
    Preconditions: Documentation updated
    Steps:
      1. Grep all .md files for relative links `[text](./path)` or `[text](path)`
      2. For each referenced path, check the file exists
      3. Assert no broken links
    Expected Result: All internal documentation links valid
    Failure Indicators: Referenced files not found
    Evidence: .sisyphus/evidence/task-22-docs-links.txt
  ```

  **Commit**: YES
  - Message: `docs: comprehensive documentation update for Waves 1-4`
  - Files: `README.md`, all `docs/*.md` files, new `docs/ACCESSIBILITY.md`
  - Pre-commit: None (documentation only)

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback → fix → re-run → present again → wait for okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` (backend) + `npm run build` (frontend) + `npm run test` (backend). Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: Multiple atomic commits per task
  - `refactor(database): extract BaseRepository with shared withFallback` — `base.repository.ts`, updated repos
  - `refactor(reports): decompose ReportsService into focused services` — new service files, module update
  - `fix(api): add pagination to all list endpoints` — DTOs, repository changes, controller changes
  - `perf(analytics): replace N+1 query with aggregate` — `analytics.service.ts`
  - `feat(frontend): add useDataLoader hook` — `hooks/useDataLoader.ts`
  - `chore(frontend): install tiptap, dnd-kit, and pdf libs` — `package.json`, `package-lock.json`
  - `feat(search): add Postgres FTS migration and search service` — migration, service, controller
- **Wave 2**: One commit per feature area
  - `feat(agendas): TipTap rich text editor for agenda items`
  - `feat(reports): TipTap rich text editor for staff reports`
  - `feat(minutes): TipTap WYSIWYG editor`
  - `feat(agendas): drag-and-drop agenda builder with dnd-kit`
  - `feat(packets): PDF meeting packet generation`
  - `feat(search): full-text search API and frontend integration`
- **Wave 3**: One commit per feature
  - `feat(workflows): bulk approve/publish operations`
  - `feat(publishing): scheduled publishing with cron`
  - `feat(editor): auto-save with offline draft support`
  - `feat(rbac): role delegation and substitute approvers`
  - `feat(docs): document versioning with diff views`
  - `feat(admin): meeting type workflow configuration UI`
- **Wave 4**: Two commits
  - `fix(a11y): WCAG 2.1 AA verification and remediation`
  - `fix(ui): mobile and tablet responsive pass`
  - `docs: comprehensive documentation update`

---

## Success Criteria

### Verification Commands
```bash
cd backend && npm run build           # Expected: clean exit 0
cd backend && npm run test            # Expected: all tests pass
cd frontend && npm run build          # Expected: clean exit 0
cd backend && curl -s http://localhost:3000/api/health  # Expected: {"status":"ok"}
```

### Final Checklist
- [ ] All "Must Have" items present and working
- [ ] All "Must NOT Have" items absent from codebase
- [ ] All existing tests still pass
- [ ] New tests for BaseRepository, decomposed services, search, pagination
- [ ] Frontend builds without TypeScript errors
- [ ] All documentation files updated
- [ ] No hardcoded secrets or credentials introduced
- [ ] All new API endpoints follow existing patterns (guards, DTOs, error handling)
