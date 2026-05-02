# QA Phase 13 Multi-Tenant Super Admin Checklist

## Scope

Validate additive, non-breaking tenant hierarchy and super admin architecture draft.

## Non-Breaking Guarantees

- Existing facility-based prototype still works with null organization fields.
- No clinical page changes in this phase.
- No changes to store/clinical.js in this phase.
- Existing RLS policies remain unchanged in this phase.

## Schema Validation

- organizations table exists.
- organization_units table exists.
- facility_departments table exists.
- staff_assignments table exists.
- platform_admins table exists.
- support_tickets table exists.
- system_events table exists.
- facilities.organization_id exists and is nullable.
- facilities.organization_unit_id exists and is nullable.

## Hierarchy Validation

- One organization can have multiple units.
- organization_units supports parent-child hierarchy.
- Facilities can be attached to organization and unit.
- Facilities can remain unattached (null organization_id and null organization_unit_id).
- Departments can be created per facility.

## Role and Scope Validation

- staff_assignments accepts required roles:
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
- Assignment scope constraint enforces valid binding combinations.
- Platform-level roles are represented without requiring facility scope.

## Public Hierarchy Example Validation

- MINSANTE modeled as organization.
- Regional Delegation modeled as organization_unit.
- District modeled as organization_unit child.
- Hospital/CMA/Health Center modeled as facilities linked to district unit.

## Private Network Example Validation

- Private clinic group modeled as organization.
- City/region branch modeled as organization_unit.
- Multiple clinic sites modeled as facilities linked to branch unit.

## Super Admin / Support Validation

- SUPER_ADMIN modeled in platform_admins.
- SUPPORT_ADMIN modeled in platform_admins.
- Support workflow entities exist in support_tickets.
- System governance and troubleshooting traces exist in system_events.
- Super admin/support does not imply automatic PHI access in this phase.

## Break-Glass Modeling Validation

- system_events includes fields for break_glass flag and break_glass_reason.
- Break-glass captures correlation_id and actor context.
- Break-glass is modeled separately from normal role assignment.

## RLS Forward Plan Validation

- Confirm no existing RLS policy was modified in this phase.
- Confirm architecture docs include future scoped RLS evolution notes.
