# QA Phase 11: Bootstrap And Staff Endpoint Checklist

## Scope

Validate secure server-side scaffolding for:

- `POST /api/bootstrap/facility-admin`
- `POST /api/admin/staff/invite`

## Preconditions

- `ENABLE_SUPABASE_AUTH=false` by default in env.
- Server env includes `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- `STAFF_INVITE_ENDPOINT` and `FACILITY_BOOTSTRAP_ENDPOINT` configured only in staging when actively testing.
- No service role key exposed in browser runtime.

## Static Safety Checks

- Confirm service role key appears only in server-side files under `api/` and never in pages/plugins/store code.
- Confirm [vercel.json](vercel.json) routes `/api/*` before SPA fallback.
- Confirm no clinical page files were modified in Phase 11.

## Endpoint 1 Validation

- `POST /api/bootstrap/facility-admin` returns `405` for non-POST methods.
- Missing required fields return `400` with `MISSING_REQUIRED_FIELDS`.
- Invalid email returns `400` with `INVALID_ADMIN_EMAIL`.
- Weak password returns `400` with `INVALID_ADMIN_PASSWORD`.
- Valid request returns `201` with safe payload only.
- Verify created `staff_profiles.role = ADMIN`.
- Verify created `staff_profiles.facility_id` matches created facility.
- Verify `facility_settings` upsert occurs.
- Verify audit logs include `FACILITY_REGISTERED` and `ACCOUNT_CREATED`.

## Endpoint 2 Validation

- `POST /api/admin/staff/invite` returns `405` for non-POST methods.
- Missing bearer token returns `401`.
- Invalid token returns `401`.
- Non-admin caller returns `403`.
- Inactive caller returns `403`.
- Missing role/email fields return `400`.
- Unsupported role returns `400` and only allowed role set accepted.
- Valid admin call returns `201` and safe profile response.
- Verify invited profile created in caller facility only.
- Verify cross-facility creation is not possible.
- Verify audit log `AUTH_STAFF_INVITED` on success.
- Verify audit log `AUTH_STAFF_INVITE_FAILED` on failure branches.

## Rate Limit Validation

- Exceed threshold rapidly and verify `429 RATE_LIMITED` response.
- Verify `Retry-After` header is present on rate-limited responses.

## Regression Checks

- With `ENABLE_SUPABASE_AUTH=false`, legacy login/registration prototype remains unchanged.
- Existing localStorage-backed flows still operate.

## Manual Security Review

- Verify endpoint responses do not expose raw auth provider internals, service keys, or stack traces.
- Verify invite endpoint ignores any client attempt to pass alternate `facility_id`.
- Verify audit failures do not leak internal errors to clients.