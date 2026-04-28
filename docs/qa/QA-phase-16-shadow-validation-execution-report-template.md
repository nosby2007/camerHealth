# QA Phase 16 Shadow Validation Execution Report Template

## Report Metadata

- Test date:
- Environment:
- Git commit SHA:
- Supabase project/environment:
- Tester:
- Reviewer:
- Dataset version:
- Run id:

## Scope Confirmation

- Phase validated: Phase 15 shadow helper validation
- Policy activation status: Not activated
- Production apply status: Not applied

## Role/Scope Matrix Result Table

| Role | Scope | can_read_facility_metadata | can_manage_facility | can_troubleshoot_facility | can_break_glass_access | has_platform_role | has_organization_scope | has_unit_scope | has_facility_scope | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUPER_ADMIN | platform |  |  |  |  |  |  |  |  |  |  |  |  |
| SUPPORT_ADMIN | platform |  |  |  |  |  |  |  |  |  |  |  |  |
| ORG_ADMIN | organization |  |  |  |  |  |  |  |  |  |  |  |  |
| REGIONAL_ADMIN | regional/delegation unit |  |  |  |  |  |  |  |  |  |  |  |  |
| DISTRICT_ADMIN | district unit |  |  |  |  |  |  |  |  |  |  |  |  |
| FACILITY_ADMIN | facility |  |  |  |  |  |  |  |  |  |  |  |  |
| ADMIN | facility |  |  |  |  |  |  |  |  |  |  |  |  |
| DOCTOR | facility |  |  |  |  |  |  |  |  |  |  |  |  |
| NURSE | facility |  |  |  |  |  |  |  |  |  |  |  |  |
| LAB | department |  |  |  |  |  |  |  |  |  |  |  |  |
| IMAGING | department |  |  |  |  |  |  |  |  |  |  |  |  |
| AUDITOR | organization |  |  |  |  |  |  |  |  |  |  |  |  |

## Cross-Tenant Denial Result Table

| Case | Actor Role | Source Scope | Target | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CT-01 | ORG_ADMIN | org_a | org_b/fac_b_1 | Deny |  |  |  |
| CT-02 | REGIONAL_ADMIN | reg_a_1 | org_b units/facilities | Deny |  |  |  |
| CT-03 | DISTRICT_ADMIN | dist_a_1 | unrelated district/facility | Deny |  |  |  |
| CT-04 | FACILITY_ADMIN | fac_a_1 | fac_b_1 | Deny |  |  |  |
| CT-05 | ADMIN/DOCTOR/NURSE/LAB/IMAGING | facility/department | unrelated tenant targets | Deny |  |  |  |

## Break-Glass Eligibility Result Table

| Case | Actor Role | can_break_glass Flag | Target Facility | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BG-01 | SUPER_ADMIN | true | existing facility | Allow |  |  |  |
| BG-02 | SUPPORT_ADMIN | true | existing facility | Allow |  |  |  |
| BG-03 | SUPER_ADMIN | false | existing facility | Deny |  |  |  |
| BG-04 | SUPPORT_ADMIN | false | existing facility | Deny |  |  |  |
| BG-05 | Non-platform roles | n/a | existing facility | Deny |  |  |  |
| BG-06 | SUPER_ADMIN/SUPPORT_ADMIN | true | unknown facility | Deny |  |  |  |

## Facility-Only Compatibility Result Table

| Case | Description | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- |
| FC-01 | Direct facility assignment resolves has_facility_scope | Allow |  |  |  |
| FC-02 | Existing facility_id model behavior remains valid | Stable |  |  |  |
| FC-03 | No requirement for organization_id introduced | Stable |  |  |  |

## Null organization_id Compatibility Result Table

| Case | Description | Expected | Actual | Pass/Fail | Evidence Link |
| --- | --- | --- | --- | --- | --- |
| NO-01 | facility with organization_id null can be evaluated by facility helper path | No error |  |  |  |
| NO-02 | has_organization_scope remains false where tenant path is undefined | Deny |  |  |  |
| NO-03 | capability helpers do not crash on null organization_id fixture | No error |  |  |  |

## Issues Found

| Issue ID | Severity (blocker/high/medium/low) | Description | Affected Role/Scope | Owner | Status |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## Evidence Links

1. Environment confirmation:
2. Matrix query output:
3. Cross-tenant query output:
4. Break-glass query output:
5. Compatibility query output:
6. Failure screenshots/logs:

## Go/No-Go Decision

- Decision: Go / No-Go
- Decision date:
- Decision owner:
- Rationale:

## Required Remediation

1.
2.
3.

## Final Signoff

- Tester signoff:
- Reviewer signoff:
- Security reviewer signoff (if blocker/high issue exists):
