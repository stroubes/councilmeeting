# Implementation Log

This file tracks implemented scope, architecture decisions, and local test procedures.

## Completed Phases

### Phase 1 - Scaffolding + Base Schema

- Created `backend/` NestJS scaffold and `frontend/` React scaffold.
- Added foundational SQL migration:
  - `backend/src/database/migrations/1700000000000-init-schema.sql`
- Added seed data script:
  - `backend/src/database/seeds/1700000001000-seed-roles-permissions.sql`

### Phase 2 - Authentication + RBAC Foundation

- Added Microsoft token verification via JWKS (`jose`).
- Added global guards for authentication, roles, and permissions.
- Added decorators for public routes, role requirements, permission requirements, and current user injection.
- Added local dev bypass path for non-production testing.

### Phase 3 - Meetings + Agendas Foundation

- Implemented meetings and agendas modules with DTO validation and CRUD-style endpoints.
- Implemented agenda and agenda item workflow transitions:
  - `DRAFT -> PENDING_DIRECTOR_APPROVAL -> PENDING_CAO_APPROVAL -> APPROVED -> PUBLISHED`
  - rejection paths to `REJECTED`.

### Phase 4 - Reports + Approval Workflow Foundation

- Implemented staff reports domain:
  - create report
  - import simulated DOCX payload (`contentBase64`) into structured JSON
  - update, list, get
  - submit for Director review
- Implemented workflow domain for reports:
  - Director queue and actions
  - CAO queue and actions
  - report approval history
  - reject and resubmit flow

### Phase 4.1 - Persistence Layer (Reports/Workflow)

- Added PostgreSQL connectivity service:
  - `backend/src/database/postgres.service.ts`
  - `backend/src/database/database.module.ts`
- Added repository layer for reports + approval history:
  - `backend/src/reports/reports.repository.ts`
- Reports service now uses repository-backed data access and workflow state persistence.
- Added resilient fallback behavior:
  - If `DATABASE_URL` is missing or DB is unreachable, system falls back to in-memory mode for reports/workflows.
  - App remains usable for local UI and workflow demos.

### Phase 5 - Frontend Professional System UI

- Replaced scaffold-style pages with a production-grade municipal operations interface.
- Implemented application shell and design system primitives:
  - persistent sidebar and topbar layout
  - status badge system
  - reusable card/table styles
  - responsive behavior for desktop and mobile
- Styled and upgraded all core pages:
  - dashboard
  - meetings list + meeting details
  - agendas list
  - reports list
  - director and CAO approval queues
  - login/public/in-camera pages

### Phase 6 - Workflow UX, Drawers, and Metrics

- Added global topbar quick actions and workspace search routing.
- Added reusable slide-in drawer component and integrated create/edit workflows:
  - meetings create/edit
  - agendas create
  - reports create/edit
- Added workflow history panel for reports and approval queues.
- Added data-driven dashboard metrics and upcoming meetings table.

### Phase 7 - Persisted View State + Feedback + Shareable Links

- Added persistent UI state for key pages using local storage:
  - query, status filter, sort options, and pagination state
- Added toast notification system for success/error events.
- Added optimistic row updates for report submissions and approval queue actions.
- Added row-level loading states on submit/approve/reject actions.
- Added URL-synced page state on Meetings, Agendas, and Reports registers:
  - supports shareable filtered/sorted/paged links.
- Added inline drawer form validation for create/edit flows.

### Phase 8 - Persistence Expansion (Meetings + Agendas)

- Added repository-backed persistence for meetings and agendas.
- Added `app_meetings`, `app_agendas`, and `app_agenda_items` persistence model.
- Added relationship validation so agendas require an existing meeting.
- Added resilient in-memory fallback when PostgreSQL is unavailable.

### Phase 9 - Word Import + SharePoint Retrieval

- Replaced placeholder DOCX parser with OpenXML text extraction (`mammoth`) and structured section parsing.
- Added SharePoint/Graph retrieval path for DOCX import when `contentBase64` is not supplied:
  - import via `sharePointDriveId` + `sharePointItemId`
  - Microsoft client credentials token exchange (`/.default` scope)
- Added frontend "Import Word" workflow in Reports screen.

### Phase 10 - Lifecycle Completion + Workflow UX Wiring

- Added report publish endpoint (`POST /api/reports/:id/publish`) with permission enforcement.
- Added report publish action in frontend register for `APPROVED` reports.
- Added agenda lifecycle controls in frontend register:
  - submit director
  - director approve
  - CAO approve
  - reject
  - publish
- Added agenda item management drawer and item creation workflow.
- Replaced manual ID entry for key workflows:
  - agenda creation uses meeting selector
  - report creation/import uses agenda item selector

### Phase 11 - Minutes Workflow Implementation

- Implemented full minutes lifecycle module:
  - create
  - start
  - update
  - finalize
  - publish
- Added repository persistence for minutes (`app_minutes`) with in-memory fallback.

### Phase 12 - Users and Roles Administration

- Implemented managed users administration backend endpoints and persistence (`app_managed_users`).
- Added role assignment endpoint and role matrix listing endpoint.
- Added frontend pages for `/admin/users` and `/admin/roles`.

### Phase 13 - Public Portal Data Wiring

- Implemented backend public portal API (`/api/public/*`) with summary endpoint.
- Wired frontend public portal page to live published datasets:
  - meetings
  - agendas
  - reports
  - minutes
- Added filtering to exclude in-camera agenda items from public report visibility.

### Phase 14 - Audit Trail

- Added audit module with persistence (`app_audit_logs`) and fallback mode.
- Added audit logging for key transitions across:
  - reports
  - agendas
  - minutes
  - user role administration
- Added audit log listing endpoint (`GET /api/audit/logs`).

### Phase 15 - Backend Workflow Test Coverage

- Added Jest configuration and backend test runner setup.
- Added service-level tests for:
  - report publish authorization and state transition
  - public portal filtering behavior for in-camera records

### Phase 16 - Frontend Smoke Test Suite (Runbook)

- Added executable smoke test checklist in `docs/FRONTEND_SMOKE_TESTS.md` covering core lifecycle, admin routes, and regressions.

### Phase 17 - UAT Script

- Added municipal scenario UAT runbook in `docs/UAT_RUNBOOK.md` for:
  - Word-to-public report lifecycle
  - minutes lifecycle
  - access control validation

### Phase 18 - UX Polish for Operational Clarity

- Expanded dashboard metrics to include minutes and public release counts.
- Added navigation and quick-access paths for minutes and admin operations.
- Updated public portal UI to show agenda/report/minutes publication visibility.

### Phase 19 - Security and Operations Hardening

- Added production startup guard to block `AUTH_BYPASS_ENABLED=true` in production.
- Added security and operations hardening guide in `docs/SECURITY_OPERATIONS_HARDENING.md`.

### Phase 20 - Go-Live Readiness Artifacts

- Added go-live checklist in `docs/GO_LIVE_CHECKLIST.md`.
- Added environment checklist, smoke tests, UAT script, and hardening docs to operational documentation set.

### Phase 21 - Runtime Verification and Local Reliability

- Verified local PostgreSQL runtime and repaired missing role/database mismatch:
  - ensured `postgres` login role exists for local connection string parity
  - ensured `council_meeting` database exists and is reachable
- Applied all migrations and seed scripts to local DB and verified object counts.
- Verified backend API boot and endpoint health against live DB.
- Added CORS configuration for local frontend origins to support browser-based create/update workflows:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  - `http://127.0.0.1:4173`
- Re-verified meeting creation flow using dev bypass auth and browser-origin request simulation.

### Phase 22 - Executive SaaS UI System Upgrade

- Reworked frontend shell into a stronger SaaS-style experience while preserving persistent sidebar navigation.
- Implemented executive-grade module composition patterns across key operational pages:
  - KPI/briefing tiles
  - structured workspace toolbars
  - improved section hierarchy and contextual panel headings
- Upgraded dashboard into an executive command center with:
  - governance briefing cards
  - cycle health signal panel
  - priority action grid for Director/CAO/Public/Admin operations
- Upgraded workflow drawers with improved panel framing and form-action hierarchy.

### Phase 23 - Cross-Screen Usability and Content Polish

- Improved action language across approvals, minutes, and admin workflows for executive clarity (advance/finalize/return/publish phrasing).
- Added stronger empty/loading states in operational modules to improve wayfinding and status communication.
- Eliminated horizontal scrolling pressure across major screens by:
  - tightening responsive page container sizing
  - removing fixed table minimum width constraints
  - enabling robust table cell wrapping
  - hardening horizontal overflow behavior at layout level.
- Updated UAT and frontend smoke documentation to include:
  - executive demo narrative flow
  - cross-screen no-horizontal-scroll validation checklist.

### Phase 24 - Dedicated Admin Portal Entry and Workspace

- Added dedicated admin entry route (`/admin/login`) for separated administrative access flow.
- Added Admin Portal route group (`/admin-portal/*`) to isolate governance configuration modules from day-to-day operations workspace.
- Added user-avatar dropdown with conditional **Admin Portal** entry when account has admin permissions.
- Added admin portal home and module scaffolds for:
  - templates
  - notifications
  - API settings
- Maintained permission gating for Users and Roles modules under admin portal routes.
- Added admin shell visual variant so admin pages are clearly separated from operations workspace while staying in one application.

### Phase 25 - Admin Workspace Identity Reinforcement

- Added a persistent `Restricted Admin Workspace` context badge in admin page headers.
- Extended admin workspace shell behavior so navigation and shortcuts remain admin-scoped while preserving a clear return path to operations.
- Updated documentation and validation guidance to reflect final admin route separation and header context cues.

### Phase 26 - Template Administration + Report Attachments

- Implemented full template management module (`/api/templates`) with persistence and in-memory fallback:
  - create/list/update templates for `AGENDA` and `STAFF_REPORT`
  - add/edit/delete/reorder template sections
- Added admin template page implementation with drag-and-drop section ordering and active/inactive controls.
- Added Word template export endpoint (`GET /api/templates/:id/export-docx`) generated from template sections.
- Added agenda create auto-seeding so selecting an agenda template pre-populates agenda items in order.
- Wired agenda create flow to select from active agenda templates rather than free-text template IDs.
- Added staff report template assignment support on create/edit and persisted report `templateId` linkage.
- Added report supporting attachment endpoints and persistence (`app_report_attachments`):
  - `GET /api/reports/:id/attachments`
  - `POST /api/reports/:id/attachments`
  - `DELETE /api/reports/:id/attachments/:attachmentId`
- Added SharePoint Graph upload path for report attachments when `contentBase64` + `sharePointDriveId` are provided.

### Phase 27 - Preset-Driven Template Standardization

- Added role-tolerant permission guard behavior so `ADMIN` role can access admin routes even when permission arrays are not fully seeded in older sessions.
- Converted staff-report template section authoring to preset-driven dropdowns (no freehand section naming for standardized sections).
- Added one-click staff-report section bootstrap (`Add Standard Sections`) with duplicate-safe insertion.
- Converted agenda template section authoring to preset-driven dropdowns by meeting profile:
  - `REGULAR_COUNCIL`
  - `SPECIAL_COUNCIL`
  - `COMMITTEE_OF_WHOLE`
  - `IN_CAMERA`
- Added one-click agenda profile bootstrap (`Add [Profile] Sections`) with duplicate-safe insertion.
- Added agenda profile auto-inference from template code/name (regular/special/COW/in-camera keyword mapping).
- Added create-template meeting-type selector for agenda templates with automatic standardized code suggestions.
- Restricted template Word export action in admin UI to `STAFF_REPORT` templates only (agenda templates are now assembly-only artifacts).
- Added template standards documentation and canonical section catalogs:
  - `docs/TEMPLATE_STANDARDS.md`

### Phase 28 - BC Baseline Governance Guardrails (Agenda + Report Readiness)

- Added BC municipal profile constants and baseline section requirements for agenda governance checks:
  - `backend/src/governance/municipal-profile.constants.ts`
  - `frontend/src/config/municipalProfile.ts`
- Added profile inference helpers so template code/name can map to baseline meeting profile types:
  - `REGULAR_COUNCIL`
  - `SPECIAL_COUNCIL`
  - `COMMITTEE_OF_WHOLE`
  - `IN_CAMERA`
- Hardened agenda lifecycle transitions with structured readiness validation in backend service methods:
  - `submitForDirector`
  - `publish`
  - enforced checks include minimum content, in-camera authority item presence, and required section coverage when template-linked.
- Added structured validation error payloads (`message`, `profile`, `issues`) for agenda readiness failures.
- Hardened report lifecycle transitions with structured readiness validation in backend service methods:
  - `submitForDirector`
  - `resubmit`
  - enforced checks include title, executive summary, recommendation, and template-driven financial implications requirements.
- Strengthened agenda rejection audit quality by requiring rejection reasons at DTO level:
  - `backend/src/agendas/dto/reject-agenda.dto.ts`
- Improved frontend HTTP error handling so structured backend issues are surfaced directly in user-facing toasts/alerts:
  - `frontend/src/api/httpClient.ts`
- Upgraded agenda UI for clarity and non-technical language:
  - removed fragile `window.prompt` rejection flow and replaced with drawer form + required reason
  - added client-side readiness preflight checks before submit/publish
  - replaced ambiguous labels/actions (`Approve D/C`, technical ID language) with explicit role-based wording.

### Phase 29 - Staff Report UX Completion + Readiness Visibility

- Completed report create/edit form wiring for governance-required author fields:
  - `recommendations`
  - `financialImpact`
  - create/update payloads now persist these fields through API calls.
- Added client-side report submission preflight enforcement to block workflow submission until readiness requirements are met.
- Added per-row readiness signals in reports register for draft/rejected records:
  - `Ready to submit` vs `Needs updates (N)`
  - inline checklist details showing unmet readiness conditions.
- Reduced technical friction by replacing internal ID-centric copy in report register and forms:
  - `Agenda Item ID` -> `Agenda Item`
  - removed internal report ID display in table row secondary text in favor of report number status.
- Added progressive-disclosure UX for SharePoint technical inputs:
  - report import drawer now hides SharePoint ID path behind an explicit advanced toggle
  - attachment drawer now hides optional SharePoint item/web URL fields behind an explicit advanced toggle.
- Updated report module subtitle to explicitly reference BC baseline profile context.
- Verification completed after changes:
  - frontend build: `cd frontend && npm run build`
  - backend build: `cd backend && npm run build`
  - backend tests: `cd backend && npm test` (all suites passing).

### Phase 30 - Public Agenda Package Viewing (HTML/PDF)

- Added public agenda deep-linking and open action from Public Portal register:
  - `/public/agendas/:agendaId`
  - "Open Agenda" action in public agenda table.
- Added dedicated public agenda details page with package-style rendering:
  - agenda masthead with meeting date/time/location
  - section-style agenda item layout
  - linked published report package blocks
  - print-friendly rendering for browser PDF export.
- Added printable control path (`Save as PDF`) and print CSS behavior to hide app chrome.
- Added public meetings API wiring in frontend public API module to populate agenda masthead context.
- Corrected agenda display ordering for seeded/demo staff reports:
  - detailed staff-report entries are injected directly after `Staff Reports and Correspondence`
  - prevents staff report content from appearing after `Adjournment` in public package view.

### Phase 31 - Live Motion Board + Public Chamber Display

- Added full backend motions module with persistence and fallback support:
  - `app_motions` table
  - one-live-motion-per-meeting uniqueness guard
  - create/update/set-live/set-outcome service flows with audit logging.
- Added motions API endpoints for clerk console and public display:
  - authenticated motion operations (`/api/motions/*`)
  - public live feed and public motion state endpoints.
- Added staff-facing Live Motions console route:
  - `/motions`
  - create/edit motion text on-the-fly
  - set single live motion
  - mark outcome (`CARRIED`, `DEFEATED`, `WITHDRAWN`).
- Added public no-login chamber display route:
  - `/public/live-motion/:meetingId`
  - auto-refreshes and renders large-display motion text for council monitors and TV screens.
- Added keyboard shortcuts in motion console for live meeting operation:
  - `N` next motion live
  - `C` carried
  - `D` defeated
  - `W` withdrawn.
- Added 10-second post-result hold behavior on public screen:
  - after carried/defeated/withdrawn, most recent completed motion remains visible for 10 seconds
  - then transitions to awaiting-live state.
- Hardened frontend HTTP client response parsing:
  - gracefully handles `204` and empty-body responses
  - prevents false live-feed error states when no current live motion exists.

### Phase 32 - Unified Live Meeting Display (Agenda-First + Motion Switch)

- Added a backend meeting-display module with per-meeting display state persistence and DB fallback support:
  - `app_meeting_display_state` table
  - display mode (`AGENDA` or `MOTION`)
  - selected live agenda item pointer.
- Added meeting display API endpoints for clerk control and public viewing:
  - `GET /api/meeting-display?meetingId=...`
  - `GET /api/meeting-display/public/state?meetingId=...`
  - `POST /api/meeting-display/:meetingId/set-agenda-item`
  - `POST /api/meeting-display/:meetingId/next`
  - `POST /api/meeting-display/:meetingId/previous`
  - `POST /api/meeting-display/:meetingId/show-agenda`
  - `POST /api/meeting-display/:meetingId/show-motion`
- Upgraded `/motions` into a unified clerk console for both agenda slides and motions:
  - agenda slide jump + previous/next navigation
  - explicit mode switching where agenda remains default priority
  - integrated motion create/edit/live/outcome controls without changing screens.
- Added unified public display route for TVs/monitors:
  - `/public/live-meeting/:meetingId`
  - renders agenda slides or live motions from one URL.
- Added updated clerk hotkeys in unified console:
  - `N` next agenda slide
  - `P` previous agenda slide
  - `A` show agenda mode
  - `M` show motion mode
  - `C` carried
  - `D` defeated
  - `W` withdrawn.
- Added clerk quick-view panel showing exactly what text is currently on the public screen.
- Added full-row active slide highlighting with emphasis animation for quick operator scanning.

### Phase 33 - District of Sooke Branding for Live Screens

- Added District of Sooke logo assets for live displays:
  - `frontend/src/assets/logos/district-of-sooke-primary.png`
  - `frontend/src/assets/logos/district-of-sooke-primary-transparent.png`
- Re-themed live display UI to align with Sooke visual language and palette direction:
  - branded gradient canvas and card treatment
  - branded top header with logo, title, mode, and current time
  - improved TV readability across desktop/mobile form factors.
- Applied branded presentation to both public display routes:
  - `frontend/src/pages/Public/PublicLiveMeetingScreen.tsx`
  - `frontend/src/pages/Public/PublicLiveMotionScreen.tsx`
- Removed white tile framing around the logo and switched to transparent logo rendering.

### Phase 34 - Integrated Presentation Mode (PDF + PPT/PPTX Conversion)

- Added backend presentations module with repository-backed storage (DB + memory fallback):
  - `GET /api/presentations?meetingId=...`
  - `POST /api/presentations`
  - supports PDF uploads and PPT/PPTX auto-conversion to PDF.
- Added meeting display presentation state support:
  - expanded display mode set to `AGENDA`, `MOTION`, `PRESENTATION`
  - persisted `current_presentation_id` and `current_presentation_slide_index` in `app_meeting_display_state`.
- Added presentation control endpoints in meeting display API:
  - `POST /api/meeting-display/:meetingId/set-presentation`
  - `POST /api/meeting-display/:meetingId/presentation/next`
  - `POST /api/meeting-display/:meetingId/presentation/previous`
  - `POST /api/meeting-display/:meetingId/presentation/set-slide`
  - `POST /api/meeting-display/:meetingId/show-presentation`
  - `GET /api/meeting-display/public/presentation-content?meetingId=...`
- Upgraded `/motions` clerk console with integrated presentation workflows:
  - upload/select/show presentation
  - next/previous/go-to slide controls
  - unified next/previous behavior based on active display mode.
- Expanded public live route `/public/live-meeting/:meetingId` to render presentation mode:
  - embeds current PDF page for TV/council monitor display
  - displays slide number (`Slide X of Y`) and refreshes from same public URL.
- Added presenter remote keyboard support in clerk console:
  - `Arrow`, `PageUp/PageDown`, `Space`, `Enter`, `Backspace`
  - added `R` hotkey for presentation mode.
- Increased backend request size limit for large presentation payloads (JSON base64 uploads).

### Phase 35 - Live Display Operator UX and Presentation Renderer Stabilization

- Added clerk-level presentation correction controls in `/motions`:
  - delete presentation action for accidental uploads (`DELETE /api/presentations/:id`)
  - live mode button highlighting now mirrors actual active display mode.
- Added collapsible sections in `/motions` to reduce operator scrolling during live meetings:
  - agenda slides
  - presentation decks
  - motion controls.
- Replaced iframe-style PDF presentation rendering with direct PDF.js canvas rendering in public live screen:
  - removes browser toolbar chrome
  - scales slide to visible TV/monitor area without page scrolling.
- Hardened presentation rendering for rapid slide and layout changes:
  - stale render cancellation
  - latest-render nonce guard
  - resize observer driven re-render
  - prevents intermittent upside-down or stale frame races.

### Phase 36 - Meeting Types, Delete Coverage, and Meetings Calendar/Recurrence

- Added dedicated meeting type administration:
  - backend module + persistence for `app_meeting_types` with seeded defaults
  - admin route: `/admin-portal/meeting-types`
  - create/list/delete meeting type workflows.
- Replaced freehand meeting type entry with managed dropdown selection in meeting create/edit flows.
- Added broad delete capability so created records can be removed via API and UI:
  - meetings (`DELETE /api/meetings/:id`)
  - agendas (`DELETE /api/agendas/:id`)
  - agenda items (`DELETE /api/agendas/:id/items/:itemId`)
  - reports (`DELETE /api/reports/:id`)
  - motions (`DELETE /api/motions/:id`)
  - templates (`DELETE /api/templates/:id`)
  - meeting types (`DELETE /api/meeting-types/:id`)
  - existing delete support retained for attachments/sections/presentations.
- Added recurring meeting creation from `/meetings` create drawer:
  - none, weekly, biweekly, monthly patterns
  - configurable occurrence count.
- Added recurring series metadata in meetings persistence:
  - optional `recurrence_group_id`
  - optional `recurrence_index`
  - backward-compatible table evolution using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- Added recurring edit controls in meetings drawer:
  - `This meeting only`
  - `This and future meetings` (updates future series occurrences and creates missing occurrences when requested).
- Added meetings calendar UX:
  - list/calendar toggle
  - month grid and week time-grid layouts
  - previous/next + today navigation
  - recurring series labels in list and calendar views.
- Completed visual polish pass for calendar clarity:
  - stronger month/week range emphasis
  - aligned controls
  - improved day-cell readability and meeting card treatment.

### Phase 37 - Live Display Transport Upgrade (SSE Push)

- Added server-sent events stream endpoint for public live meeting display state:
  - `GET /api/meeting-display/public/stream?meetingId=...`
- Added stream publisher in meeting display service with server-side change detection:
  - emits only when live state payload changes.
- Updated public live meeting frontend route (`/public/live-meeting/:meetingId`) to consume SSE updates in real-time.
- Added resilience behavior in public live screen:
  - automatic fallback to 2-second polling when SSE connection fails
  - automatic recovery handling for stream reconnect/open events.
- Meeting metadata lookup remains available from public meetings API for masthead display context.

### Phase 38 - CI Pipeline Baseline (GitHub Actions)

- Added repository CI workflow:
  - `.github/workflows/ci.yml`
- CI now runs on push and pull requests for core validation:
  - backend dependency install + build + Jest test suite
  - frontend dependency install + production build.

### Phase 39 - Meetings Register Server-Side Querying

- Added paged Meetings API endpoint for register-scale datasets:
  - `GET /api/meetings/paged`
- Added backend query support for meetings register server-side controls:
  - search (`q`) across title and meeting type code
  - status filter
  - sort field (`title`, `startsAt`, `status`)
  - sort direction (`asc`, `desc`)
  - pagination (`page`, `pageSize`).
- Updated frontend Meetings module to consume paged API for list register mode while preserving full dataset loading for calendar mode and overview metrics.
- Existing `GET /api/meetings` behavior remains available for non-paged consumers in other modules.

### Phase 40 - Governance Policy Pack Baseline

- Added Governance module scaffold with API surface for municipal policy profile consumption:
  - `GET /api/governance/health`
  - `GET /api/governance/profile`
  - `GET /api/governance/policy-pack`
- Added initial policy pack service that resolves active municipal profile (env-driven, default `BC_BASELINE`) and returns:
  - profile metadata
  - required agenda sections by template profile
  - closed-session requirement flags.
- Added `MUNICIPAL_PROFILE_ID` backend configuration key (defaults to `BC_BASELINE`) for future multi-municipality profile switching.

### Phase 41 - Structured Minutes Contract Baseline

- Upgraded minutes content contract from generic JSON to structured schema payload:
  - attendance
  - motions and outcomes
  - votes and recorded vote entries
  - action items
  - summary/notes.
- Added backend content normalization to safely ingest legacy/unstructured records and return canonical schema.
- Added finalize readiness checks:
  - at least one present attendee
  - at least one motion
  - no motion may remain `PENDING` on finalize.
- Updated frontend minutes register to initialize minutes with structured schema and expose operational counts (attendance, motions, action items).

### Phase 42 - Notifications Event Pipeline Baseline

- Added backend Notifications module with event log repository and delivery-state lifecycle:
  - statuses: `PENDING`, `DELIVERED`, `FAILED`
  - retry support per event
  - persisted event history with PostgreSQL fallback-to-memory behavior.
- Added notifications API endpoints:
  - `GET /api/notifications/events`
  - `GET /api/notifications/summary`
  - `POST /api/notifications/events/:id/retry`
- Wired workflow emitters into core governance transitions:
  - agenda submit/approve/reject/publish
  - report submit/resubmit/approve/reject/publish
  - minutes finalize/publish
- Added admin Notification page implementation to monitor event status and trigger retries for failed events.

### Phase 43 - Policy-Pack Readiness Integration

- Refactored agenda and report readiness error payloads to use active municipal profile id from Governance service (env-driven profile selection).
- Refactored agenda section/closed-session readiness checks to consume `governance/policy-pack` semantics instead of direct hardcoded constants in service workflow code.

### Phase 44 - API Settings Management Baseline

- Added backend API Settings module with secure masked-value response model.
- Added admin-protected endpoints:
  - `GET /api/api-settings`
  - `GET /api/api-settings/runtime-metadata`
  - `POST /api/api-settings`
  - `DELETE /api/api-settings/:id`
- Added runtime metadata endpoint that reports configuration presence only (no secret values), including Microsoft/SharePoint integration flags and active profile.
- Replaced API Settings admin scaffold with live management UI:
  - create/update settings
  - delete settings
  - masked secret previews
  - runtime metadata snapshot table.
- Added backend unit test coverage for API settings masking and runtime metadata behavior.

### Phase 45 - Citizen Transparency Watchlists Baseline

- Added public subscription model for citizen watchlists:
  - email + topics + watch keywords + delivery frequency (`IMMEDIATE`, `DAILY_DIGEST`, `WEEKLY_DIGEST`)
  - active/pause state support.
- Added public subscription API endpoints:
  - `POST /api/public/subscriptions`
  - `GET /api/public/subscriptions?email=...`
  - `PATCH /api/public/subscriptions/:id`
  - `DELETE /api/public/subscriptions/:id`
  - `GET /api/public/subscriptions/:id/preview`
- Added preview matching logic that surfaces recent public meetings/agendas/reports/minutes matching watchlist keywords and selected topics.
- Added Public Portal UI support for citizens to:
  - create watchlists
  - list and manage subscriptions by email
  - pause/resume/delete subscriptions
  - preview matching alerts before delivery.

### Phase 46 - Notification Channel Adapters and Retry Strategy

- Upgraded notifications dispatch engine to support channel adapters:
  - `IN_APP` (internal success path)
  - `WEBHOOK` (generic outbound HTTP webhook)
  - `TEAMS` (Teams incoming webhook endpoint)
  - `EMAIL` (email-webhook bridge endpoint)
- Added bounded retry strategy with exponential backoff:
  - configurable max attempts (`NOTIFICATION_RETRY_MAX_ATTEMPTS`)
  - configurable base delay (`NOTIFICATION_RETRY_BASE_DELAY_MS`)
  - transitions event status through `PENDING` and then `FAILED` on exhausted retries.
- Updated manual retry behavior to reset delivery attempts and re-run dispatch.
- Added/updated unit tests for delivery success, retry exhaustion, and retry reset behavior.

### Phase 47 - Policy Profile Admin Controls

- Added governance profile runtime persistence via settings repository (`app_governance_settings`) with DB fallback support.
- Expanded municipal profile catalog to include baseline options:
  - `BC_BASELINE`
  - `AB_BASELINE`
  - `ON_BASELINE`
- Added governance profile management APIs:
  - `GET /api/governance/profiles`
  - `PATCH /api/governance/profile`
- Updated governance service to resolve active profile from runtime override first, then environment default.
- Updated agenda/report readiness checks and API settings runtime metadata to consume the active runtime profile.
- Implemented admin UI controls in API Settings page for selecting and applying active municipal policy profile.

### Phase 48 - Citizen Digest Scheduler Baseline

- Added automatic public digest scheduler service:
  - interval-based sweep for `DAILY_DIGEST` and `WEEKLY_DIGEST` subscriptions
  - configurable via `PUBLIC_DIGEST_SCHEDULER_ENABLED` and `PUBLIC_DIGEST_SCHEDULER_INTERVAL_MS`.
- Added digest due logic using `lastNotifiedAt` windows:
  - daily (24h)
  - weekly (7d)
- Digest sweep now emits notification events per due subscription with matched public content payload and updates `lastNotifiedAt` on delivery.
- Added secured manual trigger endpoint:
  - `POST /api/public/subscriptions/digest/run` (admin permission required)
- Added admin UI trigger in Notifications module for manual digest execution and run result feedback.

### Phase 49 - Digest Payload Templates by Channel

- Added digest-aware notification payload shaping in notification dispatch adapters:
  - `EMAIL`: structured template payload (`public-digest-v1`) with subject/body formatting
  - `TEAMS`: message-card payload with digest facts and summarized matches
  - `WEBHOOK`: canonical digest JSON payload (recipient, frequency, topics, matches).
- Added digest parsing/normalization helper in notification service to derive channel-specific payloads from `PUBLIC_DIGEST_*` events.
- Added unit test coverage validating email digest adapter payload composition.

### Phase 50 - Notifications and Digest Observability

- Added notifications observability endpoint:
  - `GET /api/notifications/observability`
- Observability payload now includes:
  - totals by status
  - per-channel delivery breakdown
  - digest-specific metrics (delivered/pending/failed/latest digest event)
  - backlog indicators (oldest pending age, high-retry volume).
- Added admin Notifications dashboard observability panel with channel table and digest health indicators.
- Added unit test coverage for observability aggregation behavior.

### Phase 51 - Executive KPI Dashboard Baseline

- Added backend Executive Analytics module with secure KPI endpoint:
  - `GET /api/analytics/executive-kpis`
- KPI payload now includes:
  - total records by entity type (meetings/agendas/reports/minutes)
  - approvals pressure (director/cao queue counts)
  - publication coverage percentages
  - median cycle-time hours (agenda/report/minutes)
  - report workflow quality rates (approved-or-published and rejected)
  - digest delivery health rollup
  - last-6-month publication trend.
- Added admin Executive KPI dashboard UI module with refresh action and trend table.
- Added analytics service unit tests and wired admin navigation for KPI dashboard access.

### Phase 52 - Meeting Selection Label Disambiguation

- Added shared frontend meeting display label helpers to disambiguate recurring meetings with identical titles.
- Updated meeting selectors in key workflow screens to show:
  - meeting title
  - scheduled date/time
  - short meeting id suffix.
- Applied selectors update to:
  - `/minutes` create-minutes workflow
  - `/agendas` create-agenda workflow
  - `/motions` live display console.
- Updated minutes register table meeting column to include scheduled date/time alongside meeting title for quick operator verification.

### Phase 53 - Agenda Template Selection Guardrails

- Updated `/agendas` create drawer template loading to inspect both active and inactive agenda templates.
- Added clear operator guidance when no selectable template is available:
  - no templates exist
  - templates exist but are disabled.
- Added default template auto-selection when active agenda templates exist and enforced create validation so agenda creation cannot proceed without a selected template in that case.

### Phase 54 - Database Degradation Visibility

- Updated backend health endpoint (`/api/health`) to report database check state (`up`, `down`, `disabled`) with explicit persistence messaging.
- Updated database service behavior to avoid permanently disabling PostgreSQL usage after one transient query failure.
- Added global frontend warning banner in `AppShell` that polls health and surfaces persistence-risk alerts to operators/admin users.

### Phase 55 - Larger Create Workflow Modal

- Upgraded shared `Drawer` UX to use a large centered modal layout by default for create/edit workflows.
- Preserved optional side-panel mode support for future cases via component prop (`layout='side'`).
- Applied responsive sizing updates so modal workflows remain usable on mobile while maximizing desktop working area.

### Phase 56 - Minutes Create Modal + Public Meetings Calendar

- Replaced `/minutes` inline create control with a full create modal workflow for improved operator space and consistency.
- Added public meetings calendar view in `/public` with:
  - list/calendar toggle
  - month navigation (previous, today, next)
  - day-cell meeting cards showing title, time, and location.

### Phase 57 - Configurable Workflow Definitions (Admin Baseline)

- Added backend workflow configuration persistence for report-domain workflow definitions:
  - `app_workflows` and `app_workflow_stages` auto-ensure schema path
  - resilient PostgreSQL + in-memory fallback behavior.
- Added workflow configuration API endpoints under `/api/workflows/configurations`:
  - list/get/create/update/delete workflow definitions
  - add/update/remove/reorder workflow stages.
- Added validation and service guardrails for workflow administration:
  - unique workflow code enforcement
  - unique stage key enforcement per workflow
  - single default workflow handling per domain (`REPORT`).
- Added admin portal workflow management UI:
  - new route: `/admin-portal/workflows`
  - create/delete workflow definitions
  - configure stage metadata and stage ordering.
- Wired admin shell and admin home navigation so workflow management is discoverable in the Admin workspace.

### Phase 58 - Report Runtime Uses Configured Default Workflow (Two-Stage Baseline)

- Updated report approval runtime orchestration to resolve current approver role and stage key from the active default `REPORT` workflow definition.
- Director/CAO queue endpoints now filter pending reports by configured stage approver role instead of assuming fixed role-to-status mapping.
- Director/CAO approve/reject endpoints now execute generic stage transitions using runtime stage metadata:
  - stage keys recorded in approval history now follow configured workflow stage keys when available
  - first-stage approval can now complete directly to `APPROVED` when only one stage is configured
  - two-stage progression remains supported via existing statuses (`PENDING_DIRECTOR_APPROVAL` -> `PENDING_CAO_APPROVAL` -> `APPROVED`).
- Expanded approval event typing (`stage: string`) so workflow history can represent configurable stage identifiers.

### Phase 59 - Per-Report Workflow Instance Metadata and Generic Pending Lane

- Added per-report workflow instance metadata in report persistence contract:
  - `workflowConfigId`
  - `currentWorkflowStageIndex`
  - `currentWorkflowStageKey`
  - `currentWorkflowApproverRole`
- Added schema evolution migration:
  - `backend/src/database/migrations/1700000006000-report-workflow-instance.sql`
- Updated report create/import flows to bind new reports to the active default report workflow (or explicit workflow id when supplied).
- Updated submit/resubmit runtime to initialize workflow instance state from stage 1 and map pending status by role:
  - `DIRECTOR` -> `PENDING_DIRECTOR_APPROVAL`
  - `CAO` -> `PENDING_CAO_APPROVAL`
  - all other roles -> `PENDING_WORKFLOW_APPROVAL`
- Added generic pending workflow list support in repository/service and updated queue resolution logic to include this lane for role-based filtering.
- Updated approval transition runtime to persist stage pointer advancement between configured stages and clear pointer state on reject/publish/final approval.

### Phase 60 - Report Authoring UI Wired to Workflow Definitions

- Updated staff report create/edit/import flows to support selecting a workflow definition from active `REPORT` workflows.
- Added workflow selector fields in report drawers:
  - create report
  - edit report
  - import Word report.
- Added default workflow auto-selection behavior in UI when a default active workflow is present.
- Added report register visibility of runtime workflow stage (`currentWorkflowStageKey`) to improve lifecycle transparency.
- Added frontend status filter support for `PENDING_WORKFLOW_APPROVAL` to reflect non-Director/non-CAO stage routing.

### Phase 61 - Generic Role Queue + Current Stage Approvals

- Added backend role-aware queue endpoint for dynamic workflow stages:
  - `GET /api/workflows/reports/my-queue`
- Added backend generic current-stage decision endpoints:
  - `POST /api/workflows/reports/:reportId/approve-current`
  - `POST /api/workflows/reports/:reportId/reject-current`
- Added frontend operations page for dynamic role approvals:
  - route: `/approvals/my`
  - page: `frontend/src/pages/Approvals/MyApprovalQueue.tsx`
- Updated operations navigation/search to expose My Queue alongside Director/CAO queues.

### Phase 62 - Workflow Admin Completion (Edit + Activate + Default)

- Expanded workflow admin page to support maintenance operations beyond create/delete:
  - set workflow as default
  - activate/deactivate workflow
  - edit existing stage metadata
  - cancel stage edit mode and return to add mode.
- Reused existing workflow configuration APIs (`PATCH` workflow + `PATCH` stage) to avoid introducing duplicate endpoints.
- Improved admin operations ergonomics so workflow governance can be fully managed from a single page.

### Phase 63 - Resolution + Bylaw Packet Foundation

- Added resolution register backend module (`/api/resolutions`) with CRUD and meeting export sheet support.
- Added resolution data model fields required for legislative packeting:
  - resolution number
  - bylaw number
  - mover/seconder
  - vote breakdown and adoption status.
- Added frontend resolutions register page (`/resolutions`) with resolution sheet export preview.

### Phase 64 - Action / Follow-Up Tracker

- Added backend action tracker module (`/api/actions`) with:
  - CRUD lifecycle
  - owner + due-date assignment
  - dashboard metrics (open, in progress, blocked, overdue, completed).
- Added frontend action tracker page (`/actions`) for creating, completing, and monitoring follow-up tasks.

### Phase 65 - Meeting Type Wizard + Standing Items

- Extended meeting type model with wizard configuration and standing-item templates.
- Added meeting type update endpoint support for wizard settings and standing-item definitions.
- Updated meeting type admin UI to capture wizard defaults and standing agenda items.
- Agenda creation now seeds standing items from the selected meeting type profile.

### Phase 66 - Advanced Publish Controls + Carry Forward

- Extended agenda item model with publish-control metadata:
  - `isPublicVisible`
  - `publishAt`
  - `redactionNote`
  - `carryForwardToNext`
- Agenda publish now respects public visibility/timed release and redaction behavior for public-facing content.
- Added carry-forward endpoint to copy marked unresolved items into a target draft agenda.
- Updated agenda UI to manage publish controls and carry-forward tagging on item creation.

### Phase 67 - Public Package Completeness

- Expanded public portal backend summary to include:
  - motions
  - resolutions
  - open actions
  - assembled meeting package records.
- Added public package endpoint (`/api/public/packages`) with search support.
- Updated public portal UI with package search and package-composition table (agenda/reports/minutes/motions/resolutions).

### Phase 68 - Governance Expansion Migration + Validation

- Added migration `1700000007000-governance-expansion.sql` covering:
  - agenda publish-control fields
  - meeting type wizard fields
  - resolutions table
  - action items table.
- Verified post-change stability with backend build/tests and frontend production build.

### Phase 69 - Screenshot Gap Polish (Automation + Public Visibility)

- Added automated action-item creation when a resolution transitions to `ADOPTED` with `isActionRequired = true`.
- Added meeting-type wizard default template application at agenda creation when no explicit template is selected.
- Expanded public portal to show motions, resolutions, and action-item tables (not just package counts/search).

### Phase 70 - Stabilization Pass (Tests + RBAC + Workflow Runtime Cleanup)

- Added backend unit tests for newly introduced governance behavior:
  - `backend/src/resolutions/resolutions.service.spec.ts`
  - `backend/src/agendas/agendas.service.spec.ts`
- Hardened RBAC for new governance modules:
  - new permissions: `resolution.manage`, `action.manage`
  - controller guards updated for resolution/action write endpoints
  - role map + seed permissions updated.
- Reduced workflow runtime dependency on legacy Director/CAO pending statuses:
  - new report submissions now route through `PENDING_WORKFLOW_APPROVAL`
  - next-stage transitions are stage-pointer driven (not role-status hardcoded).

### Phase 71 - Remaining Integration Finish (Linkages + Backfill + Admin UX)

- Added motion-to-resolution workflow shortcut in live meeting console (`Create Resolution`).
- Added minutes register governance context metrics (resolution volume + overdue follow-up actions).
- Added workflow admin duplication operation for rapid route variant setup.
- Expanded public package table with inline detail drill-down for package contents.
- Added governance backfill migration `1700000008000-governance-backfill.sql`:
  - report workflow config/pointer backfill
  - agenda publish metadata legacy-row normalization.
- Added action service unit coverage (`backend/src/actions/actions.service.spec.ts`).

### Phase 72 - Frontend Delivery Hardening (Route Code-Splitting)

- Converted primary application routes in `frontend/src/App.tsx` to lazy-loaded modules with suspense fallback.
- Reduced initial bundle pressure by splitting page-level chunks for operations/admin/public areas.
- Updated frontend smoke suite with governance workflow checks (`resolutions`, `actions`, `my queue`, public package details).

### Phase 73 - Frontend Design System Foundation

- **Phase 1a — Design Token Foundation:** Added complete typography scale (`--text-xs` through `--text-3xl`, 1.25 ratio), spacing scale (`--space-1` through `--space-16`, 4px base grid), transition tokens, shadow tokens, radius tokens, 10 status badge color states with dark mode variants, button color tokens, and dark mode via `@media (prefers-color-scheme: dark)`. Admin accent uses warm brown `#d4905a` override.
- **Phase 1b — Tokenization of globals.css:** Reduced hardcoded hex values from 253 → 114 across the stylesheet.
- **Phase 2 — Icon System:** Created `components/ui/types.ts` (`IconName` type, 54 icons), `components/ui/icons.ts` (all SVG definitions), `components/ui/Icon.tsx` (wrapper with `name`/`size`/`color`/`strokeWidth`/`className`/`aria-label`). Added `.icon-spinner` CSS keyframe with `prefers-reduced-motion` override.
- **Phase 3 — Shared UI Components:** Created 8 shared components:
  - `components/ui/Skeleton.tsx`
  - `components/ui/TextField.tsx`
  - `components/ui/Card.tsx` — exports `Card`, `CardHeader`, `CardBody` as **named** exports; `CardHeader` requires `title` string prop and uses `description` string prop (not children); does not accept `style` prop
  - `components/ui/MetricTile.tsx` — **default** export; uses `foot` prop (not `footer`)
  - `components/ui/DataTable.tsx` — **default** export; uses `rowKey`/`emptyMessage` props; uses `render: (row: T) => ReactNode` (not `cell`); generic constraint `T extends { id: string | number }`; `ColumnDef` type not re-exported
  - `components/ui/Pagination.tsx` — uses `currentPage`/`totalPages`/`onPageChange` props
  - `components/ui/ListToolbar.tsx`
  - `components/ui/Breadcrumb.tsx`
- **Phase 4 — Navigation Restructure:** Reorganized sidebar into 4 grouped sections with `.nav-group-sep` dividers, added `buildBreadcrumbs(pathname)` for page breadcrumbs, reduced shortcuts from 8 → 4 (each with icon), switched `.nav-link` to `display: flex` with gap for icon alignment, added `.nav-link-icon` and `.nav-group-sep` CSS.
- **Phase 5 — Accessibility Fixes:** Added `.skip-link` as first child of `.app-shell` linking to `#main-content`; converted health meters from `div[aria-hidden]` to `div[role="progressbar"]` with `aria-valuenow/min/max`; added `prefers-reduced-motion` coverage for `drawer-panel-modal` and `drawer-panel-side` keyframes.
- **Phase 6 — Page Refactoring (all 22 pages, all verified with `npm run build`):**
  - `Dashboard.tsx` — MetricTile (4), Card/CardHeader/CardBody (4), DataTable
  - `MeetingsList.tsx` — MetricTile (3), Card/CardHeader/CardBody, DataTable (list view; calendar tables preserved)
  - `MeetingDetails.tsx` — MetricTile (3), Card/CardHeader/CardBody (3), DataTable; fixed `list` → `file-text` icon
  - `AgendaList.tsx` — MetricTile (3), Card/CardHeader/CardBody, DataTable (7-column)
  - `ReportList.tsx` — metric tiles (4), card, DataTable (5), Pagination in `page-controls` div
  - `MyApprovalQueue.tsx` — MetricTile, Card/CardHeader/CardBody, DataTable (5)
  - `DirectorApprovalQueue.tsx` — MetricTile (2), Card/CardHeader/CardBody, DataTable (5)
  - `CaoApprovalQueue.tsx` — MetricTile (2), Card/CardHeader/CardBody, DataTable (5)
  - `ResolutionsRegister.tsx` — Card/CardBody, DataTable (5)
  - `MinutesRegister.tsx` — MetricTile (4), Card/CardHeader/CardBody, DataTable (7)
  - `ActionTracker.tsx` — MetricTile (4), Card/CardBody, DataTable (4)
  - `AdminPortalHome.tsx` — MetricTile, Card/CardHeader/CardBody
  - `RolesAdmin.tsx` — MetricTile, Card/CardHeader/CardBody, DataTable (2); needed `as unknown as` casting for `SystemRoleRecord[]` (no `id` property)
  - `ExecutiveKpisDashboard.tsx` — MetricTile (3), Card/CardHeader/CardBody (2), DataTable for monthly publications; needed `as unknown as` casting for `monthlyPublications` rows
  - `InCameraPortal.tsx` — Card/CardHeader/CardBody, DataTable (4); uses `stat-card` not `MetricTile`
  - `LiveMotionsConsole.tsx` — All 3 card sections replaced with Card/CardHeader/CardBody; 3 inline `<table>` elements preserved (agenda slides, presentations, motions — custom row highlighting, inline editing, `colSpan`)
  - `NotificationsAdmin.tsx` — MetricTile (4, default import), Card/CardHeader/CardBody (2); raw tables preserved (channel observability + retry actions)
  - `ApiSettingsAdmin.tsx` — MetricTile (3, default import), Card/CardHeader/CardBody (2); nested Runtime Metadata Snapshot card uses `Card`/`CardBody` with `h3` via `CardHeader`; raw tables preserved (settings table, Runtime Metadata table)
  - `UsersAdmin.tsx` — MetricTile (2, default import), Card/CardHeader/CardBody (2); raw tables preserved (Managed Users with per-row role assignment)
  - `WorkflowsAdmin.tsx` — MetricTile (1, default import), Card/CardHeader/CardBody (3); all 3 tables preserved as raw HTML (Configure Workflows with 5-button rows, Workflow Stages with Up/Down/Edit/Delete)
  - `MeetingTypesAdmin.tsx` — MetricTile (1, default import), Card/CardHeader/CardBody (2); both tables preserved as raw HTML (Enable Wizard + Delete per row)
  - `TemplatesAdmin.tsx` — MetricTile (3, default import), Card/CardHeader/CardBody (2); Template Library card's tab buttons moved to `CardHeader` `actions` prop; drag-and-drop table preserved as raw HTML
  - `PublicPortal.tsx` — Replaced 3 `section.card` blocks with `Card`/`CardHeader`/`CardBody`; tab buttons (Calendar/List View) and email input+Load moved to `CardHeader` `actions`; `article.stat-card` blocks left intact (`.stat-card` pattern distinct from `MetricTile`); all data tables preserved as raw HTML
- **Do NOT refactor (read-only pages):** `PublicAgendaDetails.tsx` (print document layout), `PublicLiveMeetingScreen.tsx` (fullscreen display), `PublicLiveMotionScreen.tsx` (fullscreen display).
- **Phase 7 — Performance Polish:** Added `preconnect` + `preload` + `stylesheet` `<link>` tags for Google Fonts (IBM Plex Sans, Playfair Display, Public Sans) in `index.html`; added `manualChunks` in `vite.config.ts` splitting `react-vendor` (163KB) and `pdf-worker` (446KB) into separate chunks; build verified with `npm run build`.

## API Snapshot

### Auth

- `GET /api/auth/health`
- `GET /api/auth/me`

### Meetings

- `GET /api/meetings/public`
- `GET /api/meetings`
- `POST /api/meetings`
- `GET /api/meetings/:id`
- `PATCH /api/meetings/:id`
- `DELETE /api/meetings/:id`

### Agendas

- `GET /api/agendas`
- `POST /api/agendas`
- `GET /api/agendas/:id`
- `PATCH /api/agendas/:id`
- `POST /api/agendas/:id/items`
- `PATCH /api/agendas/:id/items/:itemId`
- `POST /api/agendas/:id/items/reorder`
- `DELETE /api/agendas/:id/items/:itemId`
- `POST /api/agendas/:id/submit-director`
- `POST /api/agendas/:id/approve-director`
- `POST /api/agendas/:id/approve-cao`
- `POST /api/agendas/:id/reject`
- `POST /api/agendas/:id/publish`
- `POST /api/agendas/:id/carry-forward/:targetAgendaId`
- `DELETE /api/agendas/:id`

### Reports

- `GET /api/reports`
- `POST /api/reports`
- `POST /api/reports/import-docx`
- `GET /api/reports/:id/attachments`
- `POST /api/reports/:id/attachments`
- `DELETE /api/reports/:id/attachments/:attachmentId`
- `GET /api/reports/:id`
- `PATCH /api/reports/:id`
- `POST /api/reports/:id/submit`
- `POST /api/reports/:id/publish`
- `DELETE /api/reports/:id`

### Templates

- `GET /api/templates`
- `POST /api/templates`
- `GET /api/templates/:id`
- `PATCH /api/templates/:id`
- `GET /api/templates/:id/export-docx`
- `POST /api/templates/:id/sections`
- `PATCH /api/templates/:id/sections/:sectionId`
- `DELETE /api/templates/:id/sections/:sectionId`
- `POST /api/templates/:id/sections/reorder`
- `DELETE /api/templates/:id`

### Workflows (Reports)

- `GET /api/workflows/reports/director-queue`
- `GET /api/workflows/reports/cao-queue`
- `GET /api/workflows/reports/my-queue`
- `GET /api/workflows/reports/:reportId/history`
- `POST /api/workflows/reports/:reportId/approve-director`
- `POST /api/workflows/reports/:reportId/reject-director`
- `POST /api/workflows/reports/:reportId/approve-cao`
- `POST /api/workflows/reports/:reportId/reject-cao`
- `POST /api/workflows/reports/:reportId/approve-current`
- `POST /api/workflows/reports/:reportId/reject-current`
- `POST /api/workflows/reports/:reportId/resubmit`

### Workflows (Configurations)

- `GET /api/workflows/configurations`
- `GET /api/workflows/configurations/:id`
- `POST /api/workflows/configurations`
- `PATCH /api/workflows/configurations/:id`
- `DELETE /api/workflows/configurations/:id`
- `POST /api/workflows/configurations/:workflowId/stages`
- `PATCH /api/workflows/configurations/:workflowId/stages/:stageId`
- `DELETE /api/workflows/configurations/:workflowId/stages/:stageId`
- `POST /api/workflows/configurations/:workflowId/stages/reorder`

### Minutes

- `GET /api/minutes`
- `POST /api/minutes`
- `GET /api/minutes/:id`
- `PATCH /api/minutes/:id`
- `POST /api/minutes/:id/start`
- `POST /api/minutes/:id/finalize`
- `POST /api/minutes/:id/publish`

### Motions

- `GET /api/motions`
- `POST /api/motions`
- `GET /api/motions/:id`
- `PATCH /api/motions/:id`
- `POST /api/motions/:id/set-live`
- `POST /api/motions/:id/set-outcome`
- `DELETE /api/motions/:id`
- `GET /api/motions/public/live`
- `GET /api/motions/public/state`

### Resolutions

- `GET /api/resolutions`
- `GET /api/resolutions/:id`
- `POST /api/resolutions`
- `PATCH /api/resolutions/:id`
- `DELETE /api/resolutions/:id`
- `GET /api/resolutions/meeting/:meetingId/export-sheet`

### Action Tracker

- `GET /api/actions`
- `GET /api/actions/dashboard`
- `GET /api/actions/:id`
- `POST /api/actions`
- `PATCH /api/actions/:id`
- `DELETE /api/actions/:id`

### Meeting Types

- `GET /api/meeting-types`
- `GET /api/meeting-types/:id`
- `POST /api/meeting-types`
- `PATCH /api/meeting-types/:id`
- `DELETE /api/meeting-types/:id`

### Meeting Display

- `GET /api/meeting-display`
- `GET /api/meeting-display/public/state`
- `GET /api/meeting-display/public/stream`
- `GET /api/meeting-display/public/presentation-content`
- `POST /api/meeting-display/:meetingId/set-agenda-item`
- `POST /api/meeting-display/:meetingId/next`
- `POST /api/meeting-display/:meetingId/previous`
- `POST /api/meeting-display/:meetingId/show-agenda`
- `POST /api/meeting-display/:meetingId/show-motion`
- `POST /api/meeting-display/:meetingId/set-presentation`
- `POST /api/meeting-display/:meetingId/presentation/next`
- `POST /api/meeting-display/:meetingId/presentation/previous`
- `POST /api/meeting-display/:meetingId/presentation/set-slide`
- `POST /api/meeting-display/:meetingId/show-presentation`

### Presentations

- `GET /api/presentations`
- `GET /api/presentations/:id`
- `POST /api/presentations`
- `DELETE /api/presentations/:id`

### Users and Roles

- `GET /api/users`
- `POST /api/users`
- `POST /api/users/:id/roles`
- `GET /api/roles`

### Public Portal

- `GET /api/public/summary`
- `GET /api/public/meetings`
- `GET /api/public/agendas`
- `GET /api/public/reports`
- `GET /api/public/minutes`
- `GET /api/public/motions`
- `GET /api/public/resolutions`
- `GET /api/public/actions`
- `GET /api/public/packages`

### Audit

- `GET /api/audit/logs`

## Local Testing Guide

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Local DB Bootstrap (if needed)

```bash
psql -h localhost -p 5432 -d postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres'; END IF; END \$\$;"
createdb -h localhost -p 5432 -O postgres council_meeting
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/migrations/1700000000000-init-schema.sql
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/migrations/1700000002000-app-foundation-persistence.sql
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/migrations/1700000003000-governance-operations.sql
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/migrations/1700000004000-templates-and-attachments.sql
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/migrations/1700000005000-report-template-linking.sql
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/migrations/1700000006000-report-workflow-instance.sql
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/migrations/1700000007000-governance-expansion.sql
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/migrations/1700000008000-governance-backfill.sql
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/migrations/1700000009000-app-integrity-constraints.sql
psql "postgres://postgres:postgres@localhost:5432/council_meeting" -f backend/src/database/seeds/1700000001000-seed-roles-permissions.sql
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

### Frontend Production Build Check

```bash
cd frontend
npm run build
```

### Dev Bypass Login

In `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:3000/api
VITE_AUTH_BYPASS=true
```

Then open `http://127.0.0.1:4173/login` and click **Use Local Dev Login**.

## Known Gaps (Current)

- User provisioning remains local management scope and is not yet synchronized from Microsoft Graph profiles/groups.
- Minutes editor currently stores JSON notes and does not yet include rich motion/vote authoring UI.
- Automated frontend end-to-end tests are documented as smoke runbook and not yet implemented in CI (CI currently runs frontend build validation).
- Table sorting/pagination are currently client-side in the frontend and not yet server-backed query pagination.
- Live meeting public display now uses SSE push with polling fallback; broader event-driven transport across other modules is not yet implemented.

## 2026-03-23 Security Hardening Pass (Phase 1 Started)

- Removed hardcoded dev bypass credential usage from frontend auth context.
- Updated frontend dev bypass flow to use local bypass state + `X-Dev-Bypass` header only when explicitly enabled.
- Updated backend auth guard to require all three conditions for bypass:
  - `AUTH_BYPASS_ENABLED=true`
  - request header `X-Dev-Bypass: true`
  - `NODE_ENV` included in `AUTH_BYPASS_ALLOWED_ENVS`
- Added startup safety check to reject bypass in disallowed environments.
- Added global in-memory API rate limiting middleware with separate buckets for auth, public, and general API traffic.
- Added CSRF header middleware: unsafe methods now require `X-CMMS-CSRF`.
- Updated frontend HTTP client to:
  - send `X-CMMS-CSRF` for `POST`, `PATCH`, `DELETE`
  - avoid cookie credentials on API calls (`credentials: omit`)
  - attach `X-Dev-Bypass` only for explicit local bypass sessions.
- Updated environment and security docs (`README.md`, `docs/SECURITY_OPERATIONS_HARDENING.md`, `docs/ENVIRONMENT_CHECKLIST.md`, `docs/GO_LIVE_CHECKLIST.md`).

## 2026-03-23 Data Integrity Pass (Phase 2 Started)

- Added transactional support in `PostgresService` with `withTransaction(...)`.
- Added atomic report workflow transition repository path that writes workflow state and approval history in one transaction.
- Added optimistic concurrency control for report workflow transitions using `expectedUpdatedAt` guard checks.
- Added orphan cleanup and foreign key constraints for core app persistence tables:
  - `app_agendas` -> `app_meetings` (`ON DELETE CASCADE`)
  - `app_agenda_items` -> `app_agendas` (`ON DELETE CASCADE`)
  - `app_staff_reports` -> `app_agenda_items` (`ON DELETE CASCADE`)
  - `app_report_approvals` -> `app_staff_reports` (`ON DELETE CASCADE`)
  - `app_report_attachments` -> `app_staff_reports` (`ON DELETE CASCADE`)
  - `app_minutes` -> `app_meetings` (`ON DELETE CASCADE`)
- Added migration `1700000009000-app-integrity-constraints.sql` for explicit deployment-time integrity backfill + constraints.

## 2026-03-23 Data Integrity Pass (Phase 2 Continued)

- Added atomic agenda workflow transition path (`transitionWorkflowState`) so item status replacement and parent agenda workflow status/version updates are committed together.
- Added optimistic concurrency guard for agenda workflow transitions using `expectedUpdatedAt` checks.
- Updated agenda service workflow methods (`submitForDirector`, `approveByDirector`, `approveByCao`, `reject`, `publish`) to use transactional transition path.

## 2026-03-31 Clerk + Governance Workflow Upgrade

- Added clerk-facing minutes acceleration action in the frontend register:
  - `Auto-Populate` now calls `POST /api/minutes/:id/auto-populate` to synchronize attendance, motions, and vote outcomes into minutes content.
  - Added structured record snapshot visibility in the minutes edit drawer.
  - Files:
    - `frontend/src/pages/Minutes/MinutesRegister.tsx`
    - `frontend/src/api/minutes.api.ts`

- Added explicit conflict-of-interest declaration management UI to Meeting Details:
  - list declarations for a meeting
  - create declaration (person + optional agenda item + reason)
  - update reason
  - remove declaration
  - Files:
    - `frontend/src/components/ConflictDeclarationsPanel.tsx`
    - `frontend/src/api/conflictDeclarations.api.ts`
    - `frontend/src/api/types/conflict-declaration.types.ts`
    - `frontend/src/pages/Meetings/MeetingDetails.tsx`

- Added governance/compliance audit visibility in Admin Portal:
  - new admin route: `/admin-portal/audit-logs`
  - searchable and filterable audit log register (`GET /api/audit/logs`)
  - wired into admin navigation and admin home module grid
  - Files:
    - `frontend/src/pages/Admin/AuditLogsAdmin.tsx`
    - `frontend/src/api/audit.api.ts`
    - `frontend/src/api/types/audit.types.ts`
    - `frontend/src/App.tsx`
    - `frontend/src/components/layout/AppShell.tsx`
    - `frontend/src/pages/Admin/AdminPortalHome.tsx`

- Updated top-level docs to reflect clerk/compliance workflows:
  - `README.md`

## 2026-03-31 Minutes Structured Editor Upgrade

- Replaced minutes drawer from rich-text-only editing to a full structured editor for clerk operations.
- Added editable sections in the minutes drawer for:
  - attendance
  - motions
  - votes
  - action items
  - clerk notes
- Added editable structured summary text (`contentJson.summary`) alongside existing rich text summary.
- Updated save flow to persist both `richTextSummary` and structured `contentJson` in a single update call.
- Files:
  - `frontend/src/pages/Minutes/MinutesRegister.tsx`

### Phase 75 - P0 Credibility Gaps

**1. Production hard-fail for missing database (`backend/src/database/postgres.service.ts`):**
- Added `NODE_ENV` check in constructor: if `NODE_ENV === 'production'` and `DATABASE_URL` is not configured, throw `Error` at startup instead of warning
- Added `NODE_ENV` check in `query()` and `withTransaction()`: if production and DB fails, throw `Error` (not `DatabaseUnavailableError`) so repositories' in-memory fallback is not triggered
- In-memory fallback now only occurs in non-production environments

**2. Async notification delivery (`backend/src/notifications/notifications.service.ts`):**
- Refactored from synchronous inline retry loop with `sleep()` to queue-based async delivery
- `emit()` now creates notification and enqueues for async processing, returning immediately
- Added `processQueue()` method running on 2-second interval via `OnModuleInit`
- Added `drainQueueForId()` for inline synchronous drain (used by `emit()` to maintain backward-compatible final-state return)
- Removed `sleep()` helper and `resolveRetryDelayMs()` (no longer needed with queue-based retries)
- Failed deliveries are re-enqueued automatically; interval processor handles retry cycles
- `flush()` method exposed for test synchronization
- Updated unit tests to mock `getById` for async queue drain scenarios

**3. Playwright E2E in CI (`.github/workflows/ci.yml`):**
- Added `e2e` job that runs after `backend` and `frontend` builds
- Installs Playwright browsers with `npx playwright install --with-deps chromium`
- Runs `npx playwright test` with `CI=true` environment variable
- Uses existing `playwright.config.ts` web server entries to auto-start backend and frontend

**4. Removed official-record heuristics from public agenda packet (`frontend/src/pages/Public/PublicAgendaDetails.tsx`):**
- Removed `pageRangesByItem` memo that estimated page numbers based on narrative length (`Math.ceil(narrativeLength / 850)`)
- Removed page range display from agenda item section titles (`agenda-doc-range` span)
- Removed "Page X of Y" footer from report package sections
- Public agenda packet no longer simulates print pagination for official record purposes

## 2026-03-31 Presentation Display Bug Fix

**Bug**: After clerk clicks "Show Presentation", public screen stays on "Waiting for Agenda" instead of switching to presentation mode.

**Root Cause**: SSE stream's `distinctUntilChanged` used `JSON.stringify(state)` as the signature for deduplication. This included `updatedAt`, which is set via `new Date().toISOString()`. If two consecutive `getState()` polls happened within the same second (or if no upsert occurred between polls), `updatedAt` remained the same, causing `distinctUntilChanged` to suppress the emission even though `displayMode` changed from `'AGENDA'` to `'PRESENTATION'`.

**Fix**: Replaced `JSON.stringify(state)` with a computed signature based on meaningful state fields (`displayMode`, `agendaItemId`, `motionLiveId`, `motionOutcomeId`, `presentationId`, `presentationSlideIndex`). This ensures `distinctUntilChanged` properly emits when actual display state changes, regardless of whether `updatedAt` changed.

**Files Modified**:
- `backend/src/meeting-display/meeting-display.service.ts`: Added `computeStateSignature()` method and updated `streamPublicState()` to use it

## 2026-04-02 Public Presentation Screen Initialization Fix

**Bug**: The public live meeting screen could stay in its default agenda view even while the backend already reported `displayMode: 'PRESENTATION'` and served the PDF correctly.

**Root Cause**: `frontend/src/pages/Public/PublicLiveMeetingScreen.tsx` treated SSE as the only initialization path. When the page's `EventSource` remained stuck in `CONNECTING`, the component never called `loadState()` and never started polling, so `displayState` stayed `null` and the screen fell back to agenda mode.

**Fix**:
- Load the current meeting-display state immediately on mount.
- Start 2-second polling immediately as a safety net.
- Keep polling active until the SSE connection actually fires `onopen`, then stop polling.

**Verification**:
- Confirmed the live public route renders the existing uploaded PDF with a non-zero canvas and no console errors.
- Added a Playwright regression that creates a meeting, uploads a one-page PDF, enables presentation mode, and asserts the public screen renders presentation mode.

**Files Modified**:
- `frontend/src/pages/Public/PublicLiveMeetingScreen.tsx`
- `frontend/tests/e2e/meeting-lifecycle.spec.ts`

## 2026-04-02 Public Presentation Screen Real-Time Update Fix

**Bug**: Advancing a slide in the clerk console did not update the public screen in real-time. The public screen required a manual page refresh to see the new slide. Polling also failed to pick up the change.

**Root Cause**: The backend SSE stream sent events with `type: 'meeting-display-state'` (named event). The frontend used `stream.onmessage` which only handles events with type `message` (or no type). Named SSE events are silently ignored by the `onmessage` handler — the event never fires, so `applyIncomingState` is never called.

The EventSource API specifies that `onmessage` only fires for events with type `message` or no type. Events with a named type (e.g., `event: meeting-display-state`) require `addEventListener('meeting-display-state', handler)` to receive them.

**Fix**: Changed `stream.onmessage` to `stream.addEventListener('meeting-display-state', handler)` in `PublicLiveMeetingScreen.tsx`. The handler signature and body are identical; only the registration method changed.

**Files Modified**:
- `frontend/src/pages/Public/PublicLiveMeetingScreen.tsx`
- `frontend/tests/e2e/meeting-lifecycle.spec.ts` (regression test)

## 2026-04-02 Meeting Type Badge Styling Fix

**Bug**: Meeting type in the meeting register was rendered as plain gray muted text (`<div className="muted">Regular Council Meeting</div>`), looking like unstyled metadata rather than a proper visual tag. Right next to it, the Status column used a polished pill-shaped badge — the contrast made the meeting type look sloppy.

**Fix**:
- Created `frontend/src/components/ui/MeetingTypeBadge.tsx` — a new badge component that renders meeting types as compact, neutral-colored pill tags. Uses the display `name` when available, falls back to humanized `code`.
- Added CSS tokens (`--meeting-type-text`, `--meeting-type-bg`, `--meeting-type-border`) and `.meeting-type-badge` class — neutral slate/blue-gray palette, smaller and lighter than `StatusBadge` (not uppercase, normal weight).
- Updated 4 views that displayed raw `meetingTypeCode` as muted text:
  - `MeetingsList.tsx` — meeting register table (with name lookup via `meetingTypeNameByCode`)
  - `MeetingDetails.tsx` — meeting detail page timeline
  - `PublicPortal.tsx` — public meeting list table
  - `InCameraPortal.tsx` — in-camera meeting list table
  - `Dashboard.tsx` — upcoming meetings widget

**Files Modified**:
- `frontend/src/components/ui/MeetingTypeBadge.tsx` (new)
- `frontend/src/styles/globals.css`
- `frontend/src/pages/Meetings/MeetingsList.tsx`
- `frontend/src/pages/Meetings/MeetingDetails.tsx`
- `frontend/src/pages/Public/PublicPortal.tsx`
- `frontend/src/pages/Meetings/InCameraPortal.tsx`
- `frontend/src/pages/Dashboard.tsx`

## 2026-04-04 Session — Epic 3 Fixes, Epic 6 Publishing Pipeline, Epic 9 Report Generators

### Epic 3: Participant Portal — Bug Fixes

**Bug 1**: `ConflictDeclarationsController` used `PERMISSIONS.MEETING_WRITE` for declaring conflicts, but COI declaration should be its own permission.

**Fix**:
- Added `CONFLICT_DECLARE: 'conflict.declare'` to `permissions.constants.ts`
- Assigned `CONFLICT_DECLARE` to `COUNCIL_MEMBER` role in `rbac-map.constants.ts`
- Updated `ConflictDeclarationsController` to use `PERMISSIONS.CONFLICT_DECLARE` instead of `PERMISSIONS.MEETING_WRITE`

**Bug 2**: `ParticipantMeetingView.tsx` and `ParticipantAgendaView.tsx` passed `breadcrumbs` prop to `AppShell`, which does not support that prop (breadcrumbs are built internally via `buildBreadcrumbs()`).

**Fix**: Removed `breadcrumbs` prop from `AppShell` in both views.

**Files Modified**:
- `backend/src/core/constants/permissions.constants.ts`
- `backend/src/core/constants/rbac-map.constants.ts`
- `backend/src/conflict-declarations/conflict-declarations.controller.ts`
- `frontend/src/pages/Participant/ParticipantMeetingView.tsx`
- `frontend/src/pages/Participant/ParticipantAgendaView.tsx`

### Epic 6: Publishing Pipeline

**Goal**: Allow staff to publish/unpublish individual agenda items (separate from meeting-level status).

**Changes**:
- Migration `1700000018000-agenda-item-publish-status.sql` — adds `publish_status` column (`DRAFT`, `PUBLISHED`, `ARCHIVED`) to `app_agenda_items`
- `AgendasRepository` — updated schema/INSERT/UPDATE statements to include `publish_status`, added `publishedAt` timestamp
- `AgendasService` — `publishItem()` and `unpublishItem()` methods
- `AgendasController` — `PATCH /agendas/:id/publish` and `PATCH /agendas/:id/unpublish` endpoints with `AGENDA_PUBLISH` permission
- `AgendaItemRecord` and `MeetingRecord` frontend types — added `publishStatus` field

**Files Modified**:
- `backend/src/database/migrations/1700000018000-agenda-item-publish-status.sql` (new)
- `backend/src/agendas/agendas.repository.ts`
- `backend/src/agendas/agendas.service.ts`
- `backend/src/agendas/agendas.controller.ts`
- `frontend/src/api/types/agenda.types.ts`
- `frontend/src/api/types/meeting.types.ts`

### Epic 9: Reporting Center

**Goal**: Provide department-head and CAO-level reporting on meeting activity.

**Backend module** (`backend/src/report-generators/`):
- `report-generators.module.ts` — imports Meetings, Motions, Votes, ConflictDeclarations, Users
- `report-generators.service.ts` — 5 generators: `generateAttendanceReport()`, `generateMotionReport()`, `generateVotingReport()`, `generateConflictOfInterestReport()`, `generateForecastReport()`
- `report-generators.controller.ts` — 5 GET endpoints: `/attendance`, `/motions`, `/voting`, `/conflicts`, `/forecast` (all `MEETING_READ` permission)

**Bug fixed**: `report-generators.service.ts` imported `MotionRecord` from `motions.service` and `VoteRecord` from `votes.service` — these are actually exported from `.repository` files. Fixed imports.

**Frontend**:
- `reportGenerators.api.ts` — API functions for all 5 reports
- `report-generator.types.ts` — TypeScript interfaces for all report entry types
- `AttendanceReport.tsx`, `MotionReport.tsx`, `VotingReport.tsx`, `ConflictReport.tsx`, `ForecastReport.tsx` — 5 report views using DataTable
- `App.tsx` — added 5 routes: `/reports/attendance`, `/reports/motions`, `/reports/voting`, `/reports/conflicts`, `/reports/forecast`

**Bug fixed**: `DataTable<T>` requires `T extends { id: string | number }`. Added `id?: string` to report types and used `as` casts with `rowKey` prop in each view.

**Note**: `ReportGeneratorsModule` was imported into `app.module.ts`.

**Files Created**:
- `backend/src/report-generators/report-generators.module.ts`
- `backend/src/report-generators/report-generators.service.ts`
- `backend/src/report-generators/report-generators.controller.ts`
- `frontend/src/api/reportGenerators.api.ts`
- `frontend/src/api/types/report-generator.types.ts`
- `frontend/src/pages/Reports/AttendanceReport.tsx`
- `frontend/src/pages/Reports/MotionReport.tsx`
- `frontend/src/pages/Reports/VotingReport.tsx`
- `frontend/src/pages/Reports/ConflictReport.tsx`
- `frontend/src/pages/Reports/ForecastReport.tsx`

**Files Modified**:
- `backend/src/app.module.ts`
- `frontend/src/App.tsx`
- `frontend/src/api/types/meeting.types.ts`
- `frontend/src/api/types/agenda.types.ts`

### NestJS Module Dependency Fixes

**Bug 1**: `ConflictDeclarationsModule` did not export `ConflictDeclarationsRepository`, causing DI errors when `VotesService` (which imports `ConflictDeclarationsRepository`) was used.

**Fix**: Added `ConflictDeclarationsRepository` to `exports: [ConflictDeclarationsService, ConflictDeclarationsRepository]` in `ConflictDeclarationsModule`.

**Bug 2**: `VotesModule` imports `ConflictDeclarationsRepository` but did not import `ConflictDeclarationsModule`, causing DI errors.

**Fix**: Added `ConflictDeclarationsModule` to `imports` in `VotesModule`.

**Files Modified**:
- `backend/src/conflict-declarations/conflict-declarations.module.ts`
- `backend/src/votes/votes.module.ts`

### Dev Server Fixes

**Bug**: Port 5173 was occupied by a stale Vite process (PID 95340). Killed stale process and restarted frontend cleanly.

**Env verification**: `VITE_AUTH_BYPASS=true` (frontend) and `AUTH_BYPASS_ENABLED=true` (backend) were already set in `.env` files.

### Sidebar Navigation

The sidebar (`AppShell.tsx`) already has a `Reports` nav item at `/reports` with prefix matching (`p.startsWith('/reports')`), which covers all 5 new report routes (`/reports/attendance`, `/reports/motions`, `/reports/voting`, `/reports/conflicts`, `/reports/forecast`). No additional nav changes were needed.

### Verification

- `cd backend && npx tsc --noEmit` — **PASS**
- `cd frontend && npx tsc --noEmit` — **PASS**
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:5173`
