# QA Phase 18 Local Readiness Checklist

## Scope

Prepare local readiness artifacts so staging shadow validation can start quickly once access is granted.

This phase is documentation and readiness only.

## Guardrails

- Do not deploy.
- Do not modify clinical pages.
- Do not modify store/clinical.js.
- Do not enable Supabase Auth by default.
- Do not apply migrations to production.
- Do not claim staging validation passed.
- Do not modify active RLS policies.

## 1) Local Build Checklist

1. Confirm working branch is chore/v1-release-hardening.
2. Confirm current commit SHA is recorded in the pending execution report.
3. Run local production build:
- npm run build
4. Record build result, warnings, and timestamp.
5. Confirm no new app code changes are required for Phase 18.

## 2) Local Environment Checklist

1. Confirm local .env values exist for safe local build only.
2. Confirm no staging or production secrets are committed.
3. Confirm Supabase Auth remains disabled by default in runtime behavior.
4. Confirm no production endpoint or production key is configured for local testing.

## 3) Required Supabase Staging Access

Required before Phase 17 execution can move from pending to live:

1. Staging Supabase project reference.
2. Staging SQL console access.
3. Confirmation of staging-only migration status.
4. Access for tester.
5. Access for reviewer.

## 4) Required Vercel Access

If API endpoint validation is needed against staging deployment:

1. Staging Vercel project access.
2. Environment variable visibility appropriate for reviewer role.
3. Endpoint URL list for staging deployment.
4. Permission to inspect logs for API request traces.

## 5) Required Test Fixtures

Required before staging execution:

1. Public hierarchy fixture.
2. Private hierarchy fixture.
3. Unrelated organization fixture.
4. Unrelated facility fixture.
5. Active assignments.
6. Inactive assignments.
7. Expired assignments.
8. Platform role assignments.
9. Organization scope assignments.
10. Unit scope assignments.
11. Facility scope assignments.
12. Department scope assignments.
13. Null organization_id compatibility fixture.

## 6) SQL Scripts To Run In Staging

Primary script:

1. [supabase/tests/phase15_multiscope_helper_validation.sql](supabase/tests/phase15_multiscope_helper_validation.sql)

Supporting migration presence to verify in staging only:

1. [supabase/migrations/20260427_006_multi_tenant_superadmin_draft.sql](supabase/migrations/20260427_006_multi_tenant_superadmin_draft.sql)
2. [supabase/migrations/20260427_007_multiscope_rls_helpers_draft.sql](supabase/migrations/20260427_007_multiscope_rls_helpers_draft.sql)

## 7) API Endpoints To Test Where Applicable

Only where staging deployment access exists and testing is explicitly approved:

1. POST /api/bootstrap/facility-admin
2. POST /api/admin/staff/invite

Purpose:

1. Confirm staging environment routing and log capture.
2. Confirm no unintended regression in hardened API scaffolds.

Note:

1. These endpoint checks do not replace the SQL shadow validation.
2. Do not run against production.

## 8) Expected Evidence To Capture

1. Local build result.
2. Staging environment confirmation screenshot.
3. SQL query output exports for all helper validation blocks.
4. Cross-tenant denial evidence.
5. Break-glass eligibility evidence.
6. Facility-only compatibility evidence.
7. Null organization_id compatibility evidence.
8. API endpoint request/response evidence where applicable.
9. Reviewer signoff evidence.

## 9) No-Go Conditions

1. Staging Supabase access missing.
2. Staging Vercel access missing where API endpoint checks are required.
3. Fixture UUID map missing.
4. Staging migration status not confirmed.
5. Any cross-tenant false positive.
6. Any helper grants elevated access outside expected scope.
7. Incomplete evidence package.

## 10) Go Criteria

1. Local build completed successfully.
2. Staging access and owners assigned.
3. Fixture dataset prepared and mapped.
4. Phase 15 SQL script ready with placeholders resolvable.
5. Evidence capture path and report template ready.
6. No policy changes required to begin shadow execution.

## 11) Rollback Criteria

1. Any blocker identified during staging run preparation.
2. Any incorrect fixture contamination detected.
3. Any sign that staging target may actually be production-linked.
4. Any incomplete review ownership chain.

## 12) Owner Checklist For Manager

1. Assign staging access owner.
2. Assign fixture setup owner.
3. Assign tester.
4. Assign reviewer.
5. Assign security reviewer for blocker/high issues.
6. Assign rollback owner.
7. Confirm test window.
8. Confirm evidence storage location.

## 13) Tasks That Can Continue Locally

1. Verify docs consistency across phases 15-18.
2. Keep command references up to date.
3. Review API endpoint test payload structure from existing docs.
4. Prepare evidence folder structure and naming convention.
5. Confirm build stability with npm run build.
6. Review blocker ownership and escalation paths.

## 14) Tasks Blocked By Staging Access

1. Actual SQL shadow validation execution.
2. Real evidence capture from staging query outputs.
3. Cross-tenant denial verification with real fixture ids.
4. Break-glass verification with real platform_admin fixtures.
5. Final go/no-go signoff for policy cutover readiness.
