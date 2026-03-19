# Release Notes - 2026-03-18

## Overview

This release delivers a unified live meeting display experience so clerks can run agenda slides, motions, and presentations from one console, with a single public screen URL for TVs and council monitors.

## What Changed

- Unified clerk workflow in `/motions`:
  - agenda slide control (jump + next/previous)
  - motion control (create/edit/set live/set outcome)
  - presentation control (upload/select/show/next/previous/jump)
  - quick mode toggle between agenda and motion display.
- Added unified public display route:
  - `/public/live-meeting/:meetingId`
  - supports both agenda and motion display states.
- Added agenda-first behavior:
  - agenda is primary display mode
  - clerk can instantly switch to motion mode and back.
- Added presentation mode:
  - upload PDF directly
  - upload PPT/PPTX with backend auto-conversion to PDF
  - run slides from same clerk console and public URL.
- Added operator usability improvements:
  - keyboard shortcuts (`N`, `P`, `A`, `M`, `R`, `C`, `D`, `W`)
  - presenter remote key support (`Arrow`, `PageUp/PageDown`, `Space`, `Enter`, `Backspace`)
  - full-row active slide highlight in clerk table
  - “Currently On Screen” quick-view panel.
- Added post-release live operations refinements:
  - active mode button highlight now matches live screen mode in `/motions`
  - collapsible console sections to reduce scrolling during clerk operations
  - delete presentation action for accidental uploads.
- Stabilized presentation rendering behavior in public live screen:
  - removed browser PDF toolbar UI from presentation output
  - full-slide fit within visible screen area (no page scrolling)
  - render task cancellation/guarding to prevent intermittent stale or upside-down frames during rapid slide changes.
- Added live display transport upgrade for public unified screen:
  - `/public/live-meeting/:meetingId` now receives meeting display updates via SSE (`/api/meeting-display/public/stream`)
  - automatic fallback to 2-second polling when stream connectivity is unavailable.
- Added server-side register querying for Meetings list mode:
  - frontend list view now calls `GET /api/meetings/paged`
  - server now applies search/filter/sort/pagination for list datasets.
- Added governance policy pack baseline APIs:
  - `GET /api/governance/profile`
  - `GET /api/governance/policy-pack`
  - active profile now sourced from `MUNICIPAL_PROFILE_ID` (default `BC_BASELINE`).
- Added structured minutes contract baseline:
  - minutes payload now models attendance, motions, votes, and action items as first-class objects
  - finalize now enforces core readiness checks to reduce publication-quality gaps.
- Added notifications event pipeline baseline:
  - workflow transitions now emit persisted notification events
  - admin portal notifications page now displays event history and supports retry for failed events.
- Integrated active municipal policy profile into readiness feedback payloads and agenda compliance checks.
- Implemented API Settings admin and backend baseline:
  - secure masked settings register
  - runtime integration metadata endpoint (presence-only, no secret disclosure)
  - admin CRUD controls for API setting records.
- Added citizen transparency watchlist baseline in Public Portal:
  - residents can subscribe to topics and keyword watchlists
  - subscriptions can be previewed, paused/resumed, and removed
  - server now exposes public subscription APIs for future notification delivery expansion.
- Upgraded notification delivery to channel adapters with retry policy:
  - supports `IN_APP`, `WEBHOOK`, `TEAMS`, and `EMAIL` channel modes
  - includes configurable retry attempts and exponential backoff delays
  - manual retry now resets attempts and re-dispatches events.
- Added admin profile-switch controls for municipal policy packs:
  - governance API now supports listing available profiles and setting active profile at runtime
  - admin API Settings screen now includes active policy profile selector
  - readiness validation responses now reflect the currently selected profile id.
- Added citizen digest scheduling baseline:
  - automatic daily/weekly digest sweep for public watchlist subscriptions
  - admin manual digest run action available in Notifications screen
  - digest deliveries emit notification events and update subscription `lastNotifiedAt`.
- Added channel-specific digest payload templates:
  - email digest subject/body formatting
  - Teams message-card digest formatting
  - standardized webhook digest JSON payload shape.
- Added notification observability surface:
  - backend metrics endpoint for channel/status/digest/backlog visibility
  - admin dashboard observability card for live operational monitoring.
- Added Executive KPI dashboard baseline:
  - backend KPI endpoint with cycle-time, approvals pressure, publication coverage, digest rollups, and trend slices
  - admin executive KPI dashboard page for leadership-level operational reporting.
- Added District of Sooke branding to live screens:
  - official logo integration
  - branded color palette and layout treatment
  - transparent logo presentation (no white tile).

## Post-Release Updates (Same Release Date)

- Added managed meeting types:
  - new admin page: `/admin-portal/meeting-types`
  - meeting create/edit now use a meeting-type dropdown sourced from backend
  - backend endpoints: `GET /api/meeting-types`, `POST /api/meeting-types`, `DELETE /api/meeting-types/:id`.
- Added delete coverage across core records so created records can be removed from UI and API:
  - meetings, agendas, agenda items, reports, motions, templates, meeting types
  - retained existing delete paths for report attachments, template sections, and presentations.
- Added recurring meeting creation in `/meetings`:
  - recurrence options: none, weekly, biweekly, monthly
  - multi-occurrence generation from a single create action.
- Added recurring series metadata and editing behavior:
  - meetings now persist optional `recurrenceGroupId` + `recurrenceIndex`
  - edit flow supports `This meeting only` or `This and future meetings`.
- Added Meetings calendar experience:
  - list and calendar toggle in `/meetings`
  - month grid and week grid layouts with previous/next and today navigation
  - recurring series badges/labels in list and calendar cells.
- Refined calendar UI polish based on operator feedback:
  - stronger month/week range header
  - aligned control groups
  - clearer day-cell hierarchy for readability.

## Impacted Routes

- Clerk console: `/motions`
- Public unified screen: `/public/live-meeting/:meetingId`
- Legacy public motion screen (still available): `/public/live-motion/:meetingId`
- Meetings register + calendar: `/meetings`
- Admin meeting types: `/admin-portal/meeting-types`

## Operational Notes

- Public unified live meeting screen uses SSE push transport for display-state updates.
- If SSE is blocked by intermediary infrastructure, client automatically falls back to 2-second polling.
- PPT/PPTX conversion requires LibreOffice (`soffice` or `libreoffice`) available on backend host.
- If logo appearance seems stale on a display device, perform a hard refresh to clear cached assets.

## Documentation Maintenance Rule

When any live display screen behavior, controls, hotkeys, labels, or public routes change, update all of the following in the same change set:

- `docs/IMPLEMENTATION_LOG.md`
- `docs/FRONTEND_SMOKE_TESTS.md`
- `docs/UAT_RUNBOOK.md`
- `docs/GO_LIVE_CHECKLIST.md`
- this release notes file (or add a new dated release notes file)
