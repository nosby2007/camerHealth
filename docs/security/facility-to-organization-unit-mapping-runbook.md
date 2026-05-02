# Facility To Organization/Unit Mapping Runbook (Phase 14)

## Scope

This runbook defines a safe tenant mapping process from standalone facilities to additive organization and organization_unit links.

This runbook does not:

- deploy
- modify clinical frontend flows
- modify active RLS policies
- force organization_id as required
- replace facility_id

## Safety Principles

1. Keep facility_id as current source of truth during transition.
2. Backfill organization links incrementally and reversibly.
3. Validate scope assignments before any RLS cutover.
4. Prevent cross-tenant leakage by explicit assignment scoping and audit.

## Step 1: Inventory Existing Facilities

1. Export current facilities and staff profiles.
2. Classify facilities as:
   - public health network
   - private network
   - standalone (temporary unassigned)
3. Record mapping decision per facility in a controlled worksheet.

Output:

- approved mapping plan per facility_id

## Step 2: Create Organization Roots

For public model:

- create organization row for MINSANTE

For private model:

- create organization row per private parent network

Do not backfill facilities yet in bulk before unit hierarchy exists.

## Step 3: Build Organization Unit Hierarchy

### Public hierarchy example

MINSANTE
-> Regional Delegation (organization_unit)
-> District (organization_unit child)
-> Facility

Procedure:

1. Insert regional delegation units linked to MINSANTE organization_id.
2. Insert district units with parent_unit_id = corresponding regional delegation.
3. Validate unit tree consistency (no orphan district rows).

### Private hierarchy example

Private Organization
-> Region/City Unit
-> Facility

Procedure:

1. Insert private branch units by region/city.
2. Validate each branch maps to the correct organization_id.

## Step 4: Safe Facility Backfill

Backfill in small batches:

1. For each facility, set organization_id and organization_unit_id based on approved plan.
2. Keep changes reversible with transaction boundaries per batch.
3. Verify no facility gets mapped to a unit outside its organization.

Guardrails:

- Do not update facilities with uncertain mapping.
- Leave nullable links null until mapping is confirmed.

## Step 5: Role Assignment Backfill

Populate staff_assignments using minimum privilege:

- ORG_ADMIN at organization scope.
- REGIONAL_ADMIN at organization_unit scope (regional delegation).
- DISTRICT_ADMIN at organization_unit scope (district).
- FACILITY_ADMIN at facility scope.
- Existing ADMIN/DOCTOR/NURSE/LAB/IMAGING remain facility-scoped unless explicitly elevated.

Required checks:

1. assignment_scope binding check passes.
2. assigned roles match intended jurisdiction.
3. end_at is null or future for active assignments.

## Step 6: Validate Before Multi-Scope RLS Activation

Validation set:

1. Every elevated assignment has explicit assignment_reason.
2. No user has conflicting cross-tenant admin assignments unless approved exception.
3. Facility admins are mapped only to their facilities.
4. Regional and district admins only have inherited unit/facility paths inside assigned organization.
5. Break-glass eligibility is disabled by default unless explicitly approved.

## Step 7: Rollback Plan

If assignment quality issues are found:

1. Revoke incorrect staff_assignments (status = revoked).
2. Nullify organization links on affected facilities only when necessary.
3. Restore previous approved snapshot from pre-backfill export.
4. Re-run validation before resuming batches.

Rollback must be batch-scoped, not global, to avoid broad service impact.

## Step 8: Cross-Tenant Access Prevention During Migration

Controls:

1. Keep existing facility-only RLS active unchanged in this phase.
2. Use helper functions in shadow validation only; do not wire to clinical policies yet.
3. Restrict support troubleshooting to metadata scope unless break-glass approval is documented.
4. Require correlation_id for all elevated support actions.

## Operational Checklist

1. Mapping worksheet approved by governance owner.
2. Organization/unit seed data reviewed.
3. Facility backfill batch completed and verified.
4. staff_assignments validated and approved.
5. Rollback snapshot retained.
6. No active policy change executed in this phase.
