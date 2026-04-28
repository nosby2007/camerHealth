# Endpoint Hardening Phase 12

## Scope

Phase 12 hardens existing server-side endpoints without changing frontend clinical workflows:

- POST /api/bootstrap/facility-admin
- POST /api/admin/staff/invite

No deployment and no production migration apply are performed in this phase.

## Hardening Summary

### 1) Idempotency

Implemented scaffold in:

- api/_lib/idempotency.js

Behavior:

- Accepts Idempotency-Key or X-Idempotency-Key request header.
- Computes request hash from request payload.
- Detects key reuse with different payload and returns conflict.
- Detects in-progress duplicate requests.
- Replays completed response safely for duplicate retry.
- Tries DB-backed storage through public.idempotency_keys.
- Falls back to in-memory storage when table is missing (safe for local/staging only).

### 2) Validation and Input Hardening

Implemented in:

- api/_lib/request.js

Added:

- bootstrap payload validator
- invite payload validator
- email validation
- role enum validation
- password complexity check
- phone normalization
- staffCode validation
- facility name validation
- explicit rejection of client-provided facility_id/facilityId in invite payload

### 3) Correlation and Error Envelopes

Implemented in:

- api/_lib/correlation.js
- api/_lib/http.js

Added:

- X-Correlation-Id support
- correlationId returned in error/success payloads
- safer normalized error envelopes
- explicit service-unavailable response path for missing backend env

### 4) Compensation and Partial Failure Handling

Bootstrap endpoint in api/bootstrap/facility-admin.js:

- If auth user creation succeeds but facility insert fails:
  - attempts auth user delete rollback
  - writes BOOTSTRAP_FAILED audit event
- If facility creation succeeds but admin staff profile fails:
  - marks created facility inactive
  - attempts auth user delete rollback
  - writes BOOTSTRAP_FAILED audit event
- Never returns silent success on partial completion.

Invite endpoint in api/admin/staff/invite.js:

- If Auth invite/user creation succeeds but staff profile insert fails:
  - attempts auth user delete rollback for newly created auth users
  - writes AUTH_STAFF_INVITE_FAILED audit event
- If invite lifecycle persistence fails:
  - returns explicit INVITE_STATE_PERSIST_FAILED
  - records failure audit event.

### 5) Audit Reliability

Hardened in:

- api/_lib/audit.js

Added:

- metadata sanitization (blocks password/token/secret/key fields)
- correlation_id inclusion
- endpoint inclusion
- actor_auth_user_id inclusion
- optional strict mode for compliance-critical writes

### 6) Invite Lifecycle Formalization

Implemented in endpoint logic and migration draft:

- pending
- accepted
- revoked
- expired
- failed

DB structure draft:

- supabase/migrations/20260427_005_endpoint_hardening_draft.sql
- public.pending_staff_invites

Lifecycle event coverage:

- AUTH_STAFF_INVITED
- AUTH_STAFF_INVITE_RESENT
- AUTH_STAFF_INVITE_FAILED
- AUTH_ACCOUNT_CREATED

Note:

- AUTH_STAFF_INVITE_REVOKED and accepted transition handlers require dedicated revoke/accept endpoints or background jobs in a later phase.

### 7) Rate Limit Strategy

Current implementation:

- multi-key memory limiter (IP + email scopes)
- strategy abstraction in api/_lib/rate-limit.js

Production requirement (not yet implemented):

- distributed limiter (Redis/Upstash/Vercel KV/Supabase-backed)
- controls per endpoint, per IP, per email, and per facility

## Security Guarantees In This Phase

- Supabase service role key remains server-side only.
- No frontend code paths call Supabase Admin APIs.
- Invite facility scope is derived from authenticated caller profile.
- Client cannot choose target facility_id for staff invite.
- Endpoint responses avoid leaking Supabase internals and secrets.

## Remaining Risks

- Cross-system transaction atomicity remains best-effort due to Supabase Auth Admin API + DB split.
- Idempotency in production still requires the idempotency_keys table to be created and monitored.
- Invite revoke/accept/expiry automation needs dedicated endpoint/job completion.
- Distributed rate limiting still pending.
