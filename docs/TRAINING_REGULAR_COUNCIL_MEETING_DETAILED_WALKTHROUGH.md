# April 10, 2026 Regular Council Meeting

This is the detailed training walkthrough for creating and managing a full regular council meeting in CouncilMeeting from beginning to end.

It is written for three audiences:

- staff and clerks who prepare the meeting package
- leadership who approve and publish the package
- council and meeting administrators who run the live meeting and close it out in minutes

This guide is intentionally procedural. It explains exactly what to enter, what status to expect after each action, and what to verify before moving on.

## Training Record In The System

The current persistent training record is already in the database and visible in the app:

- Meeting title: `Regular Council Meeting - April 10, 2026`
- Meeting ID: `b05bb225-35d7-4e4a-807a-dcfff1526058`
- Supporting prior meeting: `Regular Council Meeting - March 27, 2026`
- Prior meeting ID: `1744ae28-9f0e-48ee-85d0-26ccea4fd65f`

If you want to inspect the completed training package before recreating it yourself, start there.

## Screenshot Set

Training screenshots are stored in:

- `frontend/screenshots/training/regular-council-april-10-2026/`

Files:

1. `01-meeting-created-and-published.png`
2. `02-agenda-published.png`
3. `03-staff-reports-published.png`
4. `04-minutes-published.png`
5. `05-resolutions-register.png`
6. `06-public-portal-results.png`

Use those screenshots as visual checkpoints while following the written steps below.

## What This Walkthrough Covers

This walkthrough covers a complete public regular council meeting package with:

- a scheduled and published meeting record
- a published regular council agenda
- all required regular council sections
- adoption of previous minutes
- five staff report agenda items
- agenda approval by Director and CAO
- motions and recorded votes
- adopted resolutions
- finalized, adopted, and published minutes
- public portal verification

## Preconditions

Before staff start a new regular council meeting package, confirm the following:

1. The backend and frontend are running.
2. You can sign in with a user who has meeting, agenda, report, and minutes permissions.
3. A Director approver and CAO approver are available for workflow approvals.
4. You know which prior meeting minutes will be adopted.
5. The five training attachments are available in `assets/attachments/`.

For this training package, the five attachment files are:

- `Regular Council - 23 Feb 2026 - Agenda - Pdf.pdf`
- `Resume 2025 - Baker Tilly.pdf`
- `TiViMate Users Guide 5.1.6.pdf`
- `Visual Style Guide for NotebookLM Presentations.pdf`
- `WPMU-DEV-Invoice-2025-06-05.pdf`

## Part 1: Clerk And Staff Preparation

### Step 1: Create the meeting record

Open `Meetings`.

Create a new meeting with the following values:

- Title: `Regular Council Meeting - April 10, 2026`
- Meeting type: `COUNCIL`
- Date and time: `April 10, 2026 at 6:00 PM`
- Location: `Council Chamber`
- Description: `End-to-end training meeting covering agenda preparation, approvals, public publication, motions, resolutions, and minutes.`
- Public meeting: enabled

Expected result:

- meeting status: `SCHEDULED`
- publish status: `DRAFT`

What to verify before continuing:

1. The meeting appears in the meetings list.
2. The meeting type shows as a public council meeting.
3. The meeting is not marked in camera.

Reference screenshot:

- `01-meeting-created-and-published.png`

### Step 2: Publish the meeting record

From the meetings register or meeting details page, publish the meeting.

Why this matters:

- the public portal can only show public-facing meetings after the meeting record is published
- the meeting becomes part of the upcoming public meeting calendar

Expected result:

- publish status: `PUBLISHED`
- `publishedAt` is populated

What to verify before continuing:

1. The meeting still shows `SCHEDULED` as its operational status.
2. The meeting now shows `PUBLISHED` as its publish status.

### Step 3: Create the agenda shell

Open `Agendas` and create a new agenda for the April 10 meeting.

Use:

- Title: `Regular Council Agenda - April 10, 2026`

Expected result:

- agenda status: `DRAFT`
- version: `1`

What to verify before continuing:

1. The agenda is linked to the April 10 meeting.
2. The agenda can be opened for item entry.

### Step 4: Add the required regular council sections

Add the following agenda sections in this exact order:

1. `Call to Order`
2. `Approval of Agenda`
3. `Disclosure of Pecuniary Interest`
4. `Adoption of Previous Minutes`
5. `Staff Reports and Correspondence`
6. `Bylaws`
7. `Confirming Bylaw`
8. `Adjournment`

Why this matters:

- the agenda workflow checks for required regular council section titles before it can be approved and published

Expected result:

- all sections appear as agenda items
- item numbering is sequential
- status remains `DRAFT`

What to verify before continuing:

1. All eight required sections are present.
2. They appear in the correct order.
3. None are marked in camera.

### Step 5: Add the prior minutes adoption item

Under `Adoption of Previous Minutes`, add a public information item:

- Title: `Adoption of the March 27, 2026 Regular Council Minutes`
- Description: `Recommendation: THAT Council adopt the Regular Council Meeting minutes of March 27, 2026 as presented.`

Why this matters:

- regular council meetings typically adopt minutes from the previous regular meeting
- the agenda item creates the visible record of what council is adopting

Expected result:

- the item appears below the `Adoption of Previous Minutes` section
- item status remains `DRAFT`

### Step 6: Add the five staff report agenda items

Under `Staff Reports and Correspondence`, add the following five agenda items:

1. `2026 Financial Plan Amendment and Utility Rate Stabilization`
2. `Asset Management Program Service Level Framework`
3. `Fleet Replacement Tender Award for Public Works Operations`
4. `Accessibility Improvements for Recreation Facilities`
5. `Quarterly Fire Services Operations and Training Update`

Use the item type `STAFF_REPORT` for each one.

Suggested descriptions:

- `FIN-2026-014 - Corporate Services`
- `ENG-2026-021 - Engineering and Public Works`
- `OPS-2026-009 - Operations`
- `REC-2026-006 - Parks, Recreation and Culture`
- `FIRE-2026-004 - Protective Services`

What to verify before continuing:

1. Exactly five staff report items exist.
2. All five are public.
3. They are listed under `Staff Reports and Correspondence`.

### Step 7: Add the bylaw items

Add the following final business items:

Under `Bylaws`:

- `Financial Plan Amendment Bylaw No. 2198, 2026`

Under `Confirming Bylaw`:

- `Confirming Bylaw No. 2199, 2026`

What to verify before continuing:

1. The bylaw item appears under the bylaws section.
2. The confirming bylaw item appears under the confirming bylaw section.

## Part 2: Staff Reports

### Step 8: Create the five staff reports

Open `Reports`.

Create one report for each staff report agenda item.

For each report, complete these fields:

- report number
- title
- department
- executive summary
- recommendations
- financial impact
- legal impact

Use the following training content.

#### Report 1

- Title: `2026 Financial Plan Amendment and Utility Rate Stabilization`
- Report number: `FIN-2026-014`
- Department: `Corporate Services`
- Executive summary: `Adjusts the 2026 financial plan to absorb fuel volatility while keeping utility rate increases within the adopted forecast.`
- Recommendation: `THAT Council endorse the 2026 financial plan amendment and direct staff to bring forward the corresponding amendment bylaw.`
- Financial impact: `The amendment reallocates $185,000 from surplus stabilization reserves and avoids a mid-year utility surcharge.`
- Legal impact: `The financial plan amendment will require bylaw updates before year-end adoption.`

#### Report 2

- Title: `Asset Management Program Service Level Framework`
- Report number: `ENG-2026-021`
- Department: `Engineering and Public Works`
- Executive summary: `Establishes service level targets for roads, drainage, parks, and civic facilities so capital planning aligns with council priorities.`
- Recommendation: `THAT Council approve the draft asset management service level framework and direct staff to integrate it into the 2027 capital planning cycle.`
- Financial impact: `Implementation will use existing 2026 consulting funds and improve long-range capital forecasting accuracy.`
- Legal impact: `The framework supports statutory asset management planning obligations but does not create a new regulatory instrument.`

#### Report 3

- Title: `Fleet Replacement Tender Award for Public Works Operations`
- Report number: `OPS-2026-009`
- Department: `Operations`
- Executive summary: `Recommends awarding the fleet replacement contract for two tandem dump trucks and one sidewalk unit before the summer paving season.`
- Recommendation: `THAT Council award the 2026 fleet replacement tender to Valley Industrial Equipment in the amount of $642,800 excluding GST.`
- Financial impact: `Funding is available in the adopted equipment reserve and approved 2026 capital plan.`
- Legal impact: `The contract award follows the municipality procurement bylaw and delegated purchasing thresholds.`

#### Report 4

- Title: `Accessibility Improvements for Recreation Facilities`
- Report number: `REC-2026-006`
- Department: `Parks, Recreation and Culture`
- Executive summary: `Presents a phased retrofit plan for washrooms, entry doors, and spectator viewing areas at the civic arena and aquatics centre.`
- Recommendation: `THAT Council endorse Phase 1 recreation accessibility improvements and authorize grant application submissions for external funding.`
- Financial impact: `Phase 1 requires $120,000 in municipal contribution, offset by a pending accessibility infrastructure grant request.`
- Legal impact: `Work will improve compliance with current accessibility standards and reduce barrier-related service risks.`

#### Report 5

- Title: `Quarterly Fire Services Operations and Training Update`
- Report number: `FIRE-2026-004`
- Department: `Protective Services`
- Executive summary: `Summarizes first-quarter incident response metrics, volunteer recruitment progress, and upcoming live-burn training requirements.`
- Recommendation: `THAT Council receive the quarterly fire services operations update for information.`
- Financial impact: `The report is informational and can be delivered within the approved training and operating budgets.`
- Legal impact: `No additional statutory obligations are triggered by receipt of the report.`

Expected result after each create action:

- report workflow status: `DRAFT`

### Step 9: Attach supporting files

Attach one supporting file to each report.

Use these pairings:

1. Financial Plan Amendment report -> `Regular Council - 23 Feb 2026 - Agenda - Pdf.pdf`
2. Asset Management report -> `Resume 2025 - Baker Tilly.pdf`
3. Fleet Tender report -> `TiViMate Users Guide 5.1.6.pdf`
4. Accessibility report -> `Visual Style Guide for NotebookLM Presentations.pdf`
5. Fire Services update -> `WPMU-DEV-Invoice-2025-06-05.pdf`

In this environment, local attachment storage is enabled for training, so the files are uploaded without SharePoint.

What to verify before continuing:

1. Each report has exactly one attachment.
2. The attachment entry is visible in the report attachment drawer.
3. The attachment URL opens through the local attachment endpoint.

Reference screenshot:

- `03-staff-reports-published.png`

### Step 10: Submit each report for approval

For each report, click the submit action.

Expected result:

- report workflow status changes from `DRAFT` to `PENDING_DIRECTOR_APPROVAL`

What to verify before continuing:

1. No report remains in `DRAFT`.
2. All required fields were accepted with no readiness errors.

## Part 3: Leadership Approval Workflow

### Step 11: Director review

The Director opens the approval queue and reviews all five submitted reports.

For each report:

1. Open the report
2. Confirm recommendation text is clear
3. Confirm financial and legal sections are complete
4. Confirm the attachment is present
5. Approve the report

Expected result:

- report workflow status becomes `PENDING_CAO_APPROVAL`

### Step 12: CAO review

The CAO reviews the five director-approved reports.

For each report:

1. Open the report from the CAO queue
2. Confirm the report is council-ready
3. Approve the report

Expected result:

- report workflow status becomes `APPROVED`

### Step 13: Publish each approved report

After approval, publish each report.

Expected result:

- report workflow status becomes `PUBLISHED`

What to verify before continuing:

1. Each report now shows a published workflow state.
2. The supporting attachment is still available.

## Part 4: Agenda Approval And Publication

### Step 14: Submit the agenda to the Director

Once all agenda items are ready and ordered correctly, submit the agenda.

Expected result:

- agenda status becomes `PENDING_DIRECTOR_APPROVAL`

### Step 15: Director approves the agenda

The Director approves the agenda.

Expected result:

- agenda status becomes `PENDING_CAO_APPROVAL`

### Step 16: CAO approves the agenda

The CAO approves the agenda.

Expected result:

- agenda status becomes `APPROVED`

### Step 17: Publish the agenda

Publish the approved agenda.

Expected result:

- agenda status becomes `PUBLISHED`
- public agenda becomes visible on the public portal

What to verify before continuing:

1. The agenda shows all required sections.
2. The five staff report items are present on the published agenda.
3. The agenda is visible in the public package.

Reference screenshot:

- `02-agenda-published.png`

## Part 5: Live Meeting Administration

### Step 18: Record attendance

Add the following attendees to the April 10 meeting:

- Mayor Eleanor Hayes
- Councillor Priya Shah
- Councillor Mateo Chen
- Councillor Olivia Martin
- Councillor Liam Foster
- Jordan Clerk

Set all as present.

Suggested arrival time:

- `2026-04-10 5:52 PM`

Expected result:

- all six attendees are attached to the meeting

### Step 19: Start the meeting

Start the meeting when the session begins.

Expected result:

- meeting status becomes `IN_PROGRESS`

What to verify before continuing:

1. The meeting no longer shows as only scheduled.
2. Live meeting actions are available.

## Part 6: Motions, Votes, And Resolutions

### Step 20: Record the agenda approval motion

Create a motion on `Approval of Agenda`:

- Title: `Approve the April 10, 2026 regular council agenda`
- Body: `THAT Council approve the April 10, 2026 regular council agenda as circulated.`

Then advance the motion through:

1. propose
2. second
3. open debate
4. close debate
5. call vote
6. set outcome

Vote outcome:

- carried `5-0-0`

### Step 21: Record the previous minutes adoption motion

Create a motion on the adoption item:

- Title: `Adopt the March 27, 2026 regular council minutes`
- Body: `THAT Council adopt the March 27, 2026 regular council meeting minutes as presented.`

Vote outcome:

- carried `5-0-0`

### Step 22: Record the three decision motions that become resolutions

Create and vote on the following motions:

1. `Adopt the asset management service level framework`
2. `Award the fleet replacement tender`
3. `Authorize phase 1 recreation accessibility improvements`

Recorded vote results for training:

1. Asset management framework: carried `4-0-1`
2. Fleet replacement tender: carried `4-1-0`
3. Accessibility improvements: carried `5-0-0`

### Step 23: Create the adopted resolutions

Create a resolution for each carried decision motion.

Current training record numbers are:

1. `RC-2026-0410-03-40443`
2. `RC-2026-0410-04-40443`
3. `RC-2026-0410-05-40443`

For each resolution:

1. link it to the meeting
2. link it to the agenda item
3. link it to the motion
4. record mover and seconder
5. enter the vote totals
6. update status to `ADOPTED`

Special handling for the asset management resolution:

- mark `isActionRequired = true`
- due date: `2026-06-30`

Expected result:

- all three resolutions appear in the resolutions register
- all three show status `ADOPTED`

Reference screenshot:

- `05-resolutions-register.png`

## Part 7: Minutes Workflow

### Step 24: Create minutes for the April 10 meeting

Open `Minutes` and create a minutes record for the April 10 meeting.

Expected result:

- minutes status: `DRAFT`

### Step 25: Begin the session

Select `Begin Session`.

Expected result:

- minutes status: `IN_PROGRESS`

### Step 26: Populate the minutes content

Update the minutes record with:

- a meeting summary
- attendance for six participants
- the three carried resolution motions
- the three recorded votes
- one action item
- explanatory notes

Use the summary from the training record:

`Council approved the April 10 agenda, adopted the previous regular council minutes, endorsed the asset management framework, awarded the fleet tender, and authorized phase 1 accessibility improvements.`

Add this action item:

- `Incorporate the approved asset management service levels into 2027 capital planning materials.`

Owner:

- `Engineering and Public Works`

Due date:

- `2026-06-30`

Add these notes:

1. `Agenda package was approved by Director and CAO before publication.`
2. `Five staff reports were published with local attachments because SharePoint was not configured in the test environment.`
3. `Meeting concluded in public session with quorum maintained throughout proceedings.`

### Step 27: Finalize the minutes

Finalize the draft once attendance and motions are complete.

Expected result:

- minutes status becomes `FINALIZED`

### Step 28: Adopt the minutes

Adopt the finalized minutes.

Expected result:

- minutes status becomes `ADOPTED`

### Step 29: Publish the minutes

Publish the adopted minutes.

Expected result:

- minutes status becomes `PUBLISHED`
- `publishedAt` is populated

Reference screenshot:

- `04-minutes-published.png`

## Part 8: Public Verification

### Step 30: Verify the public portal

Open `/public`.

Confirm the following are visible:

1. `Regular Council Meeting - April 10, 2026`
2. the published regular council agenda
3. the published minutes record
4. the adopted resolutions
5. the public meeting package row for the April 10 meeting

Reference screenshot:

- `06-public-portal-results.png`

## Part 9: Expected Final State

After the workflow is complete, the training record should have the following state.

### Meeting

- Title: `Regular Council Meeting - April 10, 2026`
- Meeting ID: `b05bb225-35d7-4e4a-807a-dcfff1526058`
- Meeting status: `IN_PROGRESS`
- Publish status: `PUBLISHED`

Note:

- the meeting remains future-dated for April 10, 2026, so it is intentionally left active in the training record rather than being closed out with a real-time end timestamp before the meeting date

### Agenda

- Status: `PUBLISHED`
- Version: `21`
- Required sections present: yes

### Minutes

- Status: `PUBLISHED`
- Minute taker: `Jordan Clerk`

### Resolutions

- Count: `3`
- Status: all `ADOPTED`

## Part 10: Troubleshooting

### If you cannot see the training meeting

Check:

1. the backend is running in normal mode, not a temporary test session that was cleaned up
2. you are opening the `Meetings` page, not only the public portal
3. you are searching for the exact title `Regular Council Meeting - April 10, 2026`

### If the public portal does not show the meeting package

Check:

1. meeting publish status is `PUBLISHED`
2. agenda status is `PUBLISHED`
3. minutes status is `PUBLISHED`
4. the meeting is public and not in camera

### If agenda approval fails

Check that the required section titles are present exactly as listed in this guide.

### If report attachments cannot upload in local training

Use the local attachment fallback already enabled in this repo. The upload should store the files under backend local storage and return a local attachment URL.

## Part 11: Training Recommendation

Use this guide in three passes with staff:

1. Clerk pass: meeting, agenda, reports, minutes
2. Leadership pass: Director and CAO approvals
3. Council pass: motions, votes, resolutions, public verification

That split keeps each audience focused on the screens and decisions they actually own while still showing how the full package fits together.
