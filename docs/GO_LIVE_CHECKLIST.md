# Go-Live Checklist

## Platform Readiness

- [ ] Backend and frontend build cleanly.
- [ ] Database migrations applied (including `app_*` tables).
- [ ] Auth bypass disabled in target environment.
- [ ] Microsoft identity values configured and validated.

## Workflow Readiness

- [ ] Meeting -> agenda -> report flow validated.
- [ ] Director/CAO approvals validated.
- [ ] Report publish flow validated.
- [ ] Minutes create/start/finalize/publish validated.
- [ ] Unified live display console validated (`/motions`) for agenda slides, motions, and presentations (PDF/PPT/PPTX).
- [ ] Live mode button highlight in `/motions` verified against actual on-screen mode.
- [ ] Collapsible operator sections in `/motions` verified for reduced scrolling.

## Governance and Access

- [ ] Role matrix reviewed in `/admin/roles`.
- [ ] Managed users and initial role assignments loaded in `/admin/users`.
- [ ] In-camera access tested against restricted users.

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
- [ ] Incident response contacts/runbooks confirmed.
- [ ] LibreOffice installed on backend host if PPT/PPTX auto-conversion is required.
