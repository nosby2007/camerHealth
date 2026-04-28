# Multi-Scope RLS Shadow Test Plan (Phase 15)

## 1) Shadow Testing Purpose

This phase validates Phase 14 helper functions in shadow mode before any RLS policy cutover.

This phase does not:

- deploy
- apply migrations to production
- activate new RLS policies
- replace existing active RLS policies
- modify patient or clinical table policies
- modify clinical pages or frontend flows
- modify store/clinical.js
- force organization_id as required
- replace facility_id

## 2) Test Dataset Requirements

Staging dataset must include representative records with placeholders only (no production data):

1. Organizations:
- org_a (target organization)
- org_b (unrelated organization)

2. Units in org_a:
- reg_a_1 (regional/delegation unit)
- dist_a_1 (district unit, child of reg_a_1)

3. Facilities:
- fac_a_1 (org_a, reg_a_1/dist_a_1 path)
- fac_a_null_org (organization_id null for compatibility checks)
- fac_b_1 (org_b, unrelated)

4. Departments:
- dep_a_1 (in fac_a_1)
- dep_b_1 (in fac_b_1)

5. Users and assignments:
- one test auth user per role
- one active assignment per target scope under test
- one inactive assignment sample
- one expired assignment sample
- platform_admin rows for SUPER_ADMIN and SUPPORT_ADMIN variants with and without can_break_glass

## 3) Role/Scope Matrix (Assignment Under Test)

Roles covered:

- SUPER_ADMIN
- SUPPORT_ADMIN
- ORG_ADMIN
- REGIONAL_ADMIN
- DISTRICT_ADMIN
- FACILITY_ADMIN
- ADMIN
- DOCTOR
- NURSE
- LAB
- IMAGING
- AUDITOR

Scopes covered:

- platform
- organization
- regional/delegation unit
- district unit
- facility
- department
- unrelated organization
- unrelated facility

## 4) Expected Access Matrix

Legend per line:

- R = can_read_facility_metadata
- M = can_manage_facility
- T = can_troubleshoot_facility
- B = can_break_glass_access
- P = has_platform_role
- O = has_organization_scope
- U = has_unit_scope
- F = has_facility_scope

Value format:

- Y = expected true
- N = expected false

Assumptions for matrix interpretation:

1. Target organization/unit/facility belongs to the same tenant path except rows explicitly marked unrelated.
2. For organization and unit scoped checks, helpers are called with required_roles containing the role under test.
3. organization_id may be null for compatibility facility tests and must not break existing facility_id model.

### SUPER_ADMIN

- platform: Y/Y/Y/Y/Y/Y/Y/Y
- organization: Y/Y/Y/Y/N/Y/Y/Y
- regional/delegation unit: Y/Y/Y/Y/N/Y/Y/Y
- district unit: Y/Y/Y/Y/N/Y/Y/Y
- facility: Y/Y/Y/Y/N/Y/Y/Y
- department: Y/Y/Y/Y/N/Y/Y/Y
- unrelated organization: Y/Y/Y/Y/N/Y/Y/Y
- unrelated facility: Y/Y/Y/Y/N/Y/Y/Y

### SUPPORT_ADMIN

- platform: Y/N/Y/Y/Y/Y/Y/Y
- organization: Y/N/Y/Y/N/Y/Y/Y
- regional/delegation unit: Y/N/Y/Y/N/Y/Y/Y
- district unit: Y/N/Y/Y/N/Y/Y/Y
- facility: Y/N/Y/Y/N/Y/Y/Y
- department: Y/N/Y/Y/N/Y/Y/Y
- unrelated organization: Y/N/Y/Y/N/Y/Y/Y
- unrelated facility: Y/N/Y/Y/N/Y/Y/Y

### ORG_ADMIN

- platform: Y/Y/Y/N/Y/Y/Y/Y
- organization: Y/Y/Y/N/N/Y/Y/Y
- regional/delegation unit: Y/Y/Y/N/N/Y/Y/Y
- district unit: Y/Y/Y/N/N/Y/Y/Y
- facility: Y/Y/Y/N/N/Y/Y/Y
- department: Y/Y/Y/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

### REGIONAL_ADMIN

- platform: Y/Y/Y/N/Y/Y/Y/Y
- organization: Y/Y/Y/N/N/Y/Y/Y
- regional/delegation unit: Y/Y/Y/N/N/Y/Y/Y
- district unit: Y/Y/Y/N/N/Y/Y/Y
- facility: Y/Y/Y/N/N/Y/Y/Y
- department: Y/Y/Y/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

### DISTRICT_ADMIN

- platform: Y/Y/Y/N/Y/Y/Y/Y
- organization: Y/Y/Y/N/N/Y/Y/Y
- regional/delegation unit: N/N/N/N/N/Y/N/N
- district unit: Y/Y/Y/N/N/Y/Y/Y
- facility: Y/Y/Y/N/N/Y/Y/Y
- department: Y/Y/Y/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

### FACILITY_ADMIN

- platform: Y/Y/Y/N/Y/Y/Y/Y
- organization: Y/Y/Y/N/N/Y/Y/Y
- regional/delegation unit: Y/Y/Y/N/N/Y/Y/Y
- district unit: Y/Y/Y/N/N/Y/Y/Y
- facility: Y/Y/Y/N/N/Y/Y/Y
- department: Y/Y/Y/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

### ADMIN

- platform: Y/Y/N/N/Y/Y/Y/Y
- organization: Y/Y/N/N/N/Y/Y/Y
- regional/delegation unit: Y/Y/N/N/N/Y/Y/Y
- district unit: Y/Y/N/N/N/Y/Y/Y
- facility: Y/Y/N/N/N/Y/Y/Y
- department: Y/Y/N/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

### DOCTOR

- platform: N/N/N/N/Y/Y/Y/Y
- organization: N/N/N/N/N/Y/Y/Y
- regional/delegation unit: N/N/N/N/N/Y/Y/Y
- district unit: N/N/N/N/N/Y/Y/Y
- facility: N/N/N/N/N/Y/Y/Y
- department: N/N/N/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

### NURSE

- platform: N/N/N/N/Y/Y/Y/Y
- organization: N/N/N/N/N/Y/Y/Y
- regional/delegation unit: N/N/N/N/N/Y/Y/Y
- district unit: N/N/N/N/N/Y/Y/Y
- facility: N/N/N/N/N/Y/Y/Y
- department: N/N/N/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

### LAB

- platform: N/N/N/N/Y/Y/Y/Y
- organization: N/N/N/N/N/Y/Y/Y
- regional/delegation unit: N/N/N/N/N/Y/Y/Y
- district unit: N/N/N/N/N/Y/Y/Y
- facility: N/N/N/N/N/Y/Y/Y
- department: N/N/N/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

### IMAGING

- platform: N/N/N/N/Y/Y/Y/Y
- organization: N/N/N/N/N/Y/Y/Y
- regional/delegation unit: N/N/N/N/N/Y/Y/Y
- district unit: N/N/N/N/N/Y/Y/Y
- facility: N/N/N/N/N/Y/Y/Y
- department: N/N/N/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

### AUDITOR

- platform: Y/N/Y/N/Y/Y/Y/Y
- organization: Y/N/Y/N/N/Y/Y/Y
- regional/delegation unit: Y/N/Y/N/N/Y/Y/Y
- district unit: Y/N/Y/N/N/Y/Y/Y
- facility: Y/N/Y/N/N/Y/Y/Y
- department: Y/N/Y/N/N/Y/Y/Y
- unrelated organization: N/N/N/N/N/N/N/N
- unrelated facility: N/N/N/N/N/N/N/N

## 5) Cross-Tenant Denial Tests

Required denials in staging:

1. ORG_ADMIN in org_a cannot access org_b facilities.
2. REGIONAL_ADMIN in reg_a_1 cannot access units/facilities in org_b.
3. DISTRICT_ADMIN in dist_a_1 cannot access sibling districts outside assignment chain.
4. FACILITY_ADMIN of fac_a_1 cannot access fac_b_1.
5. Clinical roles cannot acquire metadata/manage/troubleshoot rights through unrelated assignments.

## 6) Break-Glass Eligibility Tests

1. SUPER_ADMIN with can_break_glass true on platform_admins returns true for can_break_glass_access(existing_facility).
2. SUPPORT_ADMIN with can_break_glass true returns true.
3. SUPER_ADMIN or SUPPORT_ADMIN with can_break_glass false returns false.
4. Non-platform roles always return false.
5. Unknown facility id returns false.

## 7) Facility-Only Compatibility Tests

1. Existing facility_id workflows continue to resolve has_facility_scope for direct facility assignments.
2. Facilities with organization_id null do not break helper evaluation.
3. No forced organization_id required in this phase.

## 8) Backfill Validation Tests

1. organization_id and organization_unit_id links match the approved mapping runbook.
2. staff_assignments rows use correct assignment_scope and parent references.
3. Inactive and expired assignments are excluded by current_staff_assignments().
4. Assignment status transitions preserve expected helper outputs.

## 9) Go/No-Go Criteria Before Policy Cutover

Go:

1. Matrix results match expected outcomes for all tested role/scope combinations.
2. Cross-tenant denial tests all pass.
3. Break-glass tests pass exactly as expected.
4. Null organization_id and facility-only compatibility tests pass.
5. No active policy change was required to complete validation.

No-Go:

1. Any cross-tenant denial test fails.
2. Any helper returns elevated access outside expected scope.
3. Any compatibility test fails for existing facility_id model.
4. Evidence capture is incomplete.

## 10) Rollback Criteria

Rollback and rework required if:

1. Helper output diverges from matrix expectations.
2. Assignment quality issues are detected (wrong tenant path, wrong scope level).
3. Break-glass eligibility can be obtained by non-approved role paths.

Rollback actions:

1. Revoke incorrect test assignments.
2. Re-run test script with corrected fixtures.
3. Keep active policies unchanged until a clean shadow pass is recorded.

## 11) Evidence Capture Format For Staging Validation

Capture each execution batch with:

1. Batch id and timestamp.
2. Environment (staging database ref).
3. Test actor role and assignment scope.
4. Target resources (org/unit/facility/department identifiers).
5. Query executed (helper call).
6. Expected result and actual result.
7. Pass/fail status.
8. Reviewer sign-off.

Recommended artifact format: CSV or markdown table under docs/qa/evidence/phase15/.
