# Council Meeting Management System

Initial scaffold for a municipal Council Meeting Management System.

## Workspace

- `backend/` NestJS API scaffold and database migration SQL.
- `frontend/` React + Vite UI scaffold.
- `docs/` implementation and operational documentation.
- `.github/workflows/` CI automation (backend build/test + frontend build).

## Quick Start

### Backend

1. Copy `backend/.env.example` to `backend/.env` and fill values.
2. Install dependencies: `npm install`.
3. Run dev server: `npm run start:dev`.

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env` and fill values.
2. Install dependencies: `npm install`.
3. Run dev server: `npm run dev`.

## Database

- Foundational schema migration is in:
  - `backend/src/database/migrations/1700000000000-init-schema.sql`
- Additional app persistence migrations are in:
  - `backend/src/database/migrations/1700000002000-app-foundation-persistence.sql`
  - `backend/src/database/migrations/1700000003000-governance-operations.sql`
  - `backend/src/database/migrations/1700000004000-templates-and-attachments.sql`
  - `backend/src/database/migrations/1700000005000-report-template-linking.sql`
- Seed script is in:
  - `backend/src/database/seeds/1700000001000-seed-roles-permissions.sql`

## Auth + RBAC (Implemented Foundation)

- Frontend uses Microsoft login via `@azure/msal-browser`.
- Access token is sent as `Bearer` to backend.
- Backend verifies Microsoft JWT signature and claims using JWKS (`jose`).
- Global NestJS guards enforce:
  - authentication (`MicrosoftSsoGuard`)
  - role checks (`RolesGuard`)
  - permission checks (`PermissionsGuard`)
- Current user endpoint:
  - `GET /api/auth/me`

### Local Dev Auth Bypass

For local testing without Microsoft Identity setup:

- Frontend: set `VITE_AUTH_BYPASS=true` in `frontend/.env`.
- Use the **Use Local Dev Login** button on `/login`.

By default in non-production mode, backend accepts `Bearer dev-bypass-token` and creates a local dev user context (default role: `ADMIN`).
You can also force bypass with `AUTH_BYPASS_ENABLED=true` in `backend/.env`.

## Meetings + Agendas (Implemented Foundation)

- Meetings endpoints:
  - `GET /api/meetings/public`
  - `GET /api/meetings`
  - `GET /api/meetings/paged`
  - `POST /api/meetings`
  - `GET /api/meetings/:id`
  - `PATCH /api/meetings/:id`
  - `DELETE /api/meetings/:id`
- Agendas endpoints:
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
  - `DELETE /api/agendas/:id`

## Reports + Workflows (Implemented Foundation)

- Reports endpoints:
  - `GET /api/reports`
  - `POST /api/reports`
  - `POST /api/reports/import-docx`
  - `GET /api/reports/:id/attachments`
  - `POST /api/reports/:id/attachments`
  - `DELETE /api/reports/:id/attachments/:attachmentId`
  - `GET /api/reports/:id`
  - `PATCH /api/reports/:id`
  - `POST /api/reports/:id/submit`
  - `DELETE /api/reports/:id`
- Workflow endpoints:
  - `GET /api/workflows/reports/director-queue`
  - `GET /api/workflows/reports/cao-queue`
  - `GET /api/workflows/reports/:reportId/history`
  - `POST /api/workflows/reports/:reportId/approve-director`
  - `POST /api/workflows/reports/:reportId/reject-director`
  - `POST /api/workflows/reports/:reportId/approve-cao`
  - `POST /api/workflows/reports/:reportId/reject-cao`
  - `POST /api/workflows/reports/:reportId/resubmit`
  - `POST /api/reports/:id/publish`

## Minutes + Admin + Public APIs

- Minutes endpoints:
  - `GET /api/minutes`
  - `POST /api/minutes`
  - `GET /api/minutes/:id`
  - `PATCH /api/minutes/:id`
  - `POST /api/minutes/:id/start`
  - `POST /api/minutes/:id/finalize`
  - `POST /api/minutes/:id/publish`
  - Structured content schema tracks attendance, motions, votes, action items, and notes.
- Admin endpoints:
  - `GET /api/users`
  - `POST /api/users`
  - `POST /api/users/:id/roles`
  - `GET /api/roles`
  - `GET /api/templates`
  - `POST /api/templates`
  - `PATCH /api/templates/:id`
  - `GET /api/templates/:id/export-docx`
  - `POST /api/templates/:id/sections`
  - `PATCH /api/templates/:id/sections/:sectionId`
  - `DELETE /api/templates/:id/sections/:sectionId`
  - `POST /api/templates/:id/sections/reorder`
  - `DELETE /api/templates/:id`
  - `GET /api/meeting-types`
  - `POST /api/meeting-types`
  - `DELETE /api/meeting-types/:id`
  - `GET /api/notifications/events`
  - `GET /api/notifications/summary`
  - `GET /api/notifications/observability`
  - `POST /api/notifications/events/:id/retry`
  - `GET /api/api-settings`
  - `GET /api/api-settings/runtime-metadata`
  - `POST /api/api-settings`
  - `DELETE /api/api-settings/:id`
  - `GET /api/audit/logs`
- Public portal endpoints:
  - `GET /api/public/summary`
  - `GET /api/public/meetings`
  - `GET /api/public/agendas`
  - `GET /api/public/reports`
  - `GET /api/public/minutes`
  - `POST /api/public/subscriptions`
  - `GET /api/public/subscriptions?email=...`
  - `PATCH /api/public/subscriptions/:id`
  - `DELETE /api/public/subscriptions/:id`
  - `GET /api/public/subscriptions/:id/preview`
  - `POST /api/public/subscriptions/digest/run` (admin permission)

## Governance Policy APIs

- Governance endpoints:
  - `GET /api/governance/health`
  - `GET /api/governance/profile`
  - `GET /api/governance/profiles`
  - `PATCH /api/governance/profile`
  - `GET /api/governance/policy-pack`

## Executive Analytics APIs

- Analytics endpoints:
  - `GET /api/analytics/health`
  - `GET /api/analytics/executive-kpis`

## Live Meeting Display (Agenda + Motion + Presentation)

- Clerk operator quick guide:
  - `docs/CLERK_LIVE_DISPLAY_QUICK_REFERENCE.md`

- Unified clerk console route:
  - `/motions`
- Unified public chamber display route:
  - `/public/live-meeting/:meetingId`
- Legacy motion-only public display remains available:
  - `/public/live-motion/:meetingId`

- Meeting display API endpoints:
  - `GET /api/meeting-display?meetingId=...`
  - `GET /api/meeting-display/public/state?meetingId=...`
  - `GET /api/meeting-display/public/stream?meetingId=...` (SSE)
  - `GET /api/meeting-display/public/presentation-content?meetingId=...`
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

- Presentation upload endpoints:
  - `GET /api/presentations?meetingId=...`
  - `POST /api/presentations`
  - `DELETE /api/presentations/:id`

- Motion endpoints include delete:
  - `DELETE /api/motions/:id`

- Presentation screen behavior on `/public/live-meeting/:meetingId`:
  - slide renders without browser PDF toolbars
  - slide auto-fits visible screen (no page scrolling required)
  - renderer cancels stale draws to avoid intermittent upside-down/stale frames during rapid slide changes.

- Clerk console UX in `/motions`:
  - active mode button highlight follows live mode (`Agenda`, `Presentation`, `Live Motion`)
  - agenda/presentation/motion sections are collapsible to reduce scrolling during live operations
  - presentations can be deleted if uploaded in error.

- Clerk hotkeys in unified console:
  - `N` next slide (agenda/presentation)
  - `P` previous slide (agenda/presentation)
  - `A` switch to agenda mode
  - `M` switch to motion mode
  - `R` switch to presentation mode
  - `C` carried
  - `D` defeated
  - `W` withdrawn
  - presenter remotes: `Arrow`, `PageUp/PageDown`, `Space`, `Enter`, `Backspace`

### Word (DOCX) Import Modes

- `POST /api/reports/import-docx` supports two import paths:
  - direct upload as `contentBase64`
  - SharePoint retrieval via `sharePointDriveId` + `sharePointItemId` (Graph client credentials flow)
- DOCX parsing now uses a real OpenXML text extraction path (`mammoth`) with structured section mapping.

## Template Configuration (Current Behavior)

- Staff report templates are now preset-driven in Admin Portal (no freehand section naming required).
- Agenda templates are now preset-driven with four profile sets:
  - `REGULAR_COUNCIL`
  - `SPECIAL_COUNCIL`
  - `COMMITTEE_OF_WHOLE`
  - `IN_CAMERA`
- Agenda profile can auto-infer from template code/name keywords.
- Agenda templates are designed for internal agenda assembly and do not expose Word export in the admin UI.
- Staff report templates support Word export (`GET /api/templates/:id/export-docx`).
- Creating an agenda from an agenda template auto-seeds agenda items from ordered template sections.
- Creating/editing a staff report supports `templateId` linkage to structured section defaults.

## Frontend Application Status (Professional UI)

- Frontend is now implemented as a professional municipal operations workspace inspired by enterprise governance systems.
- Core UX architecture includes:
  - persistent app shell (sidebar + topbar)
  - SaaS-style header with global search, module context, and role-aware shortcuts
  - role-aware authenticated routing
  - reusable status badges, drawers, cards, and data tables
- Implemented user-facing workflows:
  - Meetings register with create/edit drawers
  - Recurring meeting creation (weekly, biweekly, monthly)
  - Recurrence-aware edit scope (`This meeting only` vs `This and future meetings`)
  - Meetings calendar views (month and week grids) with recurring series labels
  - Agendas register with create drawer
  - Reports register with create/edit flows and workflow history panel
  - Director and CAO approval queues with approve/reject actions and history drill-down
  - Meeting details route with linked agenda visibility
  - Public portal and in-camera portal data views
  - Minutes register lifecycle
  - Users and roles administration views
  - separate Admin Portal area with dedicated login route (`/admin/login`) and admin workspace routes (`/admin-portal/*`)
- Operational UX enhancements:
  - executive command-center dashboard with cycle health signals and priority actions
  - module-level executive layouts for Meetings, Agendas, Reports, Approvals, Minutes, and Admin
  - upgraded decision-oriented action language (advance/finalize/publish/return states)
  - structured workflow panels for create/edit drawers
  - table filtering, sorting, and pagination
  - URL-synced filters/sort/page on key pages (shareable links)
  - persistent UI preferences using local storage
  - toast notifications for success/error feedback
  - row-level loading states for report and approval actions
  - horizontal overflow hardening across core screens (responsive content width + table wrapping)
- Quick action deep links:
  - `/meetings?quick=new-meeting`
  - `/agendas?quick=new-agenda`
  - `/reports?quick=new-report`

### Admin Portal Access

- Admin access now enters through a dedicated route:
  - `/admin/login`
- Authorized users can open Admin Portal from the user-avatar dropdown in the main workspace header.
- Admin workspace routes:
  - `/admin-portal`
  - `/admin-portal/executive-kpis`
  - `/admin-portal/users`
  - `/admin-portal/roles`
  - `/admin-portal/meeting-types`
  - `/admin-portal/templates`
  - `/admin-portal/notifications`
  - `/admin-portal/api-settings`
- Admin portal pages now render with a distinct admin-themed shell variant while preserving shared UX conventions.
- Admin workspace pages now display a `Restricted Admin Workspace` badge in the page header for clear context separation.

## Persistence Mode

- Meetings, agendas, reports, and report workflow approvals now use repository-backed persistence.
- If `DATABASE_URL` is reachable, data persists to PostgreSQL app tables (`app_*`).
- If DB is unavailable, backend automatically falls back to in-memory mode so development remains unblocked.

## Local Reliability Notes

- Backend CORS is enabled for local frontend origins:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  - `http://127.0.0.1:4173`
- If meeting creation fails in browser, first verify:
  - frontend API base URL points to running backend (`VITE_API_BASE_URL=http://localhost:3000/api`)
  - dev bypass login is active when not using Microsoft auth (`VITE_AUTH_BYPASS=true`)
  - PostgreSQL connectivity with current `DATABASE_URL`

## Notification Delivery Channels

- Configure enabled channels with `NOTIFICATION_CHANNELS` (for example: `IN_APP,WEBHOOK`, `IN_APP,TEAMS`, or `IN_APP,EMAIL`).
- Channel endpoint env vars:
  - `NOTIFICATION_WEBHOOK_URL`
  - `NOTIFICATION_TEAMS_WEBHOOK_URL`
  - `NOTIFICATION_EMAIL_WEBHOOK_URL`
- Retry behavior env vars:
  - `NOTIFICATION_RETRY_MAX_ATTEMPTS`
  - `NOTIFICATION_RETRY_BASE_DELAY_MS`
- Public digest scheduler env vars:
  - `PUBLIC_DIGEST_SCHEDULER_ENABLED`
  - `PUBLIC_DIGEST_SCHEDULER_INTERVAL_MS`

## Documentation

- Detailed implementation log:
  - `docs/IMPLEMENTATION_LOG.md`
- Environment checklist:
  - `docs/ENVIRONMENT_CHECKLIST.md`
- Frontend smoke tests:
  - `docs/FRONTEND_SMOKE_TESTS.md`
- UAT runbook:
  - `docs/UAT_RUNBOOK.md`
- Security and operations hardening:
  - `docs/SECURITY_OPERATIONS_HARDENING.md`
- Go-live checklist:
  - `docs/GO_LIVE_CHECKLIST.md`
- Template standards and preset section catalogs:
  - `docs/TEMPLATE_STANDARDS.md`
- Release notes:
  - `docs/RELEASE_NOTES_2026-03-18.md`

### Documentation Update Requirement (Live Display)

If live display screens/routes/controls change (`/motions`, `/public/live-meeting/:meetingId`, `/public/live-motion/:meetingId`), update these docs in the same change:

- `docs/IMPLEMENTATION_LOG.md`
- `docs/FRONTEND_SMOKE_TESTS.md`
- `docs/UAT_RUNBOOK.md`
- `docs/GO_LIVE_CHECKLIST.md`
- latest release notes in `docs/`
