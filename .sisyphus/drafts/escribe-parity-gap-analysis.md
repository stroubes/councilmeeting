# Draft: eScribe Parity — Complete Gap Analysis

## User's Stated Requirements (verbatim)
- "Complete end-to-end solution for all types of council meetings including In-Camera Meetings, Regular Councils, Special Councils, Committee of the Whole and other Committee meetings"
- "Staff reports need to be easy to make"
- "Minutes need to be easy"
- "Agenda creation needs to be easy"
- "Resolutions need to be easy to maintain"
- "As close to eScribe as I can"

## Meeting Types Required
1. Regular Council Meeting
2. Special Council Meeting
3. Committee of the Whole
4. In-Camera (closed session)
5. Other Committee meetings (Parks, Finance, etc.)

## Technical Decisions
- NestJS backend with PostgreSQL (raw pg driver, not Prisma/TypeORM)
- React + Vite frontend
- In-memory fallback for dev without DB
- Microsoft SSO for auth
- Phase 1 security hardening DONE (bypass token removed, rate limiting, CSRF)
- Phase 2 data integrity DONE (transactions, optimistic locking, FK cascades for reports/agendas/minutes)

## Research Findings

### eScribe Differentiators (what wins evaluations)
1. WCAG 2.1 AA certified (third-party verified by Berman Group)
2. Modular pricing (Meeting Manager foundation, add modules)
3. Deep Microsoft integration (Word, SharePoint, Active Directory)
4. Scheduled publishing (time-based agenda release)
5. Staff report collaboration with Word integration
6. Real-time voting and roll calls
7. Action item tracking from minutes
8. Live webcasting integration
9. Public portal with search + subscriptions

### iCompass Differentiators
1. Two-tier product (Meeting Manager vs Meeting Manager Pro)
2. Video Manager HD with YouTube + agenda timestamping
3. Claim 80% time savings on meeting prep with Pro tier
4. 24/7/365 support
5. Automatic minutes from live meeting data capture

### BC Municipal Requirements
- FOIPPA compliance (data privacy, access controls, audit trails)
- WCAG 2.1 AA (legal requirement for public-facing)
- Community Charter compliance (meeting notice, quorum, in-camera rules)
- Data sovereignty (Canadian hosting preferred)

## Code Quality Findings (from explore agent)

### Critical Issues Found
1. **19 repositories with identical withFallback boilerplate** — 116 matches across codebase, no base class extracted
2. **ReportsService is 862 lines** — god object anti-pattern, handles creation, import, listing, workflow, auditing, notifications
3. **10 of 28+ services have tests** — ~36% service coverage, zero controller tests
4. **Unbounded queries** — meetings.repository.ts list() has no LIMIT, returns all rows
5. **N+1 pattern in analytics** — one query per published report in analytics.service.ts
6. **No full-text search** — Postgres full-text search not implemented anywhere
7. **No pagination on public portal endpoints** — returns full datasets
8. **In-memory fallback divergence risk** — no bounds checking, full table scans on every request
9. **Frontend duplicated loading/error patterns** — every page re-implements useState + useEffect fetching
10. **Type drift risk** — frontend types manually maintained, no code generation from backend

## What's Working Well (preserve these)
- Meeting CRUD with recurring meeting support
- Agenda items with in-camera/redaction/publishAt fields
- Multi-stage report workflow (draft → submit → director → CAO → publish)
- Template system with preset sections
- Public portal with calendar + subscriptions
- Live meeting display with SSE + presentation support
- Motion management with live voting display
- Resolution tracking with action item generation
- Notification delivery (in-app, webhook, Teams, email)
- Audit logging on workflow transitions
- Executive KPI analytics dashboard

## Open Questions
- What is the priority order: UX polish vs missing features vs performance?
- Is there a budget for third-party integrations (video streaming, PDF generation)?
- Should we target WCAG 2.1 AA immediately or phase it?
- Do we need a mobile app or just responsive web?

## Scope Boundaries
- INCLUDE: All 5 meeting types, complete lifecycle, public portal, eScribe-parity UX
- EXCLUDE: (to be confirmed with user) Video streaming hosting, mobile native app, AI-powered transcription
