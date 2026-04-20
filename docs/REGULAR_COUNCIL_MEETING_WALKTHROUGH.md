# Regular Council Meeting Walkthrough

This walkthrough matches the automated scenario in `frontend/tests/e2e/regular-council-meeting.spec.ts`.

It creates a full public `Regular Council Meeting - April 10, 2026` package and takes it through:

- meeting publication
- agenda drafting
- director approval
- CAO approval
- agenda publication
- five staff reports with attachments
- report approvals and publication
- live motions and votes
- adopted resolutions
- finalized, adopted, and published minutes

## Scenario Purpose

Use this scenario when you need one complete training example for:

- staff preparing a regular council package
- leadership approving the package
- council running the meeting and recording decisions
- public portal verification after publication

## Test Data Used

### Meeting

- Title: `Regular Council Meeting - April 10, 2026`
- Type: `COUNCIL`
- Location: `Council Chamber`
- Start time: `2026-04-10T18:00:00.000Z`

### Prior Minutes Used for Adoption

- Meeting: `Regular Council Meeting - March 27, 2026`
- Status at start of scenario: published minutes package
- Purpose: gives the April 10 agenda a realistic `Adoption of Previous Minutes` item

### Staff Report Attachments

The scenario uses all five files in `assets/attachments/`:

- `Regular Council - 23 Feb 2026 - Agenda - Pdf.pdf`
- `Resume 2025 - Baker Tilly.pdf`
- `TiViMate Users Guide 5.1.6.pdf`
- `Visual Style Guide for NotebookLM Presentations.pdf`
- `WPMU-DEV-Invoice-2025-06-05.pdf`

## Local Attachment Workaround

The current product attachment flow expects SharePoint / Microsoft Graph credentials. That environment was not configured for this training scenario.

To keep the walkthrough executable, the backend now supports a dev/test fallback:

- base64 attachments can be stored locally under `backend/.local-report-attachments/`
- the API returns a local attachment URL under `http://localhost:3000/api/reports/local-attachments/...`
- the report attachment record is still created and remains visible to staff and approvers

This fallback is intended for local testing and walkthrough generation. When Graph credentials are present, the existing SharePoint path still runs.

## Staff Walkthrough

### 1. Schedule and publish the meeting

Staff create the April 10 regular council meeting and publish the meeting record so it appears in the public meeting list.

Expected result:

- meeting status: `SCHEDULED`
- meeting publish status: `PUBLISHED`

### 2. Build the full agenda structure

Staff create one agenda titled `Regular Council Agenda - April 10, 2026` and add the required regular council sections:

- Call to Order
- Approval of Agenda
- Disclosure of Pecuniary Interest
- Adoption of Previous Minutes
- Staff Reports and Correspondence
- Bylaws
- Confirming Bylaw
- Adjournment

Additional agenda items added beneath those sections:

- `Adoption of the March 27, 2026 Regular Council Minutes`
- five staff report items
- `Financial Plan Amendment Bylaw No. 2198, 2026`
- `Confirming Bylaw No. 2199, 2026`

Expected result:

- agenda status: `DRAFT`
- all agenda items status: `DRAFT`

### 3. Prepare five staff reports

Staff create and complete these reports:

1. `2026 Financial Plan Amendment and Utility Rate Stabilization`
2. `Asset Management Program Service Level Framework`
3. `Fleet Replacement Tender Award for Public Works Operations`
4. `Accessibility Improvements for Recreation Facilities`
5. `Quarterly Fire Services Operations and Training Update`

Each report includes:

- report number
- department
- executive summary
- recommendation
- financial impact
- legal impact
- one supporting attachment from `assets/attachments/`

Expected result before submission:

- report workflow status: `DRAFT`
- attachment count: `5 total`, one per report
- attachment source type in this scenario: `LOCAL`

### 4. Submit reports for approval

Staff submit each report into workflow.

Expected result:

- report workflow status: `PENDING_DIRECTOR_APPROVAL`

## Leadership Walkthrough

### 5. Director approval

The Director reviews each staff report and approves it.

Expected result:

- report workflow status: `PENDING_CAO_APPROVAL`

### 6. CAO approval and publication

The CAO approves each staff report and publishes it.

Expected result:

- report workflow status: `PUBLISHED`

### 7. Agenda approval sequence

After the reports are ready, staff submit the agenda for approval.

The workflow sequence is:

1. submit agenda to Director
2. Director approval
3. CAO approval
4. publish agenda

Expected result:

- agenda status after submit: `PENDING_DIRECTOR_APPROVAL`
- agenda status after Director approval: `PENDING_CAO_APPROVAL`
- agenda status after CAO approval: `APPROVED`
- agenda status after publication: `PUBLISHED`

## Council Walkthrough

### 8. Record attendance

The meeting records six attendees:

- Mayor Eleanor Hayes
- Councillor Priya Shah
- Councillor Mateo Chen
- Councillor Olivia Martin
- Councillor Liam Foster
- Jordan Clerk

Expected result:

- six attendees recorded against the meeting

### 9. Start the meeting

The clerk or authorized chair starts the meeting.

Expected result:

- meeting status: `IN_PROGRESS`

### 10. Run motions and votes

The scenario records five motions:

1. approve the April 10 agenda
2. adopt the March 27 minutes
3. adopt the asset management framework
4. award the fleet replacement tender
5. authorize phase 1 accessibility improvements

Each motion is advanced through the live workflow:

- propose
- second
- open debate
- close debate
- call vote
- set outcome

Vote outcomes recorded in the scenario:

- agenda approval: carried `5-0-0`
- previous minutes adoption: carried `5-0-0`
- asset management framework: carried `4-0-1`
- fleet tender award: carried `4-1-0`
- accessibility improvements: carried `5-0-0`

### 11. Create and adopt resolutions

Three carried motions are converted into formal resolutions:

1. `RC-2026-0410-03-<run>` Asset Management Service Level Framework Endorsed
2. `RC-2026-0410-04-<run>` Fleet Replacement Tender Award Approved
3. `RC-2026-0410-05-<run>` Recreation Accessibility Improvements Authorized

Each resolution is created in `DRAFT` and then updated to `ADOPTED`.

The `<run>` suffix keeps the scenario re-runnable in a shared local database where prior test resolutions may still exist.

One resolution also creates follow-up work:

- asset management service level framework resolution marked `isActionRequired = true`
- resulting follow-up due date: `2026-06-30`

### 12. Complete the meeting

The meeting is ended with `COMPLETED` status.

Expected result:

- meeting status: `COMPLETED`

## Minutes Walkthrough

### 13. Create and start minutes

Staff create minutes for the April 10 meeting and begin the session.

Expected result:

- minutes status after creation: `DRAFT`
- minutes status after begin session: `IN_PROGRESS`

### 14. Populate the final minutes

The minutes record contains:

- attendance for all six attendees
- summary of the meeting decisions
- three formal motion entries aligned to the adopted resolutions
- three recorded vote entries
- one follow-up action item
- three narrative notes about approvals, attachments, and attendance

### 15. Finalize, adopt, and publish the minutes

The workflow sequence is:

1. finalize draft
2. adopt minutes
3. publish minutes

Expected result:

- minutes status after finalize: `FINALIZED`
- minutes status after adopt: `ADOPTED`
- minutes status after publish: `PUBLISHED`

## Public Results To Verify

After the scenario completes, the public APIs and the `/public` page should show:

- the April 10 meeting in public meetings
- the published April 10 agenda
- the published April 10 minutes
- the three adopted resolutions
- a public meeting package with:
  - one published agenda
  - one published minutes record
  - three adopted resolutions

The internal reports register should show all five April 10 staff reports in `PUBLISHED` status with one attachment each.

## How To Run The Scenario

From `frontend/`:

```bash
npm run test:e2e -- regular-council-meeting.spec.ts
```

You need the frontend and backend running locally.

## Files Added Or Updated For This Walkthrough

- `frontend/tests/e2e/regular-council-meeting.spec.ts`
- `frontend/tests/e2e/fixtures/auth.fixture.ts`
- `backend/src/reports/parsers/sharepoint-docx.service.ts`
- `backend/src/reports/reports.service.ts`
- `backend/src/reports/reports.repository.ts`
- `backend/src/main.ts`

## Notes For Future Production Readiness

- Replace the local attachment fallback with configured Graph credentials when SharePoint integration is available.
- If you want this walkthrough to reflect real governance even more closely, the next enhancement is linking the April 10 adoption item directly to the prior minutes record instead of using descriptive agenda text only.
