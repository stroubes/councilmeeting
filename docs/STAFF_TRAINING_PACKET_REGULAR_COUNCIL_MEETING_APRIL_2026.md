# Staff Training Packet

## Regular Council Meeting — April 10, 2026

### CouncilMeeting Application — End-to-End Workflow Guide

---

**Document type:** Staff Training Packet  
**Audience:** Municipal Clerks, Directors, CAO, Council Administrators  
**Meeting:** Regular Council Meeting — April 10, 2026  
**Application:** CouncilMeeting (councilmanagement.local)  
**Training record ID:** `b05bb225-35d7-4e4a-807a-dcfff1526058`  
**Last updated:** April 2026  

---

> **How to use this packet:** Work through the sections in order. Each section corresponds to one role or phase of the meeting lifecycle. Screenshots are referenced at each major step. The **Clerk** sections (1–3) are run by municipal staff. The **Leadership** section (4) is run by Directors and the CAO. The **Council** section (5) is run by the meeting chair and clerk during the live session.

---

## Table of Contents

1. [Overview and Training Record](#1-overview-and-training-record)
2. [Part 1 — Clerk: Meeting and Agenda Setup](#2-part-1--clerk-meeting-and-agenda-setup)
3. [Part 2 — Clerk: Staff Reports and Attachments](#3-part-2--clerk-staff-reports-and-attachments)
4. [Part 3 — Clerk: Agenda Finalization and Submission](#4-part-3--clerk-agenda-finalization-and-submission)
5. [Part 4 — Leadership: Director and CAO Approvals](#5-part-4--leadership-director-and-cao-approvals)
6. [Part 5 — Council: Live Meeting Administration](#6-part-5--council-live-meeting-administration)
7. [Part 6 — Clerk: Minutes Production](#7-part-6--clerk-minutes-production)
8. [Part 7 — Public Verification](#8-part-7--public-verification)
9. [Quick Reference](#9-quick-reference)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview and Training Record

### What this packet covers

This packet walks through a complete Regular Council Meeting package from creation to public archive. It uses the **April 10, 2026 Regular Council Meeting** as the training example. Every field value, status, and action shown here matches what was executed in the live application.

The packet is designed for three audiences:

| Role | What they do | Sections |
|------|-------------|----------|
| **Clerk / Staff** | Create meeting, build agenda, prepare reports, produce minutes | Parts 1, 2, 3, 6, 7 |
| **Leadership (Director / CAO)** | Review and approve the agenda and staff reports | Part 4 |
| **Council (Chair / Clerk)** | Run the live meeting: motions, votes, resolutions | Parts 5, 7 |

### The training record in the app

The completed April 10, 2026 training meeting already exists in the system and survives restarts. You can visit it directly:

- **App URL:** `http://localhost:5173/meetings`
- **Meeting title:** `Regular Council Meeting - April 10, 2026`
- **Meeting ID:** `b05bb225-35d7-4e4a-807a-dcfff1526058`

> **Note for trainers:** The training data was created using a full end-to-end Playwright scenario against the persistent database. If you cannot see the meeting, ensure the backend is running in normal mode (not a temporary in-memory session). Restart the backend with `npm run start:dev` from the `backend/` directory.

### Screenshot assets

Six annotated screenshots document the completed training workflow. They are located at:

```
frontend/screenshots/training/regular-council-april-10-2026/
```

| Screenshot | Shows | Used in |
|-----------|-------|---------|
| `01-meeting-created-and-published.png` | Meetings list with published April 10 meeting | Section 2 |
| `02-agenda-published.png` | Agenda register showing published agenda | Section 3 |
| `03-staff-reports-published.png` | Reports register with all 5 published reports | Section 3 |
| `04-minutes-published.png` | Minutes register with published minutes | Section 7 |
| `05-resolutions-register.png` | Resolutions register with 3 adopted resolutions | Section 6 |
| `06-public-portal-results.png` | Public portal showing the full meeting package | Section 8 |

### Training attachments

The five staff reports use these supporting files stored at `assets/attachments/`:

| Report | Attachment file |
|--------|----------------|
| FIN-2026-014 — Financial Plan Amendment | `Regular Council - 23 Feb 2026 - Agenda - Pdf.pdf` |
| ENG-2026-021 — Asset Management Framework | `Resume 2025 - Baker Tilly.pdf` |
| OPS-2026-009 — Fleet Replacement Tender | `TiViMate Users Guide 5.1.6.pdf` |
| REC-2026-006 — Accessibility Improvements | `Visual Style Guide for NotebookLM Presentations.pdf` |
| FIRE-2026-004 — Fire Services Update | `WPMU-DEV-Invoice-2025-06-05.pdf` |

> **Storage note:** In the training environment, attachments are stored locally under `backend/.local-report-attachments/` and served via `GET /api/reports/local-attachments/:fileName`. Production deployments using Microsoft SharePoint store attachments in SharePoint instead.

---

## 2. Part 1 — Clerk: Meeting and Agenda Setup

**Who:** Municipal clerk or designated staff  
**Duration:** ~20 minutes  
**System path:** `Meetings` → `Agendas`

---

### Step 1.1 — Create the meeting record

Navigate to **Meetings** and create a new meeting.

**Fields:**

| Field | Value entered |
|-------|--------------|
| Title | `Regular Council Meeting - April 10, 2026` |
| Meeting type | `COUNCIL` |
| Date and time | `April 10, 2026 at 6:00 PM` |
| Location | `Council Chamber` |
| Description | `End-to-end training meeting covering agenda preparation, approvals, public publication, motions, resolutions, and minutes.` |
| Public meeting | ✅ Enabled (checked) |

**Expected result after save:**

- Meeting status: `SCHEDULED`
- Publish status: `DRAFT`

**What to verify before continuing:**

1. The meeting appears in the meetings list sorted by date.
2. The meeting type badge shows `COUNCIL`.
3. Public meeting toggle is enabled.
4. No in-camera flag is set.

> **📷 Screenshot reference:** `01-meeting-created-and-published.png`  
> **Annotation callout:** Look for the row with "April 10, 2026" in the date column. The publish status badge shows `PUBLISHED` (green). The meeting type column shows `COUNCIL`.

---

### Step 1.2 — Publish the meeting record

From the meeting detail page or the meetings register, click **Publish**.

**Why this matters:** The public portal only displays meetings that have been published at the record level. Publishing the meeting record also activates the upcoming public meeting calendar.

**Expected result:**

- Publish status changes from `DRAFT` → `PUBLISHED`
- `publishedAt` timestamp is populated

**What to verify:**

1. The publish status badge on the meeting row changes to `PUBLISHED`.
2. The meeting is now visible in the public portal (`/public`).

---

### Step 1.3 — Create the agenda shell

Navigate to **Agendas** and create a new agenda linked to the April 10 meeting.

**Fields:**

| Field | Value entered |
|-------|--------------|
| Title | `Regular Council Agenda - April 10, 2026` |
| Linked meeting | Select `Regular Council Meeting - April 10, 2026` |

**Expected result:**

- Agenda status: `DRAFT`
- Version: `1`

---

### Step 1.4 — Add required regular council sections

Add the following eight sections in this exact order. Each becomes an agenda item acting as a section header:

1. `Call to Order`
2. `Approval of Agenda`
3. `Disclosure of Pecuniary Interest`
4. `Adoption of Previous Minutes`
5. `Staff Reports and Correspondence`
6. `Bylaws`
7. `Confirming Bylaw`
8. `Adjournment`

**How to add a section:** Click **Add Item** on the agenda, select item type `SECTION` (or the closest equivalent in youragenda item type list), enter the section title, and set it to **Public**.

**Why this matters:** The agenda approval workflow checks that all required section titles are present before allowing publication. Missing or misnamed sections will block approval.

**What to verify:**

1. All eight sections appear in the agenda in the correct order.
2. Each section is marked Public.
3. Item numbering is sequential (e.g., 1, 2, 3...).
4. Agenda status is still `DRAFT`.

---

### Step 1.5 — Add the prior minutes adoption item

Under the `Adoption of Previous Minutes` section, add one public information/decision item:

| Field | Value |
|-------|-------|
| Title | `Adoption of the March 27, 2026 Regular Council Minutes` |
| Description | `Recommendation: THAT Council adopt the Regular Council Meeting minutes of March 27, 2026 as presented.` |

**Why this matters:** This creates the formal agenda record of what council will vote to adopt. The actual minutes document is referenced in the Minutes module.

---

### Step 1.6 — Add the five staff report items

Under `Staff Reports and Correspondence`, add five items using type `STAFF_REPORT`:

| # | Title | Item type |
|---|-------|-----------|
| 1 | `2026 Financial Plan Amendment and Utility Rate Stabilization` | STAFF_REPORT |
| 2 | `Asset Management Program Service Level Framework` | STAFF_REPORT |
| 3 | `Fleet Replacement Tender Award for Public Works Operations` | STAFF_REPORT |
| 4 | `Accessibility Improvements for Recreation Facilities` | STAFF_REPORT |
| 5 | `Quarterly Fire Services Operations and Training Update` | STAFF_REPORT |

**Suggested descriptions (shown on the agenda under each item):**

| Report | Description |
|--------|-------------|
| 2026 Financial Plan Amendment | `FIN-2026-014 - Corporate Services` |
| Asset Management Framework | `ENG-2026-021 - Engineering and Public Works` |
| Fleet Replacement Tender | `OPS-2026-009 - Operations` |
| Accessibility Improvements | `REC-2026-006 - Parks, Recreation and Culture` |
| Fire Services Update | `FIRE-2026-004 - Protective Services` |

---

### Step 1.7 — Add bylaw items

Under `Bylaws`:

- `Financial Plan Amendment Bylaw No. 2198, 2026`

Under `Confirming Bylaw`:

- `Confirming Bylaw No. 2199, 2026`

---

## 3. Part 2 — Clerk: Staff Reports and Attachments

**Who:** Municipal clerk or designated staff  
**Duration:** ~45 minutes  
**System path:** `Reports`

---

### Step 2.1 — Create the five staff reports

For each of the five agenda items added in Step 1.6, create a corresponding report in the **Reports** module.

For each report, complete these fields:

- Report number
- Title
- Department
- Executive summary
- Recommendations
- Financial impact
- Legal impact

**Report 1 — Financial Plan Amendment**

| Field | Value |
|-------|-------|
| Report number | `FIN-2026-014` |
| Title | `2026 Financial Plan Amendment and Utility Rate Stabilization` |
| Department | `Corporate Services` |
| Executive summary | `Adjusts the 2026 financial plan to absorb fuel volatility while keeping utility rate increases within the adopted forecast.` |
| Recommendation | `THAT Council endorse the 2026 financial plan amendment and direct staff to bring forward the corresponding amendment bylaw.` |
| Financial impact | `The amendment reallocates $185,000 from surplus stabilization reserves and avoids a mid-year utility surcharge.` |
| Legal impact | `The financial plan amendment will require bylaw updates before year-end adoption.` |

**Report 2 — Asset Management Framework**

| Field | Value |
|-------|-------|
| Report number | `ENG-2026-021` |
| Title | `Asset Management Program Service Level Framework` |
| Department | `Engineering and Public Works` |
| Executive summary | `Establishes service level targets for roads, drainage, parks, and civic facilities so capital planning aligns with council priorities.` |
| Recommendation | `THAT Council approve the draft asset management service level framework and direct staff to integrate it into the 2027 capital planning cycle.` |
| Financial impact | `Implementation will use existing 2026 consulting funds and improve long-range capital forecasting accuracy.` |
| Legal impact | `The framework supports statutory asset management planning obligations but does not create a new regulatory instrument.` |

**Report 3 — Fleet Replacement Tender**

| Field | Value |
|-------|-------|
| Report number | `OPS-2026-009` |
| Title | `Fleet Replacement Tender Award for Public Works Operations` |
| Department | `Operations` |
| Executive summary | `Recommends awarding the fleet replacement contract for two tandem dump trucks and one sidewalk unit before the summer paving season.` |
| Recommendation | `THAT Council award the 2026 fleet replacement tender to Valley Industrial Equipment in the amount of $642,800 excluding GST.` |
| Financial impact | `Funding is available in the adopted equipment reserve and approved 2026 capital plan.` |
| Legal impact | `The contract award follows the municipality procurement bylaw and delegated purchasing thresholds.` |

**Report 4 — Accessibility Improvements**

| Field | Value |
|-------|-------|
| Report number | `REC-2026-006` |
| Title | `Accessibility Improvements for Recreation Facilities` |
| Department | `Parks, Recreation and Culture` |
| Executive summary | `Presents a phased retrofit plan for washrooms, entry doors, and spectator viewing areas at the civic arena and aquatics centre.` |
| Recommendation | `THAT Council endorse Phase 1 recreation accessibility improvements and authorize grant application submissions for external funding.` |
| Financial impact | `Phase 1 requires $120,000 in municipal contribution, offset by a pending accessibility infrastructure grant request.` |
| Legal impact | `Work will improve compliance with current accessibility standards and reduce barrier-related service risks.` |

**Report 5 — Fire Services Update**

| Field | Value |
|-------|-------|
| Report number | `FIRE-2026-004` |
| Title | `Quarterly Fire Services Operations and Training Update` |
| Department | `Protective Services` |
| Executive summary | `Summarizes first-quarter incident response metrics, volunteer recruitment progress, and upcoming live-burn training requirements.` |
| Recommendation | `THAT Council receive the quarterly fire services operations update for information.` |
| Financial impact | `The report is informational and can be delivered within the approved training and operating budgets.` |
| Legal impact | `No additional statutory obligations are triggered by receipt of the report.` |

**Expected result after each create:**

- Report workflow status: `DRAFT`

---

### Step 2.2 — Attach supporting files

Attach one file to each report. Use the pairings below:

| Report | Attachment |
|--------|-----------|
| FIN-2026-014 | `Regular Council - 23 Feb 2026 - Agenda - Pdf.pdf` |
| ENG-2026-021 | `Resume 2025 - Baker Tilly.pdf` |
| OPS-2026-009 | `TiViMate Users Guide 5.1.6.pdf` |
| REC-2026-006 | `Visual Style Guide for NotebookLM Presentations.pdf` |
| FIRE-2026-004 | `WPMU-DEV-Invoice-2025-06-05.pdf` |

**How to attach a file:**

1. Open the report.
2. Click **Attachments** (or the paperclip icon).
3. Click **Add attachment**.
4. Select the file from `assets/attachments/`.
5. The upload indicator shows progress; wait for the "Uploaded" confirmation.
6. The attachment appears as a row in the attachments drawer with filename and upload date.

> **📷 Screenshot reference:** `03-staff-reports-published.png`  
> **Annotation callout:** The Reports register shows five rows. Each row's status badge is `PUBLISHED` (green). The attachment count column shows `1` for each report. The department column correctly shows `Corporate Services`, `Engineering and Public Works`, `Operations`, `Parks, Recreation and Culture`, and `Protective Services`.

**What to verify:**

1. Each report has exactly one attachment listed.
2. The attachment filename matches the expected file.
3. The attachment URL opens and returns the file (test by clicking the download icon).

---

### Step 2.3 — Submit each report for approval

For each of the five reports, click the **Submit** action.

**Expected result after each submit:**

- Report workflow status: `DRAFT` → `PENDING_DIRECTOR_APPROVAL`

> **Role callout — Clerk:** After submitting, do not proceed to the Director queue yourself. Hand off to the Director approver. You will be notified when Director approval is complete and the CAO queue is ready.

**What to verify:**

1. No report remains in `DRAFT` status.
2. All five reports show `PENDING_DIRECTOR_APPROVAL`.
3. The submit confirmation appears without error messages.

---

## 4. Part 3 — Clerk: Agenda Finalization and Submission

**Who:** Municipal clerk  
**Duration:** ~10 minutes  
**System path:** `Agendas`

---

### Step 3.1 — Verify all agenda items are present

Before submitting the agenda for approval, confirm:

1. All eight required sections are present and in order.
2. The prior minutes adoption item is under `Adoption of Previous Minutes`.
3. All five staff report items are under `Staff Reports and Correspondence`.
4. Bylaw and confirming bylaw items are in place.
5. No items are marked In Camera (unless specifically required).
6. Item numbering is sequential.

---

### Step 3.2 — Submit the agenda for Director approval

Click **Submit** (or **Submit for Approval**) on the agenda.

**Expected result:**

- Agenda status: `DRAFT` → `PENDING_DIRECTOR_APPROVAL`

> **📷 Screenshot reference:** `02-agenda-published.png`  
> **Annotation callout:** In the Agenda register, the row for "Regular Council Agenda - April 10, 2026" shows a status badge of `PUBLISHED`. The version column shows `21` (incremented through each save during the training process). The linked meeting column shows the April 10 meeting title.

**What to verify before Director approval:**

1. Agenda status is `PENDING_DIRECTOR_APPROVAL`.
2. The Director can see the agenda in their approval queue.
3. All items are saved and not in a broken draft state.

> **Role callout — Clerk:** Once submitted, wait for Director and CAO approvals to complete before publishing. You will receive notifications at each approval stage.

---

## 5. Part 4 — Leadership: Director and CAO Approvals

**Who:** Department Directors (reports), Director of Council Services (agenda), CAO  
**Duration:** ~20 minutes  
**System path:** `Approvals` queue (or `Reports`, `Agendas`)

---

### Step 4.1 — Director approves the five staff reports

The Director opens each of the five reports from the approval queue.

**For each report, the Director verifies:**

1. Report number and title match the agenda item.
2. Recommendation text is clear and council-ready.
3. Financial impact section is complete and accurate.
4. Legal impact section is complete.
5. The attachment is present and readable.
6. The report supports the agenda item it is linked to.

**Action:** Click **Approve** on each report.

**Expected result after Director approval:**

- Report workflow status: `PENDING_DIRECTOR_APPROVAL` → `PENDING_CAO_APPROVAL`

---

### Step 4.2 — CAO approves the five staff reports

The CAO reviews each report from the CAO approval queue.

**For each report, the CAO verifies:**

1. The report is council-ready in tone, accuracy, and completeness.
2. The recommendation is appropriate for council adoption.
3. The financial and legal impacts are within council authority.
4. The attachment supports the recommendations.

**Action:** Click **Approve** on each report.

**Expected result after CAO approval:**

- Report workflow status: `PENDING_CAO_APPROVAL` → `APPROVED`

---

### Step 4.3 — Publish the approved reports

Clerk or CAO publishes each approved report.

**Action:** Click **Publish** on each of the five reports.

**Expected result:**

- Report workflow status: `APPROVED` → `PUBLISHED`
- `publishedAt` is populated for each report

**What to verify:**

1. All five reports now show `PUBLISHED` status.
2. Each published report is visible on the public agenda.
3. Each attachment is still accessible after publication.

---

### Step 4.4 — Director approves the agenda

The Director opens the agenda approval queue and reviews the complete agenda.

**The Director verifies:**

1. All required sections are present in the correct order.
2. All five staff report items are linked to published reports.
3. The prior minutes adoption item is present.
4. Bylaw items are complete.
5. No unexpected In Camera items.

**Action:** Click **Approve** on the agenda.

**Expected result:**

- Agenda status: `PENDING_DIRECTOR_APPROVAL` → `PENDING_CAO_APPROVAL`

---

### Step 4.5 — CAO approves and publishes the agenda

The CAO reviews and approves the agenda, then publishes it.

**Action sequence:**

1. Click **Approve** → status becomes `APPROVED`
2. Click **Publish** → status becomes `PUBLISHED`

**Expected result:**

- Agenda status: `APPROVED` → `PUBLISHED`
- Public agenda is now live on the public portal

**What to verify:**

1. Agenda status shows `PUBLISHED` in the register.
2. The agenda is visible when accessing the April 10 meeting from the public portal.
3. All five staff reports appear on the published agenda.

> **📷 Screenshot reference:** `02-agenda-published.png`  
> **Annotation callout:** The agenda register shows the April 10 agenda with `PUBLISHED` status. The version is `21`, indicating it has been saved multiple times through the workflow. The public badge shows `PUBLIC`.

---

## 6. Part 5 — Council: Live Meeting Administration

**Who:** Mayor or Deputy Mayor (chair), Municipal Clerk, Meeting Administrator  
**Duration:** Duration of the live meeting  
**System path:** `Meetings` → Meeting detail → Live meeting panel

---

### Step 5.1 — Record attendance

Before starting the meeting, add all attendees and mark them present.

**Attendees for April 10, 2026:**

| Name | Role |
|------|------|
| Mayor Eleanor Hayes | Presiding Officer |
| Councillor Priya Shah | Council Member |
| Councillor Mateo Chen | Council Member |
| Councillor Olivia Martin | Council Member |
| Councillor Liam Foster | Council Member |
| Jordan Clerk | Municipal Clerk / Minute Taker |

**Suggested arrival time for training:** `2026-04-10 5:52 PM` (8 minutes before start)

**Action:** For each attendee, add them to the meeting record and set their attendance status to **Present**.

**Expected result:**

- All six attendees appear in the meeting attendance register.
- Each shows `Present` as their attendance status.

---

### Step 5.2 — Start the meeting

**Action:** Click **Start Meeting** (or **Begin Session**) on the meeting record.

**Expected result:**

- Meeting operational status: `SCHEDULED` → `IN_PROGRESS`
- Live meeting controls become available (motion panel, vote recorder, etc.)

> **Note:** In the training record, the April 10 meeting is permanently set to `IN_PROGRESS` because the scheduled date (April 10, 2026) is in the future relative to the training session, preventing the real-time end-meeting validation from blocking progress.

---

### Step 5.3 — Record the agenda approval motion

**Motion 1 — Approve Agenda**

| Field | Value |
|-------|-------|
| Title | `Approve the April 10, 2026 regular council agenda` |
| Body | `THAT Council approve the April 10, 2026 regular council agenda as circulated.` |
| Linked agenda item | `Approval of Agenda` |

**Advance the motion through each stage:**

1. **Propose** — Enter the mover (e.g., Councillor Shah)
2. **Second** — Enter the seconder (e.g., Councillor Martin)
3. **Open Debate** — Enable discussion
4. **Close Debate** — End discussion
5. **Call Vote** — Initiate recorded vote
6. **Set Outcome** — Mark as **Carried**

**Recorded vote:**

| For | Against | Abstain |
|-----|---------|---------|
| 5 | 0 | 0 |

---

### Step 5.4 — Record the previous minutes adoption motion

**Motion 2 — Adopt March 27 Minutes**

| Field | Value |
|-------|-------|
| Title | `Adopt the March 27, 2026 regular council minutes` |
| Body | `THAT Council adopt the March 27, 2026 regular council meeting minutes as presented.` |
| Linked agenda item | `Adoption of Previous Minutes` |

**Vote outcome:** Carried `5-0-0`

---

### Step 5.5 — Record the three decision motions

Create and process the following motions in order:

**Motion 3 — Asset Management Framework**

- Title: `Adopt the asset management service level framework`
- Linked agenda item: `Asset Management Program Service Level Framework`
- Vote: Carried `4-0-1`

**Motion 4 — Fleet Replacement Tender**

- Title: `Award the fleet replacement tender`
- Linked agenda item: `Fleet Replacement Tender Award for Public Works Operations`
- Vote: Carried `4-1-0`

**Motion 5 — Accessibility Improvements**

- Title: `Authorize phase 1 recreation accessibility improvements`
- Linked agenda item: `Accessibility Improvements for Recreation Facilities`
- Vote: Carried `5-0-0`

---

### Step 5.6 — Create adopted resolutions

For each carried decision motion, create a resolution in the **Resolutions** register.

**Resolution 1**

| Field | Value |
|-------|-------|
| Resolution number | `RC-2026-0410-03` (training: `RC-2026-0410-03-40443`) |
| Linked meeting | `Regular Council Meeting - April 10, 2026` |
| Linked agenda item | `Asset Management Program Service Level Framework` |
| Linked motion | Motion 3 — Asset Management Framework |
| Mover | (recorded from motion) |
| Seconder | (recorded from motion) |
| Vote | `4-0-1` |
| `isActionRequired` | `true` |
| Action due date | `2026-06-30` |
| Status | `ADOPTED` |

**Resolution 2**

| Field | Value |
|-------|-------|
| Resolution number | `RC-2026-0410-04` (training: `RC-2026-0410-04-40443`) |
| Linked meeting | `Regular Council Meeting - April 10, 2026` |
| Linked agenda item | `Fleet Replacement Tender Award for Public Works Operations` |
| Linked motion | Motion 4 — Fleet Replacement Tender |
| Vote | `4-1-0` |
| Status | `ADOPTED` |

**Resolution 3**

| Field | Value |
|-------|-------|
| Resolution number | `RC-2026-0410-05` (training: `RC-2026-0410-05-40443`) |
| Linked meeting | `Regular Council Meeting - April 10, 2026` |
| Linked agenda item | `Accessibility Improvements for Recreation Facilities` |
| Linked motion | Motion 5 — Accessibility Improvements |
| Vote | `5-0-0` |
| Status | `ADOPTED` |

> **📷 Screenshot reference:** `05-resolutions-register.png`  
> **Annotation callout:** The resolutions register shows three rows. Each resolution has a status badge of `ADOPTED` (green). The resolution number column shows `RC-2026-0410-03-40443`, `RC-2026-0410-04-40443`, `RC-2026-0410-05-40443`. The linked meeting column shows the April 10 meeting. One resolution shows an action item flag with a due date.

---

## 7. Part 6 — Clerk: Minutes Production

**Who:** Municipal Clerk or designated minute taker  
**Duration:** ~30 minutes after meeting  
**System path:** `Minutes`

---

### Step 6.1 — Create the minutes record

Navigate to **Minutes** and create a new minutes record for the April 10 meeting.

**Expected result:**

- Minutes status: `DRAFT`

---

### Step 6.2 — Begin the session

Click **Begin Session** (or **Start Minutes**).

**Expected result:**

- Minutes status: `DRAFT` → `IN_PROGRESS`

---

### Step 6.3 — Populate the minutes content

Update the minutes record with the following content:

**Meeting summary:**

> Council approved the April 10 agenda, adopted the previous regular council minutes, endorsed the asset management framework, awarded the fleet tender, and authorized phase 1 accessibility improvements.

**Attendance:**

Record all six attendees as present (Eleanor Hayes, Priya Shah, Mateo Chen, Olivia Martin, Liam Foster, Jordan Clerk).

**Motions and votes recorded:**

| Motion | Outcome |
|--------|---------|
| Approve the April 10, 2026 regular council agenda | Carried 5-0-0 |
| Adopt the March 27, 2026 regular council meeting minutes | Carried 5-0-0 |
| Adopt the asset management service level framework | Carried 4-0-1 |
| Award the fleet replacement tender | Carried 4-1-0 |
| Authorize phase 1 accessibility improvements | Carried 5-0-0 |

**Action item:**

| Item | Owner | Due date |
|------|-------|----------|
| Incorporate the approved asset management service levels into 2027 capital planning materials. | Engineering and Public Works | 2026-06-30 |

**Notes:**

1. Agenda package was approved by Director and CAO before publication.
2. Five staff reports were published with local attachments because SharePoint was not configured in the training environment.
3. Meeting concluded in public session with quorum maintained throughout proceedings.

---

### Step 6.4 — Finalize the minutes

Click **Finalize**.

**Expected result:**

- Minutes status: `IN_PROGRESS` → `FINALIZED`

---

### Step 6.5 — Adopt the minutes

Click **Adopt**.

**Expected result:**

- Minutes status: `FINALIZED` → `ADOPTED`

---

### Step 6.6 — Publish the minutes

Click **Publish**.

**Expected result:**

- Minutes status: `ADOPTED` → `PUBLISHED`
- `publishedAt` is populated

> **📷 Screenshot reference:** `04-minutes-published.png`  
> **Annotation callout:** The Minutes register shows one row for the April 10 meeting. The status badge is `PUBLISHED` (green). The meeting title column shows "Regular Council Meeting - April 10, 2026". The published timestamp column shows a date/time value.

---

## 8. Part 7 — Public Verification

**Who:** Clerk or Communications staff  
**Duration:** ~5 minutes  
**System path:** `/public` (public portal)

---

### Step 7.1 — Verify the public portal

Open the public portal at `/public`.

**What to confirm is visible:**

1. `Regular Council Meeting - April 10, 2026` appears in the meetings list.
2. The meeting row shows a published status.
3. Clicking the meeting shows the published agenda with all five staff report items.
4. The published minutes are accessible.
5. The three adopted resolutions are listed.

> **📷 Screenshot reference:** `06-public-portal-results.png`  
> **Annotation callout:** The public portal shows the full meeting package. The meetings list includes "Regular Council Meeting - April 10, 2026" with a published badge. The meeting detail view shows the agenda tab with all sections visible including Staff Reports and Correspondence. The resolutions section shows three adopted resolutions.

**What to verify if the public portal is blank:**

1. Meeting publish status is `PUBLISHED`.
2. Agenda publish status is `PUBLISHED`.
3. Minutes publish status is `PUBLISHED`.
4. The meeting is not marked In Camera.

---

## 9. Quick Reference

### Training record IDs

| Record | ID |
|--------|-----|
| Meeting | `b05bb225-35d7-4e4a-807a-dcfff1526058` |
| Prior meeting | `1744ae28-9f0e-48ee-85d0-26ccea4fd65f` |
| Agenda | `79d26046-9437-4661-a3a3-adc64b18b4a0` |
| Workflow config | `a9183e7f-c27f-4823-b735-3013470cdc76` |
| Minutes | `381e2415-b2fe-4245-868c-2b3e6a7d98eb` |

### Report numbers and IDs

| Report | Number | Training IDs |
|--------|--------|--------------|
| Financial Plan Amendment | `FIN-2026-014` | Various (see DB) |
| Asset Management Framework | `ENG-2026-021` | Various (see DB) |
| Fleet Replacement Tender | `OPS-2026-009` | Various (see DB) |
| Accessibility Improvements | `REC-2026-006` | Various (see DB) |
| Fire Services Update | `FIRE-2026-004` | Various (see DB) |

### Resolution numbers

| Resolution | Number |
|------------|--------|
| Asset Management Framework | `RC-2026-0410-03-40443` |
| Fleet Replacement Tender | `RC-2026-0410-04-40443` |
| Accessibility Improvements | `RC-2026-0410-05-40443` |

### Agenda sections checklist

- [ ] Call to Order
- [ ] Approval of Agenda
- [ ] Disclosure of Pecuniary Interest
- [ ] Adoption of Previous Minutes
- [ ] Staff Reports and Correspondence
- [ ] Bylaws
- [ ] Confirming Bylaw
- [ ] Adjournment

### Workflow status reference

| Status | Meaning |
|--------|---------|
| `DRAFT` | Created but not submitted |
| `PENDING_DIRECTOR_APPROVAL` | Awaiting Director review |
| `PENDING_CAO_APPROVAL` | Awaiting CAO review |
| `APPROVED` | Cleared by leadership, ready to publish |
| `PUBLISHED` | Live / public |
| `IN_PROGRESS` | Meeting is currently active |
| `FINALIZED` | Minutes draft complete |
| `ADOPTED` | Minutes / resolution approved by council |
| `SCHEDULED` | Meeting created, not yet started |
| `COMPLETED` | Meeting officially closed |

---

## 10. Troubleshooting

### Cannot see the training meeting in the app

**Cause:** The backend may be running in a temporary in-memory session that was cleaned up.

**Fix:** Restart the backend in normal persistent mode:

```bash
cd backend
npm run start:dev
```

Then open `http://localhost:5173/meetings` and search for "April 10".

---

### Public portal shows blank for the April 10 meeting

**Check in order:**

1. Meeting record: publish status must be `PUBLISHED`
2. Agenda record: publish status must be `PUBLISHED`
3. Minutes record: publish status must be `PUBLISHED`
4. Meeting is not marked In Camera

If any of the above are `DRAFT` or missing, correct that record first.

---

### Agenda approval fails

The Director and CAO cannot approve an agenda that is missing required sections. Verify all eight sections from the checklist above are present with exactly those titles before submitting.

---

### Report attachment upload fails

In the training environment, local attachment storage is enabled. If an upload fails:

1. Confirm the file exists in `assets/attachments/`.
2. Confirm the backend has write access to `backend/.local-report-attachments/`.
3. Check the browser console for upload errors.
4. If using SharePoint in production, verify Microsoft Graph credentials are configured.

---

### Motion cannot be created

Verify:

1. The meeting status is `IN_PROGRESS`.
2. The user creating the motion has the `motion.propose` permission.
3. The mover is a member of council present at the meeting (validated by the API).

---

### Resolution status stays PENDING after adoption

The resolution must be explicitly set to `ADOPTED` after the council vote. Simply creating the resolution record is not enough — use the **Adopt** or **Mark Adopted** action on the resolution record to advance it from `PENDING` to `ADOPTED`.

---

### Minutes cannot be finalized

Minutes must have attendance recorded and at least one motion entry before they can be finalized. If finalization is blocked, check that:

1. At least one attendee is marked present.
2. Motion outcomes are recorded.

---

*End of Staff Training Packet — Regular Council Meeting, April 10, 2026*
