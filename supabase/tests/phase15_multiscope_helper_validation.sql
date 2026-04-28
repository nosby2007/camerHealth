-- CameroHealth Supabase v1.0
-- Phase 15 shadow validation for multi-scope helper functions
-- File: supabase/tests/phase15_multiscope_helper_validation.sql
--
-- Purpose:
--   Controlled shadow validation of helper behavior before any RLS policy cutover.
--
-- Safety:
--   - Staging only
--   - No production data
--   - No policy activation or policy replacement
--   - No changes to existing active patient/clinical policies
--   - No requirement change for organization_id
--   - No replacement of facility_id

begin;

-- =============================================================================
-- 0) Placeholder assumptions (replace all placeholders in staging)
-- =============================================================================

-- Roles under test:
--   SUPER_ADMIN, SUPPORT_ADMIN, ORG_ADMIN, REGIONAL_ADMIN, DISTRICT_ADMIN,
--   FACILITY_ADMIN, ADMIN, DOCTOR, NURSE, LAB, IMAGING, AUDITOR

-- Required staging placeholders:
--   <auth_user_id_role>
--   <org_a_id>, <org_b_id>
--   <reg_a_1_unit_id>, <dist_a_1_unit_id>
--   <fac_a_1_id>, <fac_a_null_org_id>, <fac_b_1_id>
--   <dep_a_1_id>, <dep_b_1_id>

-- Optional: psql variables may be used to template actor and targets.

-- =============================================================================
-- 1) Baseline helper existence checks
-- =============================================================================

-- Expected: all functions exist and are executable.
select public.current_auth_user_id();
select * from public.current_staff_assignments() limit 5;
select public.has_platform_role(array['SUPER_ADMIN']);
select public.has_organization_scope('<org_a_id>'::uuid, array['ORG_ADMIN']);
select public.has_unit_scope('<reg_a_1_unit_id>'::uuid, array['REGIONAL_ADMIN']);
select public.has_facility_scope('<fac_a_1_id>'::uuid, array['FACILITY_ADMIN']);
select public.can_read_facility_metadata('<fac_a_1_id>'::uuid);
select public.can_manage_facility('<fac_a_1_id>'::uuid);
select public.can_troubleshoot_facility('<fac_a_1_id>'::uuid);
select public.can_break_glass_access('<fac_a_1_id>'::uuid);

-- =============================================================================
-- 2) Test query templates per role/scope
-- =============================================================================

-- Template notes:
--   1) Set actor JWT claim to the role test user.
--   2) Run helper queries for each scope target.
--   3) Compare actual with expected matrix in docs/security/multiscope-rls-shadow-test-plan.md.

-- Template actor switch (example for SQL editor sessions supporting local claim override):
-- select set_config('request.jwt.claim.sub', '<auth_user_id_role>', true);

-- Template query block (repeat for each role and scope):
-- select
--   'ROLE=<ROLE>|SCOPE=<SCOPE>' as test_case,
--   public.can_read_facility_metadata('<fac_target_id>'::uuid) as can_read_facility_metadata,
--   public.can_manage_facility('<fac_target_id>'::uuid) as can_manage_facility,
--   public.can_troubleshoot_facility('<fac_target_id>'::uuid) as can_troubleshoot_facility,
--   public.can_break_glass_access('<fac_target_id>'::uuid) as can_break_glass_access,
--   public.has_platform_role(array['<ROLE>']) as has_platform_role,
--   public.has_organization_scope('<org_target_id>'::uuid, array['<ROLE>']) as has_organization_scope,
--   public.has_unit_scope('<unit_target_id>'::uuid, array['<ROLE>']) as has_unit_scope,
--   public.has_facility_scope('<fac_target_id>'::uuid, array['<ROLE>']) as has_facility_scope;

-- =============================================================================
-- 3) Expected pass/fail comment templates
-- =============================================================================

-- PASS example:
--   ROLE=ORG_ADMIN, SCOPE=organization (org_a), TARGET=fac_a_1
--   expected: read=true, manage=true, troubleshoot=true, break_glass=false,
--             platform=false, organization=true, unit=true, facility=true

-- FAIL example:
--   ROLE=FACILITY_ADMIN, SCOPE=facility (fac_a_1), TARGET=fac_b_1 unrelated
--   expected: all false except role-independent helper calls as defined by matrix
--   if any helper grants true on unrelated tenant target, mark fail and stop cutover.

-- =============================================================================
-- 4) Cross-tenant negative tests
-- =============================================================================

-- ORG_ADMIN scoped to org_a must be denied on org_b/fac_b_1.
-- Expected: has_organization_scope(org_b)=false, has_facility_scope(fac_b_1)=false,
--           can_read/can_manage/can_troubleshoot=false.
-- select public.has_organization_scope('<org_b_id>'::uuid, array['ORG_ADMIN']);
-- select public.has_facility_scope('<fac_b_1_id>'::uuid, array['ORG_ADMIN']);
-- select public.can_read_facility_metadata('<fac_b_1_id>'::uuid);
-- select public.can_manage_facility('<fac_b_1_id>'::uuid);
-- select public.can_troubleshoot_facility('<fac_b_1_id>'::uuid);

-- FACILITY_ADMIN scoped to fac_a_1 must be denied on fac_b_1.
-- Expected: false for has_facility_scope and capability helpers on fac_b_1.

-- =============================================================================
-- 5) Expired assignment tests
-- =============================================================================

-- Precondition: test assignment has end_at < now() and status='active'.
-- Expected: excluded by current_staff_assignments(), helper checks return false.
-- select * from public.current_staff_assignments();
-- select public.has_facility_scope('<fac_a_1_id>'::uuid, array['FACILITY_ADMIN']);

-- =============================================================================
-- 6) Inactive assignment tests
-- =============================================================================

-- Precondition: test assignment has status!='active'.
-- Expected: excluded by current_staff_assignments(), helper checks return false.
-- select * from public.current_staff_assignments();
-- select public.has_organization_scope('<org_a_id>'::uuid, array['ORG_ADMIN']);

-- =============================================================================
-- 7) Null organization_id compatibility tests
-- =============================================================================

-- Precondition: facility fac_a_null_org has organization_id is null.
-- Expected:
--   - No helper execution error.
--   - has_facility_scope remains valid for direct facility/department assignment paths.
--   - has_organization_scope requires explicit target organization and remains false where org is null.
-- select public.has_facility_scope('<fac_a_null_org_id>'::uuid, array['FACILITY_ADMIN']);
-- select public.can_read_facility_metadata('<fac_a_null_org_id>'::uuid);
-- select public.has_organization_scope('<org_a_id>'::uuid, array['FACILITY_ADMIN']);

-- =============================================================================
-- 8) Existing facility_id model compatibility tests
-- =============================================================================

-- Expected:
--   - Direct facility assignment continues to resolve facility scope.
--   - No dependency on making organization_id required.
-- select public.has_facility_scope('<fac_a_1_id>'::uuid, array['ADMIN']);
-- select public.can_manage_facility('<fac_a_1_id>'::uuid);

-- =============================================================================
-- 9) Break-glass eligibility tests
-- =============================================================================

-- Expected:
--   - SUPER_ADMIN/SUPPORT_ADMIN with can_break_glass=true and existing facility => true
--   - same roles with can_break_glass=false => false
--   - all non-platform roles => false
--   - unknown facility => false
-- select public.can_break_glass_access('<fac_a_1_id>'::uuid);
-- select public.can_break_glass_access('00000000-0000-0000-0000-000000000000'::uuid);

-- =============================================================================
-- 10) Policy safety check (shadow mode)
-- =============================================================================

-- Expected: this phase does not alter active policies.
select policyname, tablename
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

rollback;

-- End of phase15_multiscope_helper_validation.sql
