# Debug Scripts

Ad-hoc Playwright scripts used for local investigation of the live-meeting
display and SSE stream. Not part of the production app or CI pipeline —
these are kept for reference only.

Run individually with, e.g.:

```bash
npx tsx scripts/debug/inspect-sse.ts
```

They hardcode a `MEETING_ID` and local URLs; edit before running.
