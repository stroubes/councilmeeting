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
9. If active agenda templates exist, verify `/agendas` create drawer auto-selects a template and prevents creating an agenda without one.
10. Delete one agenda item and verify list reorders correctly.
11. Create report in `/reports` for agenda item and submit.
12. Approve in `/approvals/director`, then `/approvals/cao`.
13. Publish report in `/reports`.
14. Delete one report and verify it is removed from register.
15. Open create modal in `/minutes`, verify meeting selector appears in full modal workspace, create minutes, finalize, then publish.
16. Verify meeting dropdown labels in `/minutes`, `/agendas`, and `/motions` include title, date/time, and short meeting id so recurring meetings are distinguishable.
17. Open `/public` and confirm published records are visible.
18. In `/public`, verify meetings section supports `Calendar View` and `List View`, and month navigation (`Previous Month`, `Today`, `Next Month`) updates calendar data correctly.
19. Open `/public` agenda register and confirm `Open Agenda` navigates to `/public/agendas/:agendaId`.
20. In `/motions`, select a meeting and push an agenda slide live; confirm it appears on `/public/live-meeting/:meetingId` with SSE push (no manual refresh).
21. From the same `/motions` page, switch to motion mode, set a motion live, and confirm it appears on `/public/live-meeting/:meetingId` with SSE push.
22. Mark live motion as carried and confirm public screen holds completed motion result for ~10 seconds before clearing.
23. Switch back to agenda mode and confirm agenda slide display resumes without opening a second clerk screen.
24. Upload a PDF/PPT/PPTX presentation in `/motions`, set it live, and verify `/public/live-meeting/:meetingId` shows slide content.
25. Use next/previous slide actions and verify slide number + screen content update.
26. Delete a presentation from `/motions` and verify it is removed from the presentation table.
27. In `/motions`, use `Create Resolution` on a motion and verify new resolution appears in `/resolutions`.
28. In `/resolutions`, mark an action-required resolution as `ADOPTED` and verify follow-up appears in `/actions`.
29. In `/reports`, ensure create/edit/import drawers show workflow selector and current stage visibility in register.
30. In `/approvals/my`, approve/reject a routed item and verify it leaves your queue.
31. In `/public`, verify motions/resolutions/actions tables render and package row `View Details` expands artifact names.

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
4. Simulate backend DB outage and verify workspace header shows a data-persistence warning banner sourced from `/api/health`; restore DB and verify banner clears automatically.
5. Verify no horizontal browser scrolling on:
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
6. Verify table-heavy screens wrap long content without pushing page width.
7. Verify sidebar + header layout remains stable on desktop and mobile (including menu toggle behavior).
8. Verify admin pages show `Restricted Admin Workspace` badge in page header.
9. Verify live display console hotkeys while not typing in fields:
   - `N` advances to next agenda or presentation slide
   - `P` goes to previous agenda or presentation slide
   - `A` switches screen to agenda mode
   - `M` switches screen to motion mode
   - `R` switches screen to presentation mode
   - `C` marks live motion carried
   - `D` marks live motion defeated
   - `W` marks live motion withdrawn.
10. Verify current agenda slide row is fully highlighted in `/motions` for quick operator visibility.
11. Verify presenter remote keys (`Arrow`, `PageUp/PageDown`, `Space`, `Enter`, `Backspace`) control slides when not typing.
12. Verify active mode button highlight in `/motions` tracks current live mode (`Show Agenda`, `Show Presentation`, `Show Live Motion`).
13. Verify `/motions` sections can be expanded/collapsed (Agenda Slides, Presentation Decks, Motion Controls) to reduce scrolling.
14. Verify public presentation mode renders without browser PDF toolbars and does not require page scrolling to view full slide.
15. Rapidly move next/previous slides and confirm presentation remains correctly oriented (no intermittent upside-down frames).
16. Verify calendar toolbar controls in `/meetings` are aligned and the active month/week range is clearly visible.
17. Verify `/public/live-meeting/:meetingId` receives updates continuously via SSE; disconnect backend briefly and confirm fallback polling message appears, then clear once stream reconnects.
18. Verify lazy route loading fallback appears briefly on first navigation to major modules (e.g., `/reports`, `/agendas`, `/public`) and route resolves without blank screen.
