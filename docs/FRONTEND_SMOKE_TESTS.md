# Frontend Smoke Tests

Run this smoke suite after each backend/frontend build.

## Core Workflow Smoke

1. Login as staff/admin and land on `/dashboard`.
2. Open `/admin-portal/meeting-types`, create a new meeting type, and verify it appears in the admin table.
3. Create a recurring meeting in `/meetings` (weekly or biweekly, 2+ occurrences) and verify all occurrences appear.
4. Verify meeting create/edit uses meeting type dropdown values from admin-managed meeting types.
5. Switch `/meetings` to `Calendar View` and verify month + week layouts render and show created meetings.
6. Edit one recurring meeting using `This and future meetings` and verify future occurrences update.
7. Delete one meeting in `/meetings` and verify row/calendar entry is removed.
8. Create agenda in `/agendas` for that meeting and add at least one agenda item.
9. Delete one agenda item and verify list reorders correctly.
10. Create report in `/reports` for agenda item and submit.
11. Approve in `/approvals/director`, then `/approvals/cao`.
12. Publish report in `/reports`.
13. Delete one report and verify it is removed from register.
14. Create minutes in `/minutes`, finalize, then publish.
15. Open `/public` and confirm published records are visible.
16. Open `/public` agenda register and confirm `Open Agenda` navigates to `/public/agendas/:agendaId`.
17. In `/motions`, select a meeting and push an agenda slide live; confirm it appears on `/public/live-meeting/:meetingId` with SSE push (no manual refresh).
18. From the same `/motions` page, switch to motion mode, set a motion live, and confirm it appears on `/public/live-meeting/:meetingId` with SSE push.
19. Mark live motion as carried and confirm public screen holds completed motion result for ~10 seconds before clearing.
20. Switch back to agenda mode and confirm agenda slide display resumes without opening a second clerk screen.
21. Upload a PDF/PPT/PPTX presentation in `/motions`, set it live, and verify `/public/live-meeting/:meetingId` shows slide content.
22. Use next/previous slide actions and verify slide number + screen content update.
23. Delete a presentation from `/motions` and verify it is removed from the presentation table.

## Admin Smoke

1. Open `/admin/login` and verify admin entry screen loads.
2. Sign in as admin-capable user and verify redirect to `/admin-portal`.
3. Open `/admin-portal/roles` and verify role-permission matrix loads.
4. Open `/admin-portal/users`, create or upsert managed user.
5. Assign an additional role and verify row updates.
6. Open `/admin-portal/templates`, create then delete a template, and verify removal.
7. Open `/admin-portal/meeting-types`, delete a non-used meeting type, and verify removal.

## Regression Smoke

1. Verify `in-camera` page only loads when `meeting.read.in_camera` is present.
2. Verify public page does not show in-camera agenda items/reports.
3. Verify toasts and error states appear on failed network actions.
4. Verify no horizontal browser scrolling on:
   - `/dashboard`
   - `/meetings`
   - `/agendas`
   - `/reports`
   - `/approvals/director`
   - `/approvals/cao`
   - `/minutes`
   - `/admin/login`
   - `/admin-portal`
   - `/admin-portal/users`
   - `/admin-portal/roles`
5. Verify table-heavy screens wrap long content without pushing page width.
6. Verify sidebar + header layout remains stable on desktop and mobile (including menu toggle behavior).
7. Verify admin pages show `Restricted Admin Workspace` badge in page header.
8. Verify live display console hotkeys while not typing in fields:
   - `N` advances to next agenda or presentation slide
   - `P` goes to previous agenda or presentation slide
   - `A` switches screen to agenda mode
   - `M` switches screen to motion mode
   - `R` switches screen to presentation mode
   - `C` marks live motion carried
   - `D` marks live motion defeated
   - `W` marks live motion withdrawn.
9. Verify current agenda slide row is fully highlighted in `/motions` for quick operator visibility.
10. Verify presenter remote keys (`Arrow`, `PageUp/PageDown`, `Space`, `Enter`, `Backspace`) control slides when not typing.
11. Verify active mode button highlight in `/motions` tracks current live mode (`Show Agenda`, `Show Presentation`, `Show Live Motion`).
12. Verify `/motions` sections can be expanded/collapsed (Agenda Slides, Presentation Decks, Motion Controls) to reduce scrolling.
13. Verify public presentation mode renders without browser PDF toolbars and does not require page scrolling to view full slide.
14. Rapidly move next/previous slides and confirm presentation remains correctly oriented (no intermittent upside-down frames).
15. Verify calendar toolbar controls in `/meetings` are aligned and the active month/week range is clearly visible.
16. Verify `/public/live-meeting/:meetingId` receives updates continuously via SSE; disconnect backend briefly and confirm fallback polling message appears, then clear once stream reconnects.
