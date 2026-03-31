# Security and Operations Hardening

## Authentication and Bypass

- `AUTH_BYPASS_ENABLED` and `VITE_AUTH_BYPASS` must remain `false` outside local development.
- Backend startup fails if bypass is enabled in an environment not listed in `AUTH_BYPASS_ALLOWED_ENVS`.
- Dev bypass requires explicit `X-Dev-Bypass: true` per request and is never driven by a hardcoded bearer token.

## API Abuse Controls

- Global API rate limiting is enabled at startup with scoped ceilings:
  - auth (`/api/auth*`): `RATE_LIMIT_AUTH_MAX`
  - public (`/api/public*`): `RATE_LIMIT_PUBLIC_MAX`
  - all other API traffic: `RATE_LIMIT_GENERAL_MAX`
- Window is controlled by `RATE_LIMIT_WINDOW_MS`.
- Exceeded limits return HTTP `429` and `Retry-After`.

## CSRF Header Requirement

- State-changing API requests must include `X-CMMS-CSRF`.
- Frontend emits this header automatically for `POST`, `PATCH`, and `DELETE` requests.
- Missing header is rejected with HTTP `403`.

## Token Validation

- Validate issuer and audience for Microsoft JWTs.
- Ensure `MS_TENANT_ID`, `MS_CLIENT_ID`, and `MS_API_AUDIENCE` are populated in non-dev environments.

## Data and Audit

- Audit logs are recorded for report/agenda/minutes transitions and admin role actions.
- Confirm `app_audit_logs` table retention and backup policy.

## Operational Monitoring

- Monitor `/api/health` and module health endpoints.
- Track database availability; repositories fallback to memory when DB is unavailable.
- Treat memory fallback in non-dev as incident-level warning.

## Secret Management

- Keep `.env` out of source control.
- Rotate Microsoft client secrets through managed secret stores.
