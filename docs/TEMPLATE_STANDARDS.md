# Template Standards

This document defines the standardized template behavior currently implemented for agenda and staff-report authoring.

## Purpose

- Remove freehand section naming for core governance documents.
- Standardize section order and naming conventions across meeting types.
- Support predictable downstream assembly (agenda package generation, report consistency, and document export).

## Staff Report Template Presets

Staff report templates use a fixed dropdown section catalog in Admin Portal.

1. Header/Information
2. Recommendation
3. Purpose
4. Background
5. Discussion/Analysis
6. Financial Implications
7. Communication/Engagement
8. Alternative Recommendations
9. Conclusion/Next Steps

Notes:

- Admins can add sections one-by-one from the dropdown or bulk-add with **Add Standard Sections**.
- Preset-driven fields auto-populate title/type/description and required-state guidance.
- Staff-report templates support Word export for distribution and reuse.

## Agenda Template Profiles

Agenda templates use a profile-driven dropdown catalog in Admin Portal.

### 1) Regular Council (`REGULAR_COUNCIL`)

- Call to Order
- Land Acknowledgement (optional)
- Approval of Agenda
- Disclosure of Pecuniary Interest
- Adoption of Previous Minutes
- Delegations and Presentations (optional)
- Consent Agenda (optional)
- Staff Reports and Correspondence
- Bylaws
- Motions and Notices of Motion (optional)
- New Business (optional)
- Closed Session (if required, optional)
- Confirming Bylaw
- Adjournment

### 2) Special Council (`SPECIAL_COUNCIL`)

- Call to Order
- Approval of Agenda
- Disclosure of Pecuniary Interest
- Special Business
- Closed Session (if required, optional)
- Confirming Bylaw
- Adjournment

### 3) Committee of the Whole (`COMMITTEE_OF_WHOLE`)

- Call to Order
- Approval of Agenda
- Disclosure of Pecuniary Interest
- Delegations and Presentations (optional)
- Staff Reports and Discussion Items
- Recommendations to Council
- Other Business (optional)
- Adjournment

### 4) In-Camera (`IN_CAMERA`)

- Call to Order
- Approval of In-Camera Agenda
- Disclosure of Pecuniary Interest
- Closed Session Authority
- In-Camera Discussion Items
- Rise and Report
- Adjournment

Notes:

- Admins can bulk-add with **Add [Profile] Sections**.
- Duplicate section insertion is prevented by section key/title checks.
- Agenda templates are internal assembly artifacts and do not expose Word export in Admin Portal.

## Auto-Inference Rules (Agenda Profile)

When an agenda template is selected in Admin Portal, profile is inferred from template name/code:

- `IN_CAMERA` if name/code includes: `in camera`, `in-camera`, `incamera`, or `closed`
- `COMMITTEE_OF_WHOLE` if includes: `committee of the whole`, `c.o.w`, or `cow`
- `SPECIAL_COUNCIL` if includes: `special`
- otherwise defaults to `REGULAR_COUNCIL`

## Suggested Agenda Template Codes

Create Template now suggests standardized codes for agenda meeting type:

- `REGULAR_COUNCIL`
- `SPECIAL_COUNCIL`
- `COMMITTEE_OF_WHOLE`
- `IN_CAMERA`

## Integration Behavior

- Creating an agenda with `templateId` auto-seeds agenda items in template order.
- Creating/editing a staff report with `templateId` persists report-template linkage.
- Report attachments support supporting documents (PDF, PPT, DOCX, etc.) through SharePoint-backed metadata.

## Governance Notes

- Presets are intended to reflect common Canadian municipal procedure patterns.
- Municipalities may adjust optional sections or wording to align with local procedure bylaws.
