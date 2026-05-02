# Bootstrap And Staff Invite Backend Design (Phase 11)

## Scope

This phase designs and scaffolds secure server-side endpoints required for Supabase Auth transition completion:

- `POST /api/bootstrap/facility-admin`
- `POST /api/admin/staff/invite`

No deployment is performed in this phase.

## Architecture Recommendation

Recommended location for this repository state: **Vercel serverless API routes** in `api/`.

Why:

- The project already includes [vercel.json](vercel.json) and static deployment shape.
- Server-only env variables can be injected safely by Vercel for API runtime.
- Keeps service-role usage fully server-side.
- Avoids introducing Nuxt serverMiddleware complexity into a SPA/static target.

Alternative options documented but not selected for now:

- Nuxt `serverMiddleware`: workable but adds coupling to Nuxt runtime and deployment mode.
- Supabase Edge Functions: viable for production hardening but requires separate deployment and auth plumbing outside this repo.

## Endpoint 1: POST /api/bootstrap/facility-admin

### Purpose

Create the first facility and first ADMIN profile in a controlled server-side flow when strict RLS cannot permit self-bootstrap from a brand-new user.

### Security Model

- Request body validated server-side.
- Service role key used only inside server runtime.
- No client-provided `facility_id` or `role` trusted.
- Safe response only (no tokens, no key material, no raw provider internals).
- Rate-limited.
- Audits both success and failure attempts.

### Current Scaffold Behavior

- Validates required bootstrap fields.
- Creates or reuses auth user by email via admin API.
- Creates facility row.
- Creates ADMIN staff profile linked through `auth_user_id`.
- Sets profile status to `active` when email confirmed, otherwise `pending_email_confirmation`.
- Creates default `facility_settings`.
- Inserts audit events `FACILITY_REGISTERED` and `ACCOUNT_CREATED`.

### File

- [api/bootstrap/facility-admin.js](api/bootstrap/facility-admin.js)

## Endpoint 2: POST /api/admin/staff/invite

### Purpose

Allow only active facility ADMIN users to invite and provision staff profiles in their own facility.

### Security Model

- Requires bearer auth token.
- Resolves caller from `auth.users.id` to `staff_profiles.auth_user_id` server-side.
- Requires caller role `ADMIN` and status `active`.
- Uses caller facility from DB, never from client request.
- Validates allowed role values: `ADMIN`, `DOCTOR`, `NURSE`, `LAB`, `IMAGING`.
- Invokes Supabase Auth invitation or user lookup server-side only.
- Creates `staff_profiles` in caller facility only.
- Audits success (`AUTH_STAFF_INVITED`) and failures (`AUTH_STAFF_INVITE_FAILED`).
- Returns safe response only.

### File

- [api/admin/staff/invite.js](api/admin/staff/invite.js)

## Shared Backend Modules

- [api/_lib/env.js](api/_lib/env.js) server env guards
- [api/_lib/http.js](api/_lib/http.js) normalized HTTP responses
- [api/_lib/request.js](api/_lib/request.js) validation/normalization helpers
- [api/_lib/rate-limit.js](api/_lib/rate-limit.js) in-memory rate limit scaffold
- [api/_lib/supabase-admin.js](api/_lib/supabase-admin.js) service-role admin client
- [api/_lib/caller-context.js](api/_lib/caller-context.js) caller identity and admin gate
- [api/_lib/audit.js](api/_lib/audit.js) best-effort audit insert helper

## Bootstrap Risk Explanation

Strict RLS based on claims can block first-user bootstrap because the first admin has no profile and no facility context yet. This is a bootstrap paradox. The server-side bootstrap endpoint breaks that deadlock by performing a controlled privileged transaction path under backend governance, then handing control back to normal RLS-constrained flows.

## Staff Invite Security Notes

- Cross-facility invite is blocked by deriving facility from caller profile.
- Non-admin invite attempts are blocked with explicit authorization errors.
- Client cannot escalate role through arbitrary payload values beyond allowed set.
- Service role usage is isolated to server runtime.

## Rate Limit Requirements

Current scaffold uses per-IP in-memory rate limiting for local/staging protection.

Production requirement:

- Replace with durable distributed rate limiting (for example Upstash Redis or equivalent).
- Add abuse monitoring and alerting.

## Routing Requirement

To avoid SPA fallback swallowing API calls, [vercel.json](vercel.json) includes an explicit route rule for `/api/*` before SPA catch-all.

## Environment Variables Required

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ENABLE_SUPABASE_AUTH` (remains false by default)
- `STAFF_INVITE_ENDPOINT`
- `FACILITY_BOOTSTRAP_ENDPOINT`

## Non-Goals In This Phase

- No frontend cutover to production endpoint behavior.
- No migration apply in production.
- No removal of localStorage prototype flows.
- No changes to clinical pages.

## Remaining Risks

- Bootstrap endpoint currently does not execute true DB transaction across auth + multiple table inserts; partial failure compensation strategy is still required.
- In-memory rate limiting is not horizontally durable.
- Invite flow currently models `pending_email_confirmation`; final onboarding UX and resend/revoke lifecycle still need dedicated backend states.
- Audit insertion is best-effort; production may require fail-closed behavior for compliance-critical actions.