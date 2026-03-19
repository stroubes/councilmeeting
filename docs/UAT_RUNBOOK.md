# UAT Runbook

Use this script for municipal workflow acceptance testing.

## Executive Demo Narrative (Recommended)

Use this sequence at the start of UAT to frame the system as an executive SaaS product:

1. Open `/dashboard` and walk through briefing cards (approval pressure, publication coverage, public releases).
2. Show cycle health signals and priority action cards for Director/CAO/Public/Admin operations.
3. Navigate to `/meetings`, `/agendas`, and `/reports` and confirm each module uses the same executive register pattern (metrics + toolbar + register).
4. Open `/motions` and demonstrate unified live display controls (agenda-first + motion switch) for council monitors.
5. Open create/edit workflows and confirm drawer panel hierarchy (workflow header, grouped form fields, clear action footer).
6. Confirm sidebar persistence and top header context remain consistent across all modules.

## Layout and Responsiveness Validation

Run this check on desktop and tablet widths:

1. Visit `/dashboard`, `/meetings`, `/agendas`, `/reports`, `/approvals/director`, `/approvals/cao`, `/minutes`, `/admin/login`, `/admin-portal`, `/admin-portal/users`, and `/admin-portal/roles`.
2. Confirm no page introduces horizontal browser scrolling at any point.
3. Confirm table cells wrap content rather than forcing full-page overflow.
4. Confirm header shortcuts wrap cleanly and do not produce horizontal overflow.
5. Confirm mobile menu toggle opens sidebar and content remains readable without sideways scrolling.
6. Confirm admin pages show the `Restricted Admin Workspace` badge in the header.
7. Confirm public live meeting screen (`/public/live-meeting/:meetingId`) remains readable on TV/large screen layouts.

## Scenario A - Staff Report From Word to Public Portal

1. Staff creates meeting.
2. Staff creates agenda and adds `STAFF_REPORT` item.
3. Staff imports Word file in `/reports` (upload or SharePoint ids).
4. Staff edits summary/recommendations if needed.
5. Staff submits report.
6. Director approves.
7. CAO approves.
8. Publisher publishes report.
9. Confirm report appears in `/public` and excludes in-camera items.

## Scenario B - Minutes Lifecycle

1. Minutes clerk creates minutes record linked to meeting.
2. Clerk starts minutes and updates notes.
3. Clerk finalizes minutes.
4. CAO/admin publishes minutes.
5. Confirm minutes appear in `/public`.

## Scenario C - Access Control

1. User without admin permissions cannot access `/admin-portal` after visiting `/admin/login`.
2. User with admin permissions can access `/admin-portal` via avatar dropdown or direct `/admin/login`.
3. User without `users.manage` cannot open `/admin-portal/users`.
4. User without `roles.manage` cannot open `/admin-portal/roles`.
5. User without `minutes.publish` cannot publish minutes.
6. User without `public.publish` cannot publish reports.

## Scenario D - Unified Live Meeting Display for Council Monitors and Public TVs

1. Open `/motions` and select the target council meeting.
2. Create two motions with complete wording.
3. Open `/public/live-meeting/:meetingId` on a second screen (no login required).
4. Push an agenda slide live and confirm public screen updates through SSE push (no manual refresh required).
5. In `/motions`, switch display mode to motion and set first motion live; confirm screen updates through SSE in the same TV URL.
6. Edit first motion text in `/motions` and save; confirm public screen text updates on next poll cycle.
7. Mark first motion as `CARRIED`; confirm public screen shows result for 10 seconds before clearing.
8. Switch back to agenda mode and confirm agenda slide display resumes without changing clerk screen.
9. Upload a PDF, PPT, or PPTX presentation in `/motions`; if PPT/PPTX, verify conversion completes and page count is shown.
10. Set uploaded presentation live and verify `/public/live-meeting/:meetingId` renders slide 1.
11. Advance and reverse slides from `/motions` and confirm public screen updates.
12. Validate presenter remote keys (`Arrow`, `PageUp/PageDown`, `Space`, `Enter`, `Backspace`) trigger next/previous slide when not typing.
13. Validate hotkeys (`N`, `P`, `A`, `M`, `R`, `C`, `D`, `W`) only trigger when focus is not in an input/textarea.
14. Validate active mode button highlight in `/motions` reflects actual live mode on TV/public screen.
15. Collapse and expand Agenda Slides, Presentation Decks, and Motion Controls sections in `/motions` and confirm reduced operator scrolling.
16. In presentation mode, confirm full slide is visible without browser toolbars and without page scrolling.
17. Rapidly navigate next/previous slides and confirm orientation remains stable (no intermittent upside-down frame).
18. Delete an uploaded presentation and confirm it no longer appears in selection table.
19. Simulate temporary stream interruption (backend restart or network interruption) and confirm public screen shows fallback polling behavior, then resumes SSE updates when connection recovers.
