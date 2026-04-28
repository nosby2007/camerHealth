# Auth Migration State Map (Phase 6)

## Scope and Constraints
This document defines the state mapping from the current prototype authentication model to the target Supabase Auth production model.

Constraints respected:
- No deployment
- No frontend page modifications
- No Vuex store modifications
- No schema/RLS/auth-linkage SQL modifications
- No localStorage removal yet
- Documentation only

Referenced implementation files:
- store/auth.js
- store/facility.js
- middleware/auth.js
- pages/login.vue
- pages/register.vue
- pages/ministry-login.vue
- plugins/auth.js
- plugins/amplify.js
- plugins/amplify.auth.js
- plugins/supabase.js
- nuxt.config.js

---

## Current Prototype Flow

### Clinical flow (prototype)
1. Facility and staff accounts are created in browser state and persisted in localStorage.
2. Login validates credentials against local staff records in store/facility.js.
3. Session is persisted in sessionStorage through store/auth.js.
4. Role/path access is enforced by frontend middleware in middleware/auth.js.

### Ministry flow (prototype)
1. Ministry role is selected in pages/ministry-login.vue.
2. Session role/context is set in store/auth.js and persisted to localStorage.
3. Route access remains frontend middleware controlled.

### Parallel legacy auth hooks
1. plugins/auth.js and plugins/amplify.auth.js call auth/load from AWS Amplify context.
2. plugins/amplify.js configures Cognito.
3. plugins/supabase.js creates Supabase client but does not establish Supabase Auth as source of truth for login.

---

## Target v1.0 Production Flow

Identity chain for authorization:
auth.users.id -> staff_profiles.auth_user_id -> staff_profiles.facility_id -> staff_profiles.role

Authoritative controls:
1. Authentication principal from Supabase Auth (auth.users.id).
2. Staff membership and role from staff_profiles.
3. Facility isolation and role authorization enforced by database RLS policies.
4. Frontend middleware remains UX navigation helper only.

---

## Transitional Compatibility Flow

1. Keep prototype flows available behind controlled compatibility behavior.
2. Introduce Supabase Auth sign-in path in parallel.
3. Map active staff rows to auth.users.id in phases.
4. Resolve role and facility from database lookup for migrated users.
5. Keep legacy local state only as temporary fallback until full cutover.
6. Remove fallback paths after parity validation and stabilization period.

---

## State Mapping Matrix

Classification legend:
1. Keep temporarily
2. Replace with Supabase Auth
3. Replace with staff_profiles
4. Derive from RLS/database lookup
5. Remove after migration
6. Unsafe and must not be used in production

| State Item | Current Source | Target Source | Classification | Notes |
|---|---|---|---|---|
| Current user id | store/auth.js -> staffId or Cognito user object | auth.users.id | 2 | Prototype identity is mixed and not canonical. |
| Staff id (business) | store/facility.js staff.id and store/auth.js staffId | staff_profiles.staff_code (business id), linked to auth.users.id | 3 | Keep business staff code, but not as auth principal. |
| Staff profile id | Not present in app state as DB UUID | staff_profiles.id | 4 | Resolve by auth.users.id lookup in DB. |
| Auth user id | Not present for clinical local auth | staff_profiles.auth_user_id -> auth.users.id | 2 | Phase 5 linkage migration defines this relation. |
| Facility id / institution id | store/auth.js institution, facilityId; store/facility.js facility.id | staff_profiles.facility_id and facilities.id | 4 | Institution display can remain UI field but authorization must use facility UUID. |
| Role | store/auth.js role (client state) | staff_profiles.role with optional JWT role hint | 4 | DB role is source of truth for authorization. |
| Permissions | middleware/auth.js route lists | RLS policies + DB role/facility context | 4 | Frontend middleware kept as UX helper only. |
| Session state | sessionStorage camero_session; localStorage ministry keys | Supabase managed session + server-trusted JWT | 2 | Do not store bearer tokens in localStorage. |
| Login status | store/auth.js isAuthenticated | Supabase Auth session validity + profile status check | 4 | Must include active profile check before app authorization. |
| Account status | store/facility.js active boolean | staff_profiles.status | 3 | status values must gate authorization and login completion. |
| Password reset state | facility action resetStaffPassword (client-side hash update) | Supabase Auth recovery flow + audit logs | 2 | Client-side hash reset is prototype only. |
| Audit events | store/facility.js local auditLog | audit_logs table (DB, append-oriented) | 3 | Login/logout/failure events must be server-authoritative. |
| Ministry role state | store/auth.js + localStorage keys | Supabase Auth identity + ministry profile mapping | 2 | Current free-entry role setting is not production-safe. |
| Clinical role state | store/auth.js role | staff_profiles.role | 3 | Must be validated in DB and consumed by RLS. |

---

## Why Current localStorage/sessionStorage Auth Cannot Support Production RLS

1. Browser storage values are mutable by end users and are not trusted identity context.
2. RLS requires verifiable claims and stable authenticated principal context at DB level.
3. Frontend route guards cannot guarantee data protection.
4. Client-side password hashing is not a production authentication boundary.

---

## Cutover Checklist

1. Confirm all active staff are represented in staff_profiles with valid facility_id and role.
2. Link active staff profiles to auth.users.id via auth_user_id.
3. Validate one active auth_user_id to one active profile.
4. Validate role and facility resolution from DB for migrated users.
5. Validate RLS tenant isolation in staging with cross-facility tests.
6. Validate inactive/suspended profiles are denied authorization.
7. Enable Supabase Auth login as primary path.
8. Keep legacy fallback only for controlled rollback window.
9. Remove fallback paths after stability and audit verification.

---

## Rollback Strategy

1. Keep feature-flagged dual auth paths during transition.
2. If incident occurs, route login temporarily to compatibility path while preserving database writes/audits.
3. Do not drop auth_user_id linkage structures during first rollback; isolate rollback to app login orchestration.
4. Preserve audit logging continuity during fallback.
5. Re-run mapping and parity checks before reattempting cutover.

---

## Files to Modify in Next Coding Phase

Authentication and identity transition scope:
1. store/auth.js
2. store/facility.js
3. middleware/auth.js
4. pages/login.vue
5. pages/register.vue
6. pages/ministry-login.vue
7. plugins/auth.js
8. plugins/amplify.js
9. plugins/amplify.auth.js
10. plugins/supabase.js
11. nuxt.config.js
12. New migration and/or server-side auth orchestration files as needed for claim/profile synchronization

---

## Files Not to Touch Yet

1. Clinical frontend pages under pages/clinical
2. store/clinical.js
3. Existing schema draft SQL migration (20260427_001)
4. Existing RLS draft SQL migration (20260427_002)
5. Existing auth linkage SQL migration (20260427_003)

---

## Risks if Frontend Migration Starts Too Early

1. UI role assumptions may diverge from DB role source of truth.
2. Partial migration can produce split authorization paths and inconsistent access decisions.
3. Token/session mishandling risk increases if frontend changes precede identity model stabilization.
4. Audit trails may become incomplete if login lifecycle events are not migrated together.
5. Cross-facility leakage risk increases if frontend behavior changes before RLS-enforced backend resolution is fully validated.

---

## Security Guardrails (Non-Negotiable)

1. Do not store auth tokens in localStorage.
2. Do not use client-side password hashing as production safeguard.
3. Do not expose Supabase service role keys in frontend runtime.
4. Do not treat frontend middleware as real security boundary.
5. Keep DB RLS and verified identity linkage as the authoritative control layer.
