# QA Phase 17 Shadow Validation Execution Report

## Report Metadata

- Test date: 2026-04-28
- Environment: Pending staging access confirmation required
- Git commit SHA: d543bbb012bd2ad9348e0b92df381d0ef5fac0db
- Supabase project/environment: Pending staging project reference and credentials
- Tester: Pending assignment
- Reviewer: Pending assignment
- Dataset version: Pending fixture dataset creation
- Run id: phase17-pending-staging-execution

## Execution Status

- Status: Pending execution
- Reason: Staging credentials/environment access not available in current workspace/session
- Decision status: Provisional No-Go until blockers are resolved

## Scope Confirmation

- Phase validated: Phase 15 shadow helper validation
- Policy activation status: Not activated
- Production apply status: Not applied
- Production deployment status: Not deployed

## Environment Access Required

Required before execution:

1. Staging Supabase project reference.
2. Approved staging database access for tester.
3. Approved staging database access for reviewer.
4. Confirmation that execution target is staging and not production.

## Missing Credentials / Access

Missing in current workspace/session:

1. Staging Supabase project id/reference.
2. Staging SQL console or direct DB connection access.
3. Staging fixture UUID map.
4. Assigned tester and reviewer identities.

## Migrations Required In Staging Only

Present in repository but not confirmed as applied in staging:

1. supabase/migrations/20260427_006_multi_tenant_superadmin_draft.sql
2. supabase/migrations/20260427_007_multiscope_rls_helpers_draft.sql

Required confirmation:

1. Present in codebase: confirmed.
2. Applied in staging only: pending confirmation.
3. Not applied to production: required confirmation before execution signoff.

## Fixture Setup Required

Required before execution:

1. Public hierarchy fixture:
- MINSANTE
- Regional Delegation Centre
- District
- Hospital/CMA
2. Private hierarchy fixture:
- Private Group
- City/Region Unit
- Clinic Site A
- Clinic Site B
3. Unrelated organization fixture.
4. Unrelated facility fixture.
5. Active, inactive, and expired assignments.
6. Platform role assignments for SUPER_ADMIN and SUPPORT_ADMIN variants.
7. Organization, unit, facility, and department scope assignments.
8. Null organization_id compatibility fixture.
9. Expected denial fixtures.

## Commands To Run

Run only after staging access and fixtures are ready:

1. Open staging SQL console and confirm project reference.
2. Open and parameterize [supabase/tests/phase15_multiscope_helper_validation.sql](supabase/tests/phase15_multiscope_helper_validation.sql).
3. Execute in controlled batches following [docs/qa/QA-phase-16-staging-evidence-runbook.md](docs/qa/QA-phase-16-staging-evidence-runbook.md).

Suggested execution sequence:

1. Baseline helper checks.
2. Platform role checks.
3. Organization/unit checks.
4. Facility/department checks.
5. Cross-tenant denial checks.
6. Expired/inactive assignment checks.
7. Null organization_id compatibility checks.
8. facility_id compatibility checks.
9. Break-glass eligibility checks.

## Evidence Checklist

Required evidence package:

1. Environment confirmation screenshot.
2. Query output export for role/scope matrix blocks.
3. Query output export for cross-tenant denial tests.
4. Query output export for break-glass tests.
5. Query output export for facility-only compatibility tests.
6. Query output export for null organization_id compatibility tests.
7. Issue log with severity and owner.
8. Reviewer signoff artifact.

## Assigned Owner Fields

- Staging access owner:
- Fixture setup owner:
- Test execution owner:
- Review owner:
- Security review owner:
- Rollback owner:

## Blocker List

| Blocker ID | Description | Owner | Status |
| --- | --- | --- | --- |
| B-01 | No staging Supabase project/environment access available in session | Pending | Open |
| B-02 | No staging credentials or SQL console access provided | Pending | Open |
| B-03 | Staging fixture dataset not created or not provided with UUID map | Pending | Open |
| B-04 | Staging-only migration application status not confirmed | Pending | Open |
| B-05 | Tester and reviewer assignments not recorded | Pending | Open |

## Role/Scope Matrix Result Table

| Role | Scope | can_read_facility_metadata | can_manage_facility | can_troubleshoot_facility | can_break_glass_access | has_platform_role | has_organization_scope | has_unit_scope | has_facility_scope | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUPER_ADMIN | platform | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| SUPPORT_ADMIN | platform | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| ORG_ADMIN | organization | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| REGIONAL_ADMIN | regional/delegation unit | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| DISTRICT_ADMIN | district unit | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| FACILITY_ADMIN | facility | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| ADMIN | facility | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| DOCTOR | facility | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| NURSE | facility | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| LAB | department | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| IMAGING | department | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |
| AUDITOR | organization | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Per Phase 15 matrix | Not executed | Pending | Pending staging evidence |

## Cross-Tenant Denial Result Table

| Case | Actor Role | Source Scope | Target | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CT-01 | ORG_ADMIN | org_a | org_b/fac_b_1 | Deny | Not executed | Pending | Pending staging evidence |
| CT-02 | REGIONAL_ADMIN | reg_a_1 | org_b units/facilities | Deny | Not executed | Pending | Pending staging evidence |
| CT-03 | DISTRICT_ADMIN | dist_a_1 | unrelated district/facility | Deny | Not executed | Pending | Pending staging evidence |
| CT-04 | FACILITY_ADMIN | fac_a_1 | fac_b_1 | Deny | Not executed | Pending | Pending staging evidence |
| CT-05 | ADMIN/DOCTOR/NURSE/LAB/IMAGING | facility/department | unrelated tenant targets | Deny | Not executed | Pending | Pending staging evidence |

## Break-Glass Eligibility Result Table

| Case | Actor Role | can_break_glass Flag | Target Facility | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BG-01 | SUPER_ADMIN | true | existing facility | Allow | Not executed | Pending | Pending staging evidence |
| BG-02 | SUPPORT_ADMIN | true | existing facility | Allow | Not executed | Pending | Pending staging evidence |
| BG-03 | SUPER_ADMIN | false | existing facility | Deny | Not executed | Pending | Pending staging evidence |
| BG-04 | SUPPORT_ADMIN | false | existing facility | Deny | Not executed | Pending | Pending staging evidence |
| BG-05 | Non-platform roles | n/a | existing facility | Deny | Not executed | Pending | Pending staging evidence |
| BG-06 | SUPER_ADMIN/SUPPORT_ADMIN | true | unknown facility | Deny | Not executed | Pending | Pending staging evidence |

## Facility-Only Compatibility Result Table

| Case | Description | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- |
| FC-01 | Direct facility assignment resolves has_facility_scope | Allow | Not executed | Pending | Pending staging evidence |
| FC-02 | Existing facility_id model behavior remains valid | Stable | Not executed | Pending | Pending staging evidence |
| FC-03 | No requirement for organization_id introduced | Stable | Not executed | Pending | Pending staging evidence |

## Null organization_id Compatibility Result Table

| Case | Description | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- |
| NO-01 | facility with organization_id null can be evaluated by facility helper path | No error | Not executed | Pending | Pending staging evidence |
| NO-02 | has_organization_scope remains false where tenant path is undefined | Deny | Not executed | Pending | Pending staging evidence |
| NO-03 | capability helpers do not crash on null organization_id fixture | No error | Not executed | Pending | Pending staging evidence |

## Issues Found

| Issue ID | Severity (blocker/high/medium/low) | Description | Affected Role/Scope | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| B-01 | blocker | No staging environment access available in session | All | Pending | Open |
| B-02 | blocker | Missing staging credentials/project reference | All | Pending | Open |
| B-03 | blocker | Fixture dataset and UUID mapping not available | All | Pending | Open |
| B-04 | blocker | Staging-only migration application status not confirmed | All | Pending | Open |
| B-05 | medium | Execution ownership and review ownership not assigned | All | Pending | Open |

## Evidence Links

1. Environment confirmation: Pending
2. Matrix query output: Pending
3. Cross-tenant query output: Pending
4. Break-glass query output: Pending
5. Compatibility query output: Pending
6. Failure screenshots/logs: Pending

## Go/No-Go Decision

- Decision: No-Go (provisional, pending environment readiness)
- Decision date: 2026-04-28
- Decision owner: Pending
- Rationale: Shadow validation cannot be executed because staging access, credentials, fixture dataset, and staging migration status are not available in the current workspace/session. No results have been fabricated.

## Required Remediation

1. Provide staging Supabase environment access and project reference.
2. Confirm Phase 13/14 draft migrations are applied in staging only and not production.
3. Create or provide the Phase 16 fixture dataset with UUID mapping and assign tester/reviewer owners.

## Final Signoff

- Tester signoff: Pending
- Reviewer signoff: Pending
- Security reviewer signoff (if blocker/high issue exists): Pending
