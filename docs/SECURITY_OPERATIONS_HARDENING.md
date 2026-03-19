# Security and Operations Hardening

## Authentication and Bypass

- `AUTH_BYPASS_ENABLED` and `VITE_AUTH_BYPASS` must remain `false` outside local development.
- Production startup should fail if bypass is enabled.

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
