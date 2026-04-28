# QA Phase 15 Multi-Scope Shadow Validation Checklist

## Scope

Validate helper behavior in shadow mode before policy cutover.

## Guardrails (Must Stay True)

- No deployment.
- No production migration apply.
- No frontend flow changes.
- No clinical page modifications.
- No changes to store/clinical.js.
- No localStorage removal.
- Supabase Auth not enabled by default.
- No active RLS policy replacement.
- No patient or clinical policy modifications.
- organization_id remains optional.
- facility_id remains the compatibility anchor.

## Dataset Preparation Checks

1. Staging-only test users created for all 12 roles.
2. Scope fixtures exist for platform, organization, regional unit, district unit, facility, and department.
3. Unrelated tenant fixtures exist (unrelated organization and unrelated facility).
4. One inactive assignment fixture exists.
5. One expired assignment fixture exists.
6. One null organization_id facility fixture exists.

## Matrix Coverage Checks

1. SUPER_ADMIN matrix rows executed.
2. SUPPORT_ADMIN matrix rows executed.
3. ORG_ADMIN matrix rows executed.
4. REGIONAL_ADMIN matrix rows executed.
5. DISTRICT_ADMIN matrix rows executed.
6. FACILITY_ADMIN matrix rows executed.
7. ADMIN matrix rows executed.
8. DOCTOR matrix rows executed.
9. NURSE matrix rows executed.
10. LAB matrix rows executed.
11. IMAGING matrix rows executed.
12. AUDITOR matrix rows executed.

## Helper Function Validation Checks

Run and verify:

1. can_read_facility_metadata
2. can_manage_facility
3. can_troubleshoot_facility
4. can_break_glass_access
5. has_platform_role
6. has_organization_scope
7. has_unit_scope
8. has_facility_scope

## Negative Path Checks

1. Cross-tenant access denied for unrelated organization.
2. Cross-tenant access denied for unrelated facility.
3. Expired assignments do not grant helper access.
4. Inactive assignments do not grant helper access.
5. Non-platform roles cannot pass break-glass helper.

## Compatibility Checks

1. Existing facility_id model remains valid.
2. Null organization_id facilities do not break helper execution.
3. No required organization_id migration introduced.
4. Existing active policies remain unchanged.

## Go/No-Go Checklist

Go if all are true:

1. Full matrix executed with expected outcomes.
2. Negative path and cross-tenant tests pass.
3. Break-glass behavior matches expected eligibility only.
4. Compatibility checks pass.
5. Evidence is complete and signed off.

No-Go if any are true:

1. Any cross-tenant false positive.
2. Any helper grants access outside defined scope.
3. Any compatibility regression.
4. Incomplete evidence capture.
