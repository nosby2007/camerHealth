# Auth Claims Audit (Phase 4)

## Scope
This document captures the Phase 4 authentication and claims audit for branch `chore/v1-release-hardening`.

Constraints respected during the audit:
- No deployment
- No frontend page changes
- No Vuex store changes
- No schema/RLS SQL changes
- No localStorage removal

---

## 1) Current Prototype Auth Flow

### Clinical flow (facility layer)
1. Facility registration is handled in-app and persisted locally.
2. Admin and staff credentials are stored in browser local storage (hashed password, role, facility linkage).
3. Login validates credentials against locally stored staff records.
4. Session state is persisted in browser session storage.
5. Route gating is handled by frontend middleware (role/path checks).

### Ministry flow (national layer)
1. Ministry login uses a form-driven flow that writes role/session context into client state.
2. Role and related context are persisted in local storage for session continuity.
3. Route gating remains frontend middleware driven.

### Additional legacy auth elements
1. Cognito/Amplify hooks still exist in the codebase and can set/read auth state.
2. Supabase client is configured, but Supabase Auth is not the current source of truth for clinical sign-in.

---

## 2) Current Auth Risks
1. Credentials and authorization context are client-controlled in local/session storage.
2. Client-side hashing is used as the main credential safeguard in prototype mode.
3. Multiple auth paradigms coexist (local clinical auth + ministry flow + legacy Cognito hooks), increasing drift risk.
4. Frontend middleware acts as the effective security boundary today, which is insufficient for production.
5. No guaranteed server-side identity-to-role-to-facility chain for all authenticated requests.

---

## 3) Claim Gap Analysis
The current RLS draft expects reliable security context:
- `staff_profile_id`
- `facility_id`
- `role`
- `auth.uid()` and stable user identity

Current prototype gaps:
1. No consistent JWT claim issuance pipeline for `staff_profile_id`, `facility_id`, `role`.
2. No guaranteed `auth.uid()` principal for clinical login path.
3. Role/facility are currently state values, not cryptographically asserted claims.
4. Staff identifiers in prototype are business IDs, not guaranteed UUID foreign keys tied to auth principal.

---

## 4) Why Current localStorage/sessionStorage Auth Cannot Support Production RLS
1. RLS depends on trusted DB-visible identity context; browser storage values are mutable by the client.
2. Local/session storage state is not an authenticated token boundary and cannot be trusted for tenant isolation.
3. Production RLS requires identity claims carried by validated JWT/session context, not frontend state.
4. Client-only role checks can be bypassed; database policies must enforce authorization independently.

---

## 5) Recommended Production Identity Model
Canonical relationship:
- `auth.users.id` -> `staff_profiles.auth_user_id` -> `staff_profiles.facility_id` -> `staff_profiles.role`

Model rules:
1. `auth.users.id` is the principal identity.
2. `staff_profiles.auth_user_id` is unique and mandatory for active staff accounts.
3. `facility_id` and `role` are resolved from `staff_profiles` (DB source of truth).
4. JWT custom claims may include role/facility hints, but DB mapping remains authoritative.

---

## 6) Recommended Transitional Compatibility Model
Goal: migrate safely without breaking current operations.

1. Keep prototype auth path temporarily for controlled compatibility.
2. Introduce Supabase Auth sign-in in parallel behind feature gating.
3. Create mapping layer between current staff IDs and future `staff_profiles` UUID records.
4. Run parity checks (role/facility/session) between old and new paths.
5. Switch authorization trust to DB-backed identity once parity is validated.
6. Decommission legacy/local auth paths only after soak testing and rollback readiness.

---

## 7) Recommended Password Reset Model
1. Use Supabase Auth reset/recovery flow as primary mechanism.
2. Keep reset execution server/identity-provider managed.
3. Record reset events in audit logs (requested, completed, failed).
4. Do not rely on client-side password hashing as production safeguard.

---

## 8) Recommended Account Deactivation/Reactivation Model
1. Account status lives in `staff_profiles.status`.
2. Deactivation blocks access through DB policy checks and login profile checks.
3. Reactivation is admin-controlled and audited.
4. Deactivation/reactivation should not depend on frontend-only toggles.

---

## 9) Required Audit Events
Minimum auth/security events to record:
1. `AUTH_LOGIN_SUCCESS`
2. `AUTH_LOGIN_FAILURE_INVALID_CREDENTIALS`
3. `AUTH_LOGIN_FAILURE_DISABLED_ACCOUNT`
4. `AUTH_LOGOUT`
5. `AUTH_PASSWORD_RESET_REQUESTED`
6. `AUTH_PASSWORD_RESET_COMPLETED`
7. `AUTH_PASSWORD_RESET_FAILED`
8. `AUTH_ACCOUNT_DEACTIVATED`
9. `AUTH_ACCOUNT_REACTIVATED`
10. `AUTH_ROLE_CHANGED`
11. `AUTH_FACILITY_MEMBERSHIP_CHANGED`

---

## 10) Proposed Migration Sequence
1. Add `auth_user_id` linkage on staff profile model (staging first).
2. Backfill/link existing staff identities to auth principals.
3. Introduce Supabase Auth login path and profile resolution.
4. Ensure RLS context can be resolved from authenticated identity for all protected tables.
5. Validate tenant isolation and role enforcement in staging.
6. Enable production path after parity and rollback checks.
7. Retire local auth dependencies after cutover stability window.

---

## 11) Files to Modify in the Next Phase
Authentication and identity transition files:
1. `store/auth.js`
2. `store/facility.js`
3. `middleware/auth.js`
4. `pages/login.vue`
5. `pages/register.vue`
6. `pages/ministry-login.vue`
7. `plugins/auth.js`
8. `plugins/amplify.js`
9. `plugins/amplify.auth.js`
10. `plugins/supabase.js`
11. `nuxt.config.js`
12. New DB migration(s) for auth linkage and constraints

---

## 12) Files Not to Touch Yet
To reduce migration risk during auth cutover planning:
1. Clinical UI pages under `pages/clinical/**`
2. Clinical domain workflow logic in `store/clinical.js`
3. Existing schema draft SQL (`20260427_001_v1_schema_draft.sql`)
4. Existing RLS draft SQL (`20260427_002_v1_rls_policies_draft.sql`)

---

## Security Guardrails
1. Do not store bearer tokens in localStorage.
2. Do not treat client-side password hashing as production-grade authentication.
3. Do not expose Supabase service role keys in frontend/runtime client code.
4. Do not rely on frontend middleware as the security boundary.
5. Keep database RLS and server-side identity verification as the authoritative controls.
