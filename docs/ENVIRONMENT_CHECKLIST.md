# Environment Checklist

Use this checklist to keep local/dev/staging values aligned.

## Backend Required

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `MUNICIPAL_PROFILE_ID` (defaults to `BC_BASELINE`)
- `NOTIFICATION_CHANNELS` (comma-separated, defaults to `IN_APP`)
- `NOTIFICATION_WEBHOOK_URL` (required when `WEBHOOK` channel is enabled)
- `NOTIFICATION_TEAMS_WEBHOOK_URL` (required when `TEAMS` channel is enabled)
- `NOTIFICATION_EMAIL_WEBHOOK_URL` (required when `EMAIL` channel is enabled)
- `NOTIFICATION_RETRY_MAX_ATTEMPTS` (defaults to `3`)
- `NOTIFICATION_RETRY_BASE_DELAY_MS` (defaults to `400`)
- `PUBLIC_DIGEST_SCHEDULER_ENABLED` (defaults to `true`)
- `PUBLIC_DIGEST_SCHEDULER_INTERVAL_MS` (defaults to `600000`, min effective interval `60000`)
- `AUTH_BYPASS_ENABLED` (must be `false` outside local dev)
- `MS_TENANT_ID`
- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_API_AUDIENCE`

## Frontend Required

- `VITE_API_BASE_URL`
- `VITE_MS_CLIENT_ID`
- `VITE_MS_TENANT_ID`
- `VITE_MS_SCOPE`
- `VITE_AUTH_BYPASS` (must be `false` outside local dev)

## Word/SharePoint Import Requirements

- For direct upload imports, frontend sends `contentBase64`.
- For SharePoint retrieval imports, backend requires:
  - Microsoft client credentials (`MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_TENANT_ID`)
  - Drive and item ids from SharePoint (`sharePointDriveId`, `sharePointItemId`)

## Safety Rules

- Never enable bypass auth in production.
- Keep `.env` files out of commits.
- Validate database connectivity before running workflow UAT.

## Local Runtime Validation

- Confirm PostgreSQL is listening:
  - `pg_isready -h localhost -p 5432`
- Confirm app DB connection works:
  - `psql "$DATABASE_URL" -c "SELECT NOW();"`
- Confirm backend health after boot:
  - `curl http://localhost:3000/api/health`
- Confirm frontend origin is allowed by backend CORS:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  - `http://127.0.0.1:4173`

## Common Local Issue: Cannot Create Meeting

- Symptom: UI save fails but backend appears running.
- Check order:
  1. confirm logged in via dev bypass (`VITE_AUTH_BYPASS=true` and Use Local Dev Login)
  2. confirm backend is running on expected port (`3000`)
  3. confirm API base URL matches backend (`VITE_API_BASE_URL=http://localhost:3000/api`)
  4. confirm browser request is not blocked by CORS
