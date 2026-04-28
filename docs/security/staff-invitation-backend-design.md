# Staff Invitation Backend Design

## Objective

Phase 10 moves staff onboarding away from browser-created passwords and into a secure backend-managed invitation flow. The frontend must only submit invitation intent; it must never mint privileged users, use service-role credentials, or persist privileged tokens in browser storage.

## Why Backend Is Required

- Browser code cannot safely hold the Supabase service role key.
- Invitation issuance must enforce facility-admin authorization on the server.
- Email invite lifecycle, audit persistence, and duplicate checks must be authoritative.
- The current claims-based RLS draft does not solve first-user bootstrap or admin claim minting by itself.

## Proposed Flow

1. Authenticated facility admin signs in through Supabase Auth compatibility mode.
2. Frontend posts invite intent to a backend endpoint such as `/api/admin/staff/invite`.
3. Backend validates caller identity, facility scope, and ADMIN role.
4. Backend creates a pending invite record and sends a Supabase Auth invite or controlled onboarding email.
5. Backend creates or prepares the `staff_profiles` row in a controlled transaction.
6. Backend writes an immutable audit event.
7. Invitee accepts invite, sets credentials, and completes activation.

## Backend Responsibilities

- Verify caller JWT and resolve the acting `staff_profiles` row.
- Enforce `role === ADMIN` and facility scoping.
- Reject duplicate `email`, `staffCode`, and active invite collisions.
- Create pending invite record with expiry and one-time token reference.
- Create or upsert `staff_profiles` entry in `inactive` or `pending` state.
- Emit audit log entry with actor, facility, invite target, and outcome.
- Return only safe metadata to the frontend.

## Suggested Endpoint Contract

### Request

```json
{
  "email": "nurse@example.org",
  "firstName": "Alice",
  "lastName": "Nfor",
  "role": "NURSE",
  "staffCode": "NUR-204",
  "phone": "+237600000000",
  "title": "Senior Nurse",
  "department": "Maternity"
}
```

### Success Response

```json
{
  "status": "invited",
  "inviteId": "uuid",
  "email": "nurse@example.org",
  "staffCode": "NUR-204",
  "expiresAt": "2026-05-01T12:00:00.000Z"
}
```

### Error Model

- `400 INVALID_INVITE_REQUEST`
- `403 INVITE_NOT_ALLOWED`
- `404 BACKEND_INVITE_UNAVAILABLE`
- `409 INVITE_CONFLICT`
- `500 INVITE_BACKEND_ERROR`

## Data Model Additions

Recommended new table:

- `public.pending_staff_invites`

Suggested columns:

- `id uuid primary key`
- `facility_id uuid not null`
- `email text not null`
- `staff_code text not null`
- `role text not null`
- `first_name text not null`
- `last_name text`
- `phone text`
- `title text`
- `department text`
- `invited_by_staff_id uuid not null`
- `status text check (status in ('pending', 'accepted', 'expired', 'revoked'))`
- `expires_at timestamptz not null`
- `accepted_at timestamptz`
- `metadata jsonb`

## Frontend Scope In This Repo

Current scaffold files:

- [services/admin/staff-invitation.service.js](services/admin/staff-invitation.service.js)
- [pages/admin/staff.vue](pages/admin/staff.vue)
- [store/facility.js](store/facility.js)

Current frontend behavior:

- When `ENABLE_SUPABASE_AUTH=false`, the existing local staff-account prototype remains unchanged.
- When `ENABLE_SUPABASE_AUTH=true`, the create form switches to invitation mode and stops asking for a browser-set initial password.
- If `STAFF_INVITE_ENDPOINT` is unset, the UI fails with a clear pending-backend message instead of silently falling back to insecure local account creation.

## Security Requirements

- No service-role key in Nuxt public runtime config.
- No admin provisioning from the browser.
- No localStorage persistence of Supabase access or refresh tokens.
- Audit every invite creation, resend, revoke, and acceptance.
- Enforce short-lived invites and one-time consumption.
- Normalize email and staff code server-side before uniqueness checks.

## Open Risks

- Final production rollout still needs a server implementation for invitation issuance.
- Final production rollout still needs JWT claim strategy alignment with the RLS draft.
- Facility bootstrap for the first admin should ultimately move to a backend-controlled transaction rather than pure browser orchestration.