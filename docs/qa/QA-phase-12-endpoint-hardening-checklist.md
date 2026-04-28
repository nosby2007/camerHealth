# QA Phase 12 Endpoint Hardening Checklist

## Scope

Validate hardening for:

- POST /api/bootstrap/facility-admin
- POST /api/admin/staff/invite

## Preconditions

- ENABLE_SUPABASE_AUTH remains false by default.
- SUPABASE_URL configured server-side.
- SUPABASE_SERVICE_ROLE_KEY configured server-side only.
- FACILITY_BOOTSTRAP_ENDPOINT and STAFF_INVITE_ENDPOINT set only in staging.
- No production deployment.

## Bootstrap Endpoint Checks

- Missing required field returns INVALID_BOOTSTRAP_PAYLOAD.
- Invalid email rejected.
- Weak password rejected.
- Duplicate facility conflict handled.
- Duplicate admin profile conflict handled.
- Supabase auth create failure returns safe BOOTSTRAP_AUTH_CREATE_FAILED.
- Partial failure after auth user creation triggers rollback attempt.
- Partial failure after facility creation marks facility inactive.
- Response includes correlationId.
- Repeated request with same idempotency key and same payload replays response.
- Reused idempotency key with different payload returns conflict.

## Staff Invite Endpoint Checks

- Missing token rejected.
- Non-admin caller rejected.
- Inactive caller rejected.
- Invalid role rejected.
- Client supplied facility_id/facilityId rejected.
- Duplicate email/staffCode conflict handled.
- Existing pending invite triggers resend event behavior.
- Expired pending invite transitions to expired before resend.
- Response includes invite status and correlationId.
- Repeated request with same idempotency key and same payload replays response.
- Reused idempotency key with different payload returns conflict.

## Audit Checks

- Success and failure paths emit audit records.
- Metadata excludes password/token/secret/key fields.
- Correlation ID is present in metadata.
- Endpoint and actor identifiers are captured when available.

## Rate Limit Checks

- Bootstrap endpoint rate limits by IP and email.
- Invite endpoint rate limits by IP and email.
- Retry-After header present on 429 responses.

## Regression Checks

- ENABLE_SUPABASE_AUTH=false legacy behavior still intact.
- Clinical pages unaffected.
- store/clinical.js unchanged.

## Production Readiness Gate

Must be completed before production cutover:

- Apply additive draft migration in staging only.
- Replace memory limiter with distributed limiter.
- Validate end-to-end invite lifecycle transitions for accepted/revoked/expired via dedicated endpoints/jobs.
- Execute integration test plan and capture evidence.
