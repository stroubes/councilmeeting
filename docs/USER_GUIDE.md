# Council Meeting Management System — User Guide

District of Sooke internal platform for managing the full lifecycle of council meetings — from creation through agenda building, staff reports, approvals, live presentations, minutes, and public disclosure.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Meeting Creation](#2-meeting-creation)
3. [Agenda Building](#3-agenda-building)
4. [Staff Reports & DOCX Import](#4-staff-reports--docx-import)
5. [Attachments & Supporting Documents](#5-attachments--supporting-documents)
6. [Director Review & Approval Queue](#6-director-review--approval-queue)
7. [CAO Approval Queue](#7-cao-approval-queue)
8. [Agenda Publishing](#8-agenda-publishing)
9. [Live Meeting — Presentations & Motions](#9-live-meeting--presentations--motions)
10. [Resolutions Register](#10-resolutions-register)
11. [Minutes](#11-minutes)
12. [Public Portal & Citizen Access](#12-public-portal--citizen-access)
13. [In-Camera Meetings](#13-in-camera-meetings)
14. [Quick Reference: Statuses & Workflow States](#14-quick-reference--statuses--workflow-states)

---

## 1. System Overview

### What This System Does

The CMMS handles the complete lifecycle of a council meeting:

```
[Creation] → [Agenda Build] → [Staff Reports] → [Approvals] → [Publish] → [Live Meeting] → [Minutes] → [Public Portal]
```

Every action — adding an agenda item, uploading a presentation, casting a vote — flows through a defined workflow state. The system tracks who did what, when, and maintains a complete audit trail.

### Key Concepts

| Concept | Description |
|---|---|
| **Meeting** | A scheduled council session with a type (Regular, Special, Committee), date/time, and location |
| **Agenda** | The ordered list of items for a meeting, published to the public before the meeting |
| **Staff Report** | A formal document (often DOCX) prepared by staff for council consideration |
| **Bylaw** | A specific type of staff report that requires three readings and adoption |
| **Resolution** | A formal motion passed by council, tracked in the resolutions register |
| **Minutes** | The official written record of what happened at a meeting |
| **Presentation** | A PDF slideshow displayed on the public screen during a meeting |
| **In-Camera** | A closed session (no public access) for confidential matters |

### Roles & Permissions

| Role | Capabilities |
|---|---|
| **Clerk** | Full meeting lifecycle management, agenda building, live meeting control, minutes |
| **Director** | Review and approve staff reports within their department |
| **CAO** | Final approval of all staff reports before agenda publishing |
| **Mayor/Council** | View agenda, see presentations, cast votes, view resolutions |
| **Public** | View published agendas, live meeting stream, adopted minutes, resolutions |

---

## 2. Meeting Creation

### Creating a New Meeting

1. Navigate to **Meetings** in the sidebar
2. Click **New Meeting**
3. Fill in the required fields:

| Field | Description |
|---|---|
| **Meeting Type** | Regular, Special, or Committee of the Whole |
| **Title** | Descriptive title (e.g., "Regular Council Meeting — April 2026") |
| **Date & Time** | Scheduled start time |
| **Location** | Council chamber or alternative venue |
| **Description** | Optional context |
| **Public Portal** | Toggle whether this meeting appears on the public portal |

### Meeting Types

| Type | Code | Behavior |
|---|---|---|
| Regular Council | `REGULAR` | Standard public meeting |
| Special Council | `SPECIAL` | Called for specific purpose |
| Committee of the Whole | `COMMITTEE` | Informal, no binding votes |

### Meeting Statuses

| Status | Meaning |
|---|---|
| **DRAFT** | Being built, not visible to public |
| **SCHEDULED** | Confirmed, on calendar |
| **IN_PROGRESS** | Meeting is currently happening |
| **COMPLETED** | Meeting has ended |
| **CANCELLED** | Meeting was cancelled |

### Setting Up an In-Camera Meeting

1. Create the meeting as normal
2. Toggle **In-Camera** to `true`
3. Add in-camera agenda items (see [In-Camera Meetings](#13-in-camera-meetings))

In-camera meetings do not appear on the public portal, even if Public Portal is toggled on.

### Calendar View

The Meetings list defaults to a **calendar view** showing all scheduled meetings as events. You can:

- Click a meeting to open its details
- Filter by meeting type
- Jump to a specific date
- Toggle between calendar and list view

---

## 3. Agenda Building

### The Agenda Workflow

Every agenda item passes through a defined workflow before it appears on the published agenda:

```
DRAFT → UNDER_REVIEW → CHANGES_REQUESTED → APPROVED → ON_AGENDA → PUBLISHED
```

### Adding an Agenda Item

1. Open a meeting and navigate to the **Agenda** tab
2. Click **Add Agenda Item**
3. Select the **item type**:

| Item Type | Description |
|---|---|
| **Delegation** | A presenter addressing council |
| **Staff Report** | Formal staff memorandum |
| **Bylaw** | Proposed legislation requiring readings |
| **Resolution** | A motion for council to adopt |
| **Correspondence** | Incoming or outgoing letters |
| **Notice of Motion** | A motion to be introduced at a future meeting |
| **Committee Report** | Report from a committee |
| **Information Item** | Items for awareness, no vote |
| **Closed Session** | In-camera item |

4. Set the **title** and **description**
5. Assign a **priority** (controls display order on the agenda)
6. Click **Save**

### Agenda Item Statuses

| Status | Meaning |
|---|---|
| **DRAFT** | Item is being prepared |
| **UNDER_REVIEW** | Submitted for review (Director/CAO) |
| **CHANGES_REQUESTED** | Reviewer sent it back for revisions |
| **APPROVED** | Cleared for the agenda |
| **ON_AGENDA** | Confirmed for this meeting |
| **PUBLISHED** | Included in the publicly posted agenda |

### Reordering Agenda Items

Drag and drop items to reorder. The order on the agenda is the order council considers items.

### Agenda Templates

Use templates to pre-populate a new meeting's agenda with standing items:

1. Navigate to **Admin → Templates**
2. Create a template with your standard agenda structure
3. When creating a new meeting, select the template to apply it

### Publishing the Agenda

Once all items are approved and ordered:

1. Click **Publish Agenda** on the meeting's Agenda tab
2. Confirm the action
3. The agenda becomes visible on the **Public Portal**
4. A notification is sent to subscribed citizens (if subscriptions are configured)

---

## 4. Staff Reports & DOCX Import

### What Is a Staff Report?

A staff report is a formal document prepared by municipal staff for council's consideration. It includes:

- **Subject** and **author**
- **Recommendations** for council action
- **Background** context
- **Analysis** and **financial implications**
- **Options** considered

### Creating a Staff Report

1. Add an agenda item of type **Staff Report**
2. Fill in the report metadata:
   - **Report Title**
   - **Author** (staff member name)
   - **Department**
   - **Date**
3. Write or paste the report content into the **report content** field
4. Add **recommendations** (the proposed resolution text council will vote on)

### Importing from DOCX

The system supports importing existing Word documents as staff reports:

1. Add an agenda item of type **Staff Report**
2. Click **Import DOCX** on the report
3. Upload the `.docx` file
4. The system parses the document and extracts:
   - Title
   - Author
   - Body content
   - Recommendations section (identified by heading)
5. Review and correct any parsing errors
6. Click **Save**

> **Note**: DOCX import works best with consistently formatted documents using standard heading styles.

### Bylaw Workflow

A **Bylaw** is a specific type of staff report with additional workflow requirements:

| Step | Description |
|---|---|
| 1. First Reading | Bylaw introduced to council |
| 2. Second Reading | Council agrees to proceed |
| 3. Committee Report | Review by standing committee |
| 4. Third Reading | Final chance for amendments |
| 5. Adoption | Bylaw is legally enacted (signed by Mayor and Clerk) |

The system tracks each reading separately. A bylaw cannot proceed to a reading until the previous step is recorded.

### Report Status After Import

After DOCX import, the report enters the standard workflow:

```
DRAFT → UNDER_REVIEW → (CHANGES_REQUESTED)* → APPROVED → ON_AGENDA → PUBLISHED
```

---

## 5. Attachments & Supporting Documents

### Adding Attachments

Any agenda item can have supporting documents attached:

1. Open an agenda item
2. Click **Attachments**
3. Upload files (PDF, DOCX, XLSX, images)
4. Add a **description** for each attachment (e.g., "Figure 1: Site Plan")

### Attachment Types

| Type | Use Case |
|---|---|
| **Staff Report Attachment** | Maps, plans, detailed analysis referenced in the report |
| **Presentation** | PDF slides for the live meeting display |
| **Minutes Attachment** | Sign-in sheets, handouts distributed at meeting |
| **General Attachment** | Any other supporting document |

### Presentations

Presentations are PDF slideshows displayed on the **public meeting screen** during the live session.

**Uploading a Presentation:**

1. Add a **Presentation** attachment to an agenda item
2. Upload the PDF file
3. The system extracts slide count automatically
4. During the live meeting, the clerk selects which presentation to display

> **Best Practice**: Keep presentation PDFs under 20 MB for reliable rendering on the public display screen.

---

## 6. Director Review & Approval Queue

### The Review Workflow

Before a staff report reaches the CAO, it must be reviewed and approved by the appropriate **Director**:

```
DRAFT → UNDER_REVIEW → CHANGES_REQUESTED → APPROVED
```

### Director Approval Queue

Directors see all reports pending their review in the **Approvals** section:

1. Navigate to **Approvals** in the sidebar
2. See the list of reports assigned to your department
3. Click a report to review its full content
4. Choose an action:

| Action | Result |
|---|---|
| **Approve** | Report moves to CAO queue |
| **Request Changes** | Report returned to author with comments |
| **Reject** | Report is removed from workflow |

### Review Comments

When requesting changes, provide specific feedback explaining what needs to be revised. The author sees these comments and can resubmit after making corrections.

---

## 7. CAO Approval Queue

### Final Approval Before Agenda

The CAO (Chief Administrative Officer) is the final internal approver before reports are placed on the published agenda.

```
UNDER_REVIEW → APPROVED → ON_AGENDA
```

### CAO Actions

| Action | Result |
|---|---|
| **Approve** | Report is queued for the agenda |
| **Request Changes** | Returned to Director with comments |
| **Remove from Agenda** | Report is held for a future meeting |

### Multiple Directors

If a report spans multiple departments, all relevant Directors must approve before the CAO sees it. The CAO approval queue shows which departments have signed off and which are still pending.

---

## 8. Agenda Publishing

### Publishing

When the clerk is satisfied that the agenda is complete:

1. Open the meeting and go to the **Agenda** tab
2. Confirm all items are in **APPROVED** or **ON_AGENDA** status
3. Click **Publish Agenda**
4. The agenda immediately becomes available on the **Public Portal**

### What Happens on Publish

| System | Behavior |
|---|---|
| **Public Portal** | Agenda visible to all visitors |
| **Email notifications** | Sent to meeting subscribers |
| **Agenda status** | All items → `PUBLISHED` |
| **Meeting status** | Changes to `SCHEDULED` if not already |

### Unpublishing

If changes are needed after publishing (rare), the clerk can **Unpublish Agenda**. All items revert to `ON_AGENDA` status. Re-publish after corrections.

> **Note**: Unpublishing after a meeting has started can cause confusion for the public. Use only when absolutely necessary.

---

## 9. Live Meeting — Presentations & Motions

### The Live Meeting Screen

During a council meeting, the clerk uses the **Live Meeting Control** interface to manage what is displayed on the public screen.

Navigate to the meeting and click **Live Meeting** to open the control panel.

### Display States

The public screen cycles through these states during a meeting:

| State | Description |
|---|---|
| **Welcome / Agenda** | Shows the meeting title and agenda item list |
| **Presentation** | Displays the current PDF presentation |
| **Motion** | Shows the current resolution/motion text |
| **Vote** | Shows voting results (roll call or show of hands) |

### Managing Presentations

**Starting a Presentation:**

1. Select an agenda item that has a presentation attached
2. Click **Display Presentation**
3. The public screen shows the first slide of the PDF

**Advancing Slides:**

1. While a presentation is displayed, use the control panel to:
   - **Next Slide** — advance one slide
   - **Previous Slide** — go back
   - **Jump to Slide** — go to a specific slide number
2. The public screen updates in **real-time** via SSE (Server-Sent Events)
3. A slide counter shows "Slide X of Y" on the public display

**Ending a Presentation:**

Click **Clear Display** to return to the Welcome/Agenda state.

### Motions & Resolutions

**Displaying a Motion:**

1. Select an agenda item with a resolution
2. Click **Display Motion**
3. The full motion text appears on the public screen

### Voting

**Recording a Vote:**

1. With a motion displayed, click **Start Vote**
2. Choose the voting method:

| Method | Use Case |
|---|---|
| **Roll Call** | Each council member's name is called; they state "Yes" or "No" |
| **Show of Hands** | Counted manually by the clerk |

3. For roll call: record each member's vote in the system as they respond
4. The system calculates the result automatically
5. Results are displayed on the public screen

### Vote Display

The public screen shows:

- Each council member's name
- Their individual vote (Yes / No / Abstain)
- The final tally
- Whether the motion **Passed** or **Failed**

### Real-Time Updates

The public meeting screen updates **automatically** via SSE — no page refresh needed:

- Slide changes appear instantly
- Motion text changes instantly
- Vote results appear instantly
- The welcome/agenda view refreshes as items are called

---

## 10. Resolutions Register

### What Is the Resolutions Register?

The resolutions register is a running list of all formal motions passed by council, searchable and filterable by meeting, date, and subject.

### How Resolutions Are Created

A resolution is automatically created in the register when:

1. A motion is voted on and **Passed** during a live meeting
2. The clerk records the vote result
3. The resolution is linked to the originating agenda item and meeting

### Resolution Record Contents

Each resolution record includes:

| Field | Description |
|---|---|
| **Resolution Number** | Auto-generated sequential number |
| **Meeting** | Which meeting it was passed at |
| **Date** | Date of the meeting |
| **Subject** | Brief description of the motion |
| **Motion Text** | Full wording of the resolution |
| **Passed/Failed** | Outcome |
| **Vote Tally** | Yes / No / Abstain counts |

### Searching Resolutions

Use the **Resolutions** page to search past resolutions:

- Filter by meeting type
- Filter by date range
- Search by keyword in subject or motion text
- Export results to PDF or CSV

### Linking to Bylaws

Bylaws that are adopted create a resolution record automatically. The resolution number is referenced on the bylaw record for audit traceability.

---

## 11. Minutes

### Minutes Workflow

The minutes of a meeting go through their own workflow:

```
DRAFT → FINALIZED → ADOPTED → PUBLISHED
```

### Drafting Minutes

After a meeting ends:

1. Navigate to the meeting and click the **Minutes** tab
2. Create a minutes record for the meeting
3. The clerk records:
   - **Call to Order** time
   - **Attendees** (Mayor, Council, Staff)
   - **Absent** members
   - **Adoption** of previous meeting's minutes
   - Summary of each agenda item discussion
   - **Motions** passed (with vote counts)
   - **Recess** times
   - **Adjournment** time

### Closed Session Recording

If an in-camera session was held, the clerk records:

- The fact that a closed session occurred
- The time it began and ended
- A general description of topics discussed (not sensitive specifics)
- Motions passed in-camera

> **Note**: Detailed in-camera minutes are stored separately and are not accessible via the public portal.

### Finalizing Minutes

When the draft is complete:

1. Click **Finalize**
2. The minutes enter `FINALIZED` status
3. The Mayor reviews and signs off

### Adopting Minutes

At the subsequent meeting, council formally **adopts** the minutes of the previous meeting:

1. The minutes appear on the agenda as an **Information Item**
2. Council can request corrections before adoption
3. The clerk records the adoption motion
4. Status changes to `ADOPTED`

### Publishing Minutes

Once adopted, click **Publish** to make the minutes available on the **Public Portal**. Published minutes are accessible to all visitors without authentication.

### Attachments to Minutes

Supporting documents can be attached to minutes:

- Sign-in sheets
- Distributed handouts
- Additional exhibits referenced in discussion

---

## 12. Public Portal & Citizen Access

### Public Portal Overview

The public portal (`/public`) is the unauthenticated face of the system. Citizens can:

- View upcoming and past meeting agendas
- Watch the live meeting stream (during active meetings)
- View adopted minutes
- Search resolutions
- Subscribe to notifications for specific meetings or meeting types

### What the Public Sees

| Section | Content |
|---|---|
| **Upcoming Meetings** | List of scheduled meetings with date, time, location |
| **Meeting Detail** | Full agenda with all items and attachments |
| **Live Meeting** | Real-time display of presentations, motions, votes |
| **Minutes** | Adopted minutes from past meetings |
| **Resolutions** | Searchable register of passed motions |

### What the Public Does NOT See

- **In-camera meetings** (even if the meeting exists in the system)
- **In-camera agenda items**
- **Draft or unreviewed reports**
- **Staff reports that have not been published**
- **Director/CAO review comments** (internal notes)

### Citizen Subscriptions

Citizens can subscribe to receive email notifications when:

| Subscription Type | Triggers When |
|---|---|
| **Specific Meeting** | Agenda is published for that meeting |
| **All Meetings** | Any meeting agenda is published |
| **Meeting Type** | A meeting of a specific type is scheduled (e.g., all Regular Council meetings) |

Subscriptions are managed through the public portal. Citizens create an account, select their subscriptions, and receive emails when relevant content is published.

### Meeting Alerts

During a live meeting, subscribed citizens may receive an alert that the meeting has started. They can then navigate to the live meeting view to watch in real-time.

---

## 13. In-Camera Meetings

### What Is In-Camera?

"In-camera" means a **closed session** — no public attendance or access. Items discussed in-camera are typically:

- Litigation or potential litigation
- Labour negotiations or employee matters
- Land acquisition negotiations
- Advice subject to solicitor-client privilege

### Creating an In-Camera Meeting

1. Create the meeting as normal
2. Toggle **In-Camera** to `true`
3. The meeting will not appear on the public portal

### In-Camera Agenda Items

Add agenda items with type **Closed Session** or **In-Camera Report**. These items:

- Are only visible to authenticated staff
- Do not appear on the public agenda
- Cannot have presentations published to the public screen

### In-Camera Minutes

In-camera minutes are recorded separately from the public minutes:

1. Create a minutes record as normal
2. Mark the in-camera section with a header
3. Record general descriptions of topics discussed
4. Do not record sensitive specifics
5. Store the in-camera minutes as a **separate attachment** marked as confidential

### In-Camera Motions

Motions passed in-camera are recorded in the minutes but **do not appear in the public resolutions register** until they are officially released (some in-camera motions become public after being acted upon).

---

## 14. Quick Reference: Statuses & Workflow States

### Meeting Statuses

| Status | Code |
|---|---|
| Draft | `DRAFT` |
| Scheduled | `SCHEDULED` |
| In Progress | `IN_PROGRESS` |
| Completed | `COMPLETED` |
| Cancelled | `CANCELLED` |

### Agenda Item Workflow States

```
DRAFT
  ↓
UNDER_REVIEW
  ↓ (Director approves)
APPROVED ────→ CHANGES_REQUESTED (rejection loop)
  ↓                      ↑
APPROVED ←───────────────┘ (resubmit after changes)
  ↓
ON_AGENDA
  ↓ (Clerk publishes)
PUBLISHED
```

### Staff Report / Bylaw Statuses

| Status | Meaning |
|---|---|
| `DRAFT` | Being written |
| `UNDER_REVIEW` | With Director |
| `CHANGES_REQUESTED` | Returned for revision |
| `APPROVED` | Cleared by Director |
| `FINAL_APPROVED` | Cleared by CAO |
| `ON_AGENDA` | Confirmed for meeting |
| `PUBLISHED` | On public agenda |

### Bylaw Reading Stages

| Stage | Required Before |
|---|---|
| First Reading | — |
| Second Reading | First Reading |
| Third Reading | Second Reading |
| Adopted | Third Reading |

### Minutes Statuses

| Status | Meaning |
|---|---|
| `DRAFT` | Being written |
| `FINALIZED` | Complete, awaiting adoption |
| `ADOPTED` | Passed by council at subsequent meeting |
| `PUBLISHED` | On public portal |

### Vote Results

| Result | Meaning |
|---|---|
| **PASSED** | Majority voted in favour |
| **FAILED** | Majority voted against |
| **CARRIED** | Same as passed (synonym) |
| **DEFEATED** | Same as failed (synonym) |

---

## Appendix: Key UI Locations

| Action | Where to Find It |
|---|---|
| Create a meeting | Sidebar → Meetings → New Meeting |
| Add agenda item | Open meeting → Agenda tab → Add Item |
| Upload presentation | Open agenda item → Attachments → Upload PDF |
| Director approval queue | Sidebar → Approvals |
| CAO approval queue | Sidebar → CAO Approvals |
| Publish agenda | Open meeting → Agenda tab → Publish |
| Live meeting control | Open meeting → Live Meeting button |
| Record a vote | Live meeting view → Start Vote |
| Resolutions register | Sidebar → Resolutions |
| Draft minutes | Open meeting → Minutes tab |
| Public portal | `/public` (unauthenticated) |
| Live meeting (public) | `/public/live-meeting/:id` |
| Admin templates | Sidebar → Admin → Templates |

---

*Last updated: 2026-04-02 — Council Meeting Management System v1.0*
