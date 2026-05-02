# QA Phase 16 Staging Evidence Runbook

## Scope

This runbook defines controlled staging execution and evidence capture for Phase 15 multi-scope helper shadow validation.

This phase is documentation and QA packaging only.

This runbook does not:

- deploy
- apply migrations to production
- modify app/frontend code
- modify clinical pages
- modify store/clinical.js
- modify active RLS policies
- modify patient/clinical table policies
- force organization_id as required
- replace facility_id

## 1) Staging Prerequisites

1. Approved Phase 15 artifacts are present:
- docs/security/multiscope-rls-shadow-test-plan.md
- docs/qa/QA-phase-15-multiscope-shadow-validation-checklist.md
- supabase/tests/phase15_multiscope_helper_validation.sql
2. Staging database access is approved for tester and reviewer.
3. Test window is scheduled with rollback owner assigned.
4. Evidence repository path is prepared: docs/qa/evidence/phase16/<run_id>/.

## 2) Required Environment Confirmation

Confirm and record before execution:

1. Environment name is staging (not production).
2. Git branch is chore/v1-release-hardening.
3. Git commit SHA is captured.
4. Supabase project reference is captured.
5. Execution timestamp and tester identity are captured.

## 3) Required Migrations Present But Not Production-Applied

Verify files exist in repository:

1. supabase/migrations/20260427_006_multi_tenant_superadmin_draft.sql
2. supabase/migrations/20260427_007_multiscope_rls_helpers_draft.sql

Verification requirements:

1. Mark as present in codebase.
2. Mark as not applied to production.
3. Mark active patient/clinical policies unchanged.

## 4) Required Test Users And Roles

Provision staging-only users for:

1. SUPER_ADMIN
2. SUPPORT_ADMIN
3. ORG_ADMIN
4. REGIONAL_ADMIN
5. DISTRICT_ADMIN
6. FACILITY_ADMIN
7. ADMIN
8. DOCTOR
9. NURSE
10. LAB
11. IMAGING
12. AUDITOR

Each user requires:

1. Unique auth user id.
2. Linked staff profile where applicable.
3. Explicit assignment scope fixture.

## 5) Required Organizations/Units/Facilities Fixture Map

Required minimum fixture map:

1. Public hierarchy:
- MINSANTE
- Regional Delegation Centre
- District
- Hospital/CMA
2. Private hierarchy:
- Private Group
- City/Region Unit
- Clinic Site A
- Clinic Site B
3. Unrelated hierarchy:
- Unrelated Organization
- Unrelated Facility

Record all ids in the execution report.

## 6) Required staff_assignments Fixture Map

Create and verify fixtures for:

1. Platform assignments (including SUPER_ADMIN and SUPPORT_ADMIN pathways).
2. Organization assignments.
3. Unit assignments (regional and district).
4. Facility assignments.
5. Department assignments.
6. Inactive assignment sample.
7. Expired assignment sample.
8. Expected denial fixtures for unrelated tenant paths.

## 7) Execute Phase 15 SQL Validation Script Safely

Safety sequence:

1. Open staging SQL console only.
2. Confirm current database reference before execution.
3. Open supabase/tests/phase15_multiscope_helper_validation.sql.
4. Replace placeholders with staging fixture ids.
5. Execute in controlled batches by role/scope group.
6. Keep begin/rollback workflow for dry execution where possible.
7. Do not convert this script into production migration.

Execution order recommendation:

1. Baseline helper existence checks.
2. Platform roles.
3. Organization and unit scopes.
4. Facility and department scopes.
5. Cross-tenant denials.
6. Inactive/expired assignment checks.
7. Null organization_id compatibility checks.
8. Facility_id compatibility checks.
9. Break-glass eligibility checks.

## 8) Evidence Capture

Capture per test block:

1. Run id.
2. Date/time.
3. Environment and project reference.
4. Tester identity.
5. Actor role and scope fixture.
6. Query text.
7. Expected result.
8. Actual result.
9. Pass/fail status.
10. Evidence link (screenshot/log/query output).

## 9) Pass/Fail Recording Rules

1. Pass only when expected equals actual.
2. Any mismatch is fail.
3. Any cross-tenant false positive is automatic blocker.
4. Any inconclusive output is fail-pending-retest.
5. All failures require issue id and triage owner.

## 10) Failure Severity Classification

Use strict severity:

1. blocker:
- cross-tenant false positive
- break-glass eligibility granted outside approved platform path
- helper grants elevated access outside expected scope
2. high:
- repeated false negatives for legitimate admin scopes
- inactive/expired assignments incorrectly accepted
3. medium:
- partial matrix mismatch with no tenant boundary breach
- evidence gaps requiring rerun
4. low:
- formatting/reporting issues without result ambiguity

## 11) Triage Cross-Tenant False Positives

Immediate actions:

1. Stop validation run.
2. Mark no-go provisional.
3. Capture exact query, actor, target ids, and output.
4. Verify assignment graph for actor and target tenant lineage.
5. Check for fixture contamination (wrong org/unit/facility linkage).
6. Reproduce with clean session and re-run targeted block.

Escalation:

1. Open blocker ticket.
2. Assign security reviewer.
3. Block any policy cutover planning until resolved.

## 12) Triage False Negatives

Steps:

1. Confirm expected matrix row and required_roles input.
2. Confirm assignment status is active and not expired.
3. Confirm target scope lineage (org -> unit -> facility -> department).
4. Re-run single-case query with explicit fixture ids.
5. Classify severity high or medium depending on breadth.

## 13) Required Screenshots/Logs/Query Outputs

Minimum evidence package:

1. Screenshot of environment confirmation (staging reference).
2. Query output export for each matrix block.
3. Query output export for cross-tenant denial block.
4. Query output export for break-glass block.
5. Query output export for null organization_id compatibility block.
6. Query output export for facility_id compatibility block.
7. Failure screenshots for each failed case.
8. Consolidated issue log with severity and owner.

## 14) Reviewer Signoff Section

Reviewer must confirm:

1. Dataset version and fixture lineage are valid.
2. Matrix execution is complete.
3. Evidence package is complete and traceable.
4. Severity classifications are appropriate.
5. Open issues are documented with owners.

## 15) Go/No-Go Decision Section

Go decision conditions:

1. No blocker issues.
2. Cross-tenant denial tests all pass.
3. Break-glass eligibility tests match expected constraints.
4. Compatibility checks for null organization_id and facility_id model pass.
5. Reviewer signoff complete.

No-Go decision conditions:

1. Any blocker issue exists.
2. Any unresolved high issue affecting scope correctness.
3. Incomplete evidence package.

## 16) Rollback/Cleanup Instructions

Cleanup after run:

1. Revoke temporary test assignments not needed after validation.
2. Deactivate or archive staging test users according to QA policy.
3. Remove temporary fixture data if environment reset is required.
4. Preserve evidence artifacts and report templates in docs/qa/evidence/phase16/.
5. Confirm no persistent policy changes were made.
