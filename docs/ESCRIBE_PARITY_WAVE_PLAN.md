# eScribe Parity Delivery Plan (Waves 1–4)

This document is the execution reference for the eScribe parity program.

## Wave 1 — Foundation and Performance

- [x] 1. Extract `BaseRepository` with shared DB fallback logic
- [x] 2. Decompose `ReportsService` into focused services
- [x] 3. Add pagination to list endpoints (admin + public)
- [x] 4. Remove analytics N+1 query pattern
- [x] 5. Add `useDataLoader` hook and refactor representative pages
- [x] 6. Finalize frontend dependencies (TipTap, dnd-kit, PDF stack)
- [x] 7. Add Postgres FTS migration + backend search service

## Wave 2 — Authoring and Discovery UX

- [x] 8. TipTap agenda item editor integration
- [x] 9. TipTap staff report editor integration
- [x] 10. TipTap minutes editor integration
- [x] 11. Drag-and-drop agenda builder
- [x] 12. Meeting packet PDF generation
- [x] 13. Frontend search integration

## Wave 3 — Workflow Throughput and Governance

- [x] 14. Bulk workflow actions
- [x] 15. Scheduled publishing
- [x] 16. Auto-save + offline draft recovery
- [x] 17. Role delegation (substitute approvers)
- [x] 18. Document version history + diff views
- [x] 19. Meeting-type workflow configuration UI

## Wave 4 — Compliance, Responsiveness, and Documentation

- [x] 20. WCAG 2.1 AA audit and remediation
- [x] 21. Mobile/tablet responsive hardening
- [x] 22. Comprehensive documentation updates

## Final Verification Gate

- [x] F1. Plan compliance audit
- [x] F2. Build/test/code-quality review
- [x] F3. Full QA scenario execution
- [x] F4. Scope fidelity review
