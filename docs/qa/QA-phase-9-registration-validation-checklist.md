# QA Phase 9: Facility Registration Validation Checklist

## Scope

Validate the non-breaking Phase 9 facility registration flow behind `ENABLE_SUPABASE_AUTH`.

## Preconditions

- `ENABLE_SUPABASE_AUTH=false` for legacy regression checks.
- `ENABLE_SUPABASE_AUTH=true` for Supabase-backed registration checks.
- `SUPABASE_URL` and `SUPABASE_KEY` configured with a staging project only.
- No service-role keys exposed in browser env files.

## Legacy Regression Checks

- With `ENABLE_SUPABASE_AUTH=false`, submit a valid facility registration in [pages/register.vue](pages/register.vue).
- Confirm localStorage keys `camero_facility`, `camero_staff`, and `camero_audit` are still created.
- Confirm redirect to `/login` still works.
- Confirm admin login still works through the prototype flow.

## Supabase Registration Checks

- With `ENABLE_SUPABASE_AUTH=true`, confirm [pages/register.vue](pages/register.vue) shows the compatibility warning banner.
- Submit a valid registration and confirm [store/facility.js](store/facility.js) calls the Supabase-backed action instead of the prototype-only action.
- Verify the flow does not store Supabase tokens in localStorage.
- Verify successful sign-up creates or attempts to create:
  - `auth.users` account for the administrator.
  - `public.facilities` row.
  - `public.staff_profiles` row linked by `auth_user_id`.
  - `public.facility_settings` default row.
- Verify the normalized facility/admin fallback record is still written locally only after backend registration completes.
- Confirm redirect to `/login` still occurs on successful backend-backed registration.

## Error Handling Checks

- Duplicate admin email returns a user-facing `DUPLICATE_EMAIL` style message.
- Duplicate staff code returns a user-facing duplicate staff code message.
- Missing Supabase config returns a user-facing configuration error.
- Network failure returns a user-facing availability error.
- RLS/permission failure returns a user-facing bootstrap/backend-permission message.

## Confirmation Mode Checks

- If Supabase email confirmation is enabled and no session is returned from sign-up, confirm the page shows a `pending confirmation` message and does not mark setup complete locally.
- Confirm the page does not redirect to `/login` in that pending-confirmation state.

## Known Risk To Track

- The current draft RLS model in [supabase/migrations/20260427_002_v1_rls_policies_draft.sql](supabase/migrations/20260427_002_v1_rls_policies_draft.sql) does not provide a clean first-facility bootstrap path when strict claims-based RLS is enforced. Phase 9 therefore remains a compatibility scaffold, not the final production bootstrap architecture.