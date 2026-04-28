# Phase 16 Staging Data Fixture Requirements

## Scope

Define mandatory staging fixtures for controlled multi-scope helper shadow validation.

This document is fixture planning only.

## 1) Public Hierarchy Fixture

Required tree:

1. MINSANTE
2. Regional Delegation Centre
3. District
4. Hospital/CMA

Minimum mapping requirements:

1. Regional Delegation Centre is child of MINSANTE organization.
2. District is child of Regional Delegation Centre.
3. Hospital/CMA facility belongs to District path.

## 2) Private Hierarchy Fixture

Required tree:

1. Private Group
2. City/Region Unit
3. Clinic Site A
4. Clinic Site B

Minimum mapping requirements:

1. City/Region Unit belongs to Private Group organization.
2. Clinic Site A and Clinic Site B belong to City/Region Unit path.

## 3) Unrelated Organization Fixture

Required:

1. Dedicated unrelated organization with separate unit and facility lineage.
2. No shared assignments with public or private tenant fixtures.

## 4) Unrelated Facility Fixture

Required:

1. Dedicated facility under unrelated organization.
2. Dedicated department under unrelated facility for negative tests.

## 5) Active Assignments

Required active records:

1. Platform role path for SUPER_ADMIN and SUPPORT_ADMIN.
2. Organization scope path for ORG_ADMIN.
3. Unit scope path for REGIONAL_ADMIN and DISTRICT_ADMIN.
4. Facility scope path for FACILITY_ADMIN and ADMIN.
5. Department scope path for LAB and IMAGING.
6. Facility or organization scope path for AUDITOR as defined in matrix.
7. Clinical role paths for DOCTOR and NURSE at intended facility scope.

## 6) Inactive Assignments

Required:

1. At least one assignment per representative role with status not active.
2. Targets identical to active fixture path where possible to validate exclusion logic.

## 7) Expired Assignments

Required:

1. At least one assignment with end_at in the past.
2. Status active with expired end_at to validate time-based exclusion.

## 8) Platform Role Assignments

Required platform_admin fixture variants:

1. SUPER_ADMIN with can_break_glass true.
2. SUPER_ADMIN with can_break_glass false.
3. SUPPORT_ADMIN with can_break_glass true.
4. SUPPORT_ADMIN with can_break_glass false.

## 9) Organization Scope Assignments

Required:

1. ORG_ADMIN linked to target organization.
2. Optional AUDITOR organization-level fixture for metadata/troubleshoot checks.

## 10) Unit Scope Assignments

Required:

1. REGIONAL_ADMIN assigned to Regional Delegation Centre.
2. DISTRICT_ADMIN assigned to District.

## 11) Facility Scope Assignments

Required:

1. FACILITY_ADMIN assigned to Hospital/CMA.
2. ADMIN assigned to Hospital/CMA.
3. DOCTOR and NURSE assigned to Hospital/CMA.

## 12) Department Scope Assignments

Required:

1. LAB assigned to lab department in Hospital/CMA.
2. IMAGING assigned to imaging department in Hospital/CMA.

## 13) Expected Denial Fixtures

Required negative controls:

1. ORG_ADMIN of target organization tested against unrelated organization/facility.
2. REGIONAL_ADMIN tested against unrelated org and unrelated unit lineage.
3. DISTRICT_ADMIN tested against sibling or unrelated district/facility.
4. FACILITY_ADMIN/ADMIN/clinical roles tested against unrelated facility.
5. Non-platform roles tested against break-glass helper expecting deny.

## 14) Fixture Versioning And Traceability

Each execution must record:

1. Fixture dataset version.
2. Fixture creation timestamp.
3. Fixture owner.
4. Mapping table of logical names to UUIDs.
5. Evidence path where fixture map snapshot is stored.
