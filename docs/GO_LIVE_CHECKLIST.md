# Go-Live Checklist

## Platform Readiness

- [ ] Backend and frontend build cleanly.
- [ ] Database migrations applied (including `app_*` tables).
- [ ] Data integrity migration `1700000009000-app-integrity-constraints.sql` applied successfully.
- [ ] Agenda item publish migration `1700000018000-agenda-item-publish-status.sql` applied successfully.
- [ ] Auth bypass disabled in target environment.
- [ ] `AUTH_BYPASS_ALLOWED_ENVS` excludes production values.
- [ ] Microsoft identity values configured and validated.
- [ ] Rate limit values (`RATE_LIMIT_*`) reviewed and tuned for target load.

## Workflow Readiness

- [ ] Meeting -> agenda -> report flow validated.
- [ ] Director/CAO approvals validated.
- [ ] Report publish flow validated.
- [ ] Minutes create/start/finalize/publish validated.
- [ ] Minutes structured editor validated (attendance, motions, votes, action items, clerk notes sections).
- [ ] Minutes auto-populate action validated (`POST /api/minutes/:id/auto-populate`).
- [ ] Agenda item publish/unpublish validated (individual item `publishStatus` transitions).
- [ ] Conflict of interest declaration workflow validated (create/update/delete in Meeting Details).
- [ ] Unified live display console validated (`/motions`) for agenda slides, motions, and presentations (PDF/PPT/PPTX).
- [ ] Live mode button highlight in `/motions` verified against actual on-screen mode.
- [ ] Collapsible operator sections in `/motions` verified for reduced scrolling.

## Governance and Access

- [ ] Role matrix reviewed in `/admin/roles`.
- [ ] Managed users and initial role assignments loaded in `/admin/users`.
- [ ] In-camera access tested against restricted users.
- [ ] Audit log access validated at `/admin-portal/audit-logs` (search/filter).
- [ ] Conflict declarations require `conflict.declare` permission (COUNCIL_MEMBER role assigned).

## Reporting

- [ ] Report Generators validated:
  - `/reports/attendance` — attendance by date range
  - `/reports/motions` — motion activity and outcomes
  - `/reports/voting` — voting record breakdown
  - `/reports/conflicts` — conflict of interest declarations
  - `/reports/forecast` — upcoming meeting forecast
- [ ] Report Generators accessible via Reports nav section (prefix `/reports`).

## Public Transparency

- [ ] Public summary loads with published meetings/agendas/reports/minutes.
- [ ] In-camera items do not appear in public results.
- [ ] Public live meeting display loads without login (`/public/live-meeting/:meetingId`).
- [ ] Public live meeting display receives updates via SSE stream (`/api/meeting-display/public/stream`).
- [ ] SSE fallback behavior validated (client reverts to polling when stream unavailable and recovers when stream returns).
- [ ] Motion result hold behavior verified (shows carried/defeated/withdrawn for 10 seconds).
- [ ] Presentation mode verified on public display, including next/previous/go-to slide actions.
- [ ] Presentation mode verified without browser PDF toolbars and without page scroll for full-slide viewing.
- [ ] Rapid next/previous slide operations verified with stable orientation (no intermittent upside-down frames).
- [ ] Presentation delete workflow validated for accidental uploads.

## Operations

- [ ] Backup and restore procedure validated.
- [ ] Audit log query and retention policy validated.
- [ ] State-changing API requests reject missing `X-CMMS-CSRF` with HTTP `403`.
- [ ] Concurrent report approval test returns conflict for stale write attempts (optimistic locking).
- [ ] Concurrent agenda workflow transition test returns conflict for stale write attempts (optimistic locking).
- [ ] Incident response contacts/runbooks confirmed.
- [ ] LibreOffice installed on backend host if PPT/PPTX auto-conversion is required.
