# QA Phase 14 Multi-Scope RLS Helper Checklist

## Scope

Validate read-only helper draft and mapping runbook readiness without activating global multi-scope RLS.

## Core Safety Checks

- Existing facility_id model still works.
- Existing RLS policies remain unchanged.
- Existing facilities with null organization_id remain valid.
- No clinical page changes in this phase.
- No changes to store/clinical.js in this phase.
- Supabase Auth default behavior unchanged.

## Helper Function Checks

Verify helper functions exist and execute:

- current_staff_assignments()
- has_platform_role(required_roles text[])
- has_organization_scope(target_organization_id uuid, required_roles text[])
- has_unit_scope(target_unit_id uuid, required_roles text[])
- has_facility_scope(target_facility_id uuid, required_roles text[])
- can_read_facility_metadata(target_facility_id uuid)
- can_manage_facility(target_facility_id uuid)
- can_troubleshoot_facility(target_facility_id uuid)
- can_break_glass_access(target_facility_id uuid)

Expected:

- Functions are read-only support helpers.
- No helper rewires or replaces existing active patient/clinical policies.

## Mapping Runbook Checks

Ensure runbook covers:

1. Standalone facility mapping into organizations.
2. MINSANTE hierarchy: MINSANTE -> Regional Delegation -> District -> Facility.
3. Private hierarchy: Private Organization -> Region/City Unit -> Facility.
4. Safe backfill of facilities.organization_id and facilities.organization_unit_id.
5. Assignment of ORG_ADMIN, REGIONAL_ADMIN, DISTRICT_ADMIN, FACILITY_ADMIN.
6. staff_assignments validation before multi-scope RLS enablement.
7. Rollback if assignments are wrong.
8. Cross-tenant access prevention controls during migration.

## Break-Glass Governance Checks

- Break-glass remains disabled unless explicitly approved.
- Break-glass path requires reason, timestamp, and correlation tracking in governance process.
- Break-glass eligibility helper does not by itself grant policy access in this phase.

## Regression Checks

- No replacement of facility_id.
- No required organization_id migration.
- No frontend flow modification.
- No deployment in this phase.
