# Multi-Tenant Super Admin Architecture (Phase 13)

## Scope

Phase 13 introduces an additive, non-breaking tenant hierarchy above facility scope.

This phase does not:

- deploy
- alter existing clinical frontend flows
- rewrite existing RLS policies
- replace facility_id
- force organization_id to be required

## Target Hierarchy

Platform
-> Organization / Tenant
-> Organization Unit
-> Facility / Site
-> Department / Ward
-> Staff / Patients / Records

## Public Health Mapping

Reference model:

- Organization: MINSANTE
- Organization Unit level 1: Regional Delegation
- Organization Unit level 2: District
- Facility: Hospital, CMA, Health Center
- Department: Ward, OPD, Lab, Imaging, etc.

This model supports national-to-local governance while preserving facility-level clinical execution.

## Private Network Mapping

Reference model:

- Organization: Private clinic group
- Organization Unit: city or regional branch
- Facility: each clinic site
- Department: site-level departments and wards

This supports multi-site private operations without breaking single-facility legacy behavior.

## Super Admin Model

### SUPER_ADMIN

- Manages organizations, units, and global platform settings.
- Oversees support and cross-tenant troubleshooting workflows.
- Can authorize break-glass workflows under strict controls.

### SUPPORT_ADMIN

- Handles support ticket operations and platform diagnostics.
- Should not access PHI by default.
- Uses metadata/system events and controlled break-glass request flow.

### Break-Glass Access Rules

Break-glass access must require:

- explicit reason
- timestamp
- correlation_id
- elevated authorization
- immutable event capture

Phase 13 models this through event fields and governance structures, not through direct clinical table policy changes.

## Organization and Administrative Roles

- ORG_ADMIN: manages one organization, its units, facilities, and delegated admins.
- REGIONAL_ADMIN: scoped to assigned regional/delegation units.
- DISTRICT_ADMIN: scoped to assigned district units.
- FACILITY_ADMIN or ADMIN: manages one facility and its local staff operations.

Clinical roles remain:

- DOCTOR
- NURSE
- LAB
- IMAGING
- AUDITOR

Platform roles added:

- SUPER_ADMIN
- SUPPORT_ADMIN

## Additive Data Model (Phase 13)

New tables:

- organizations
- organization_units
- facility_departments
- staff_assignments
- platform_admins
- support_tickets
- system_events

Transitional links added to existing facilities table:

- organization_id nullable
- organization_unit_id nullable

Key compatibility guarantee:

- Existing facility-based prototype remains valid when both columns are null.

## RLS Evolution Notes (Future Phase)

Phase 13 keeps current RLS unchanged.

Future RLS evolution should move to layered scopes:

- platform scope: SUPER_ADMIN and SUPPORT_ADMIN metadata scope only by default
- organization scope: ORG_ADMIN over assigned organization
- region/delegation scope: REGIONAL_ADMIN over assigned organization_unit subtree
- district scope: DISTRICT_ADMIN over assigned district subtree
- facility scope: FACILITY_ADMIN, ADMIN, and clinical roles over facility_id

Recommended migration strategy for future RLS evolution:

1. Introduce read-only helper functions that resolve effective scope from staff_assignments.
2. Validate with staging shadow policies before replacing existing facility policies.
3. Keep break-glass path explicit, time-bounded, and separately auditable.

## Non-Breaking Transition Rules

- Do not force organization_id on legacy facilities.
- Do not remove or redefine facility_id.
- Do not alter patient and clinical tables in this phase.
- Do not alter clinical frontend workflows in this phase.

## Risks

- Dual model period (facility-only plus hierarchy-aware) can increase policy complexity.
- Scope assignment drift can cause over-permission if not reviewed regularly.
- Break-glass governance requires operational controls, not schema only.
- Support tooling must remain metadata-first to avoid accidental PHI access.
