# Release Notes - 2026-04-04

## Overview

Release 2 delivers critical production hardening, real-time display stabilization, and new governance reporting capabilities. Key themes: P0 reliability fixes, publishing pipeline for agenda items, and a new Report Generators module for executive analytics.

## What Changed

### Security Hardening (2026-03-23)

- **Rate limiting**: Added global in-memory API rate limiting middleware with separate buckets for auth, public, and general API traffic
- **CSRF protection**: Added CSRF header middleware — unsafe methods require `X-CMMS-CSRF`
- **Dev bypass hardening**: Backend auth guard now requires all three conditions: `AUTH_BYPASS_ENABLED=true`, `X-Dev-Bypass: true` header, and `NODE_ENV` in allowed environments
- **Frontend HTTP client**: Sends `X-CMMS-CSRF` for POST/PATCH/DELETE; avoids cookie credentials; attaches `X-Dev-Bypass` only for explicit local bypass sessions

### Data Integrity Pass (2026-03-23)

- **Transactional support**: Added `withTransaction(...)` in PostgresService for atomic operations
- **Optimistic concurrency control**: Added `expectedUpdatedAt` guard checks for report and agenda workflow transitions
- **Foreign key constraints**: Added CASCADE deletes for core tables (agendas→meetings, items→agendas, reports→items, approvals→reports, attachments→reports, minutes→meetings)
- **Migration**: Added `1700000009000-app-integrity-constraints.sql`

### Clerk + Governance Workflow Upgrade (2026-03-31)

- **Minutes auto-populate**: Clerk register now calls `POST /api/minutes/:id/auto-populate` to sync attendance, motions, and vote outcomes into minutes content
- **Minutes structured editor**: Replaced rich-text-only editing with full structured editor (attendance, motions, votes, action items, clerk notes)
- **Conflict of interest declarations**: New UI in Meeting Details for creating/updating/removing COI declarations
- **Audit log admin**: New `/admin-portal/audit-logs` route with searchable/filterable log register

### Real-Time Display Stabilization

- **Production database fail-fast**: In production (`NODE_ENV=production`) with no `DATABASE_URL`, app now throws at startup instead of warning
- **Async notification delivery**: Refactored from synchronous retry loop to queue-based async processing with 2-second interval processor
- **SSE deduplication fix**: Replaced `JSON.stringify(state)` with computed signature on meaningful fields to fix presentation mode switching
- **Public screen initialization fix**: Public live meeting screen now loads state immediately and starts polling as safety net until SSE connects
- **SSE event listener fix**: Changed `stream.onmessage` to `stream.addEventListener('meeting-display-state', handler)` for named SSE events

### Meeting Type Badge Styling (2026-04-02)

- Added `MeetingTypeBadge` component with neutral slate/blue-gray pill styling
- Updated MeetingsList, MeetingDetails, PublicPortal, InCameraPortal, and Dashboard to use branded badge

### Epic 6: Publishing Pipeline

- **Agenda item publish status**: Added `publish_status` column (`DRAFT`, `PUBLISHED`, `ARCHIVED`) to agenda items
- New endpoints: `PATCH /agendas/:id/publish` and `PATCH /agendas/:id/unpublish`
- Staff can now publish/unpublish individual agenda items separately from meeting-level status
- **Migration**: `1700000018000-agenda-item-publish-status.sql`

### Epic 9: Report Generators

New backend module (`/api/report-generators/`) with 5 report endpoints:

- `GET /api/report-generators/attendance` — meeting attendance by date range
- `GET /api/report-generators/motions` — motion activity and outcomes
- `GET /api/report-generators/voting` — voting record breakdown
- `GET /api/report-generators/conflicts` — conflict of interest declarations
- `GET /api/report-generators/forecast` — upcoming meeting forecast

New frontend routes under `/reports/`:
- `/reports/attendance`
- `/reports/motions`
- `/reports/voting`
- `/reports/conflicts`
- `/reports/forecast`

### Bug Fixes

- **ConflictDeclarationsController**: Fixed permission from `MEETING_WRITE` to `CONFLICT_DECLARE`
- **Participant views**: Removed unsupported `breadcrumbs` prop from `AppShell`
- **Module DI fixes**: Fixed `ConflictDeclarationsModule` exports and `VotesModule` imports for proper DI
- **Report generator imports**: Fixed `MotionRecord` and `VoteRecord` imports from `.repository` files
- **Playwright E2E in CI**: Added e2e job to CI workflow with browser installation

## Impacted Routes

- Clerk console: `/motions`
- Public unified screen: `/public/live-meeting/:meetingId`
- Minutes register: `/minutes`
- Meeting details: `/meetings/:id` (COI panel added)
- Admin audit logs: `/admin-portal/audit-logs`
- Report generators: `/reports/attendance`, `/reports/motions`, `/reports/voting`, `/reports/conflicts`, `/reports/forecast`
- Agenda item publish: individual item publish/unpublish in agendas

## Operational Notes

- Public live meeting screen SSE events now use named event type `meeting-display-state`
- Report Generators are accessible via the existing Reports nav section
- Agenda item publish requires `AGENDA_PUBLISH` permission
- Conflict declarations require `conflict.declare` permission (assigned to COUNCIL_MEMBER role)
- Database migrations required: `1700000009000` and `1700000018000`

## Documentation Maintenance Rule

When any live display screen behavior, controls, hotkeys, labels, or public routes change, update all of the following in the same change set:

- `docs/IMPLEMENTATION_LOG.md`
- `docs/FRONTEND_SMOKE_TESTS.md`
- `docs/UAT_RUNBOOK.md`
- `docs/GO_LIVE_CHECKLIST.md`
- this release notes file (or add a new dated release notes file)