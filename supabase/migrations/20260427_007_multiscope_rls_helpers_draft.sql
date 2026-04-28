-- CameroHealth Supabase v1.0
-- Phase 14 draft: read-only multi-scope RLS helpers
-- File: 20260427_007_multiscope_rls_helpers_draft.sql
--
-- Purpose:
--   Prepare future RLS evolution using helper functions only.
--
-- Safety:
--   - Draft only (do not apply directly to production)
--   - Does not alter or drop existing active RLS policies
--   - Does not modify patient/clinical table policies
--   - Does not force organization_id
--   - Does not replace facility_id

begin;

-- =============================================================================
-- 0) Current auth user helper
-- =============================================================================

create or replace function public.current_auth_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

comment on function public.current_auth_user_id is
  'Returns current authenticated Supabase Auth user id from JWT context.';

-- =============================================================================
-- 1) Current staff assignments helper (read-only)
-- =============================================================================

create or replace function public.current_staff_assignments()
returns setof public.staff_assignments
language sql
stable
security definer
set search_path = public
as $$
  select sa.*
  from public.staff_assignments sa
  join public.staff_profiles sp on sp.id = sa.staff_profile_id
  where sp.auth_user_id = public.current_auth_user_id()
    and sp.status = 'active'
    and sa.status = 'active'
    and (sa.end_at is null or sa.end_at > now());
$$;

comment on function public.current_staff_assignments is
  'Returns active, non-expired assignments for the current auth user via staff_profiles.auth_user_id.';

-- =============================================================================
-- 2) Platform role helper
-- =============================================================================

create or replace function public.has_platform_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with normalized_required as (
    select upper(r) as role
    from unnest(required_roles) as r
  )
  select exists (
    -- Platform admin table path
    select 1
    from public.platform_admins pa
    join normalized_required nr on nr.role = upper(pa.platform_role)
    where pa.auth_user_id = public.current_auth_user_id()
      and pa.status = 'active'

    union all

    -- Staff assignment platform scope path
    select 1
    from public.current_staff_assignments() sa
    join normalized_required nr on nr.role = upper(sa.assignment_role)
    where sa.assignment_scope = 'platform'
  );
$$;

comment on function public.has_platform_role is
  'Checks whether current user has one of the required platform roles via platform_admins or platform staff_assignments.';

-- =============================================================================
-- 3) Organization scope helper
-- =============================================================================

create or replace function public.has_organization_scope(target_organization_id uuid, required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with normalized_required as (
    select upper(r) as role
    from unnest(required_roles) as r
  )
  select
    case
      when target_organization_id is null then false
      when public.has_platform_role(required_roles) then true
      else exists (
        select 1
        from public.current_staff_assignments() sa
        join normalized_required nr on nr.role = upper(sa.assignment_role)
        where (
          (sa.assignment_scope = 'organization' and sa.organization_id = target_organization_id)
          or
          (sa.assignment_scope = 'organization_unit' and sa.organization_id = target_organization_id)
          or
          (sa.assignment_scope = 'facility' and exists (
            select 1 from public.facilities f
            where f.id = sa.facility_id
              and f.organization_id = target_organization_id
          ))
          or
          (sa.assignment_scope = 'department' and exists (
            select 1
            from public.facility_departments d
            join public.facilities f on f.id = d.facility_id
            where d.id = sa.department_id
              and f.organization_id = target_organization_id
          ))
        )
      )
    end;
$$;

comment on function public.has_organization_scope is
  'Evaluates whether current user has required role over a target organization by direct or derived assignment scope.';

-- =============================================================================
-- 4) Organization unit scope helper (supports ancestor inheritance)
-- =============================================================================

create or replace function public.has_unit_scope(target_unit_id uuid, required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recursive unit_ancestors as (
    select ou.id, ou.parent_unit_id, ou.organization_id
    from public.organization_units ou
    where ou.id = target_unit_id

    union all

    select parent.id, parent.parent_unit_id, parent.organization_id
    from public.organization_units parent
    join unit_ancestors ua on ua.parent_unit_id = parent.id
  ),
  normalized_required as (
    select upper(r) as role
    from unnest(required_roles) as r
  )
  select
    case
      when target_unit_id is null then false
      when public.has_platform_role(required_roles) then true
      else exists (
        select 1
        from public.current_staff_assignments() sa
        join normalized_required nr on nr.role = upper(sa.assignment_role)
        where (
          (sa.assignment_scope = 'organization' and exists (
            select 1 from unit_ancestors ua
            where ua.organization_id = sa.organization_id
          ))
          or
          (sa.assignment_scope = 'organization_unit' and exists (
            select 1 from unit_ancestors ua
            where ua.id = sa.organization_unit_id
          ))
          or
          (sa.assignment_scope = 'facility' and exists (
            select 1 from public.facilities f
            where f.id = sa.facility_id
              and f.organization_unit_id in (select id from unit_ancestors)
          ))
          or
          (sa.assignment_scope = 'department' and exists (
            select 1
            from public.facility_departments d
            join public.facilities f on f.id = d.facility_id
            where d.id = sa.department_id
              and f.organization_unit_id in (select id from unit_ancestors)
          ))
        )
      )
    end;
$$;

comment on function public.has_unit_scope is
  'Evaluates whether current user has required role over a target unit, including inheritance from parent units and organization scope.';

-- =============================================================================
-- 5) Facility scope helper
-- =============================================================================

create or replace function public.has_facility_scope(target_facility_id uuid, required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with target_facility as (
    select id, organization_id, organization_unit_id
    from public.facilities
    where id = target_facility_id
  ),
  normalized_required as (
    select upper(r) as role
    from unnest(required_roles) as r
  )
  select
    case
      when target_facility_id is null then false
      when not exists (select 1 from target_facility) then false
      when public.has_platform_role(required_roles) then true
      else exists (
        select 1
        from public.current_staff_assignments() sa
        join normalized_required nr on nr.role = upper(sa.assignment_role)
        cross join target_facility tf
        where (
          (sa.assignment_scope = 'organization' and tf.organization_id is not null and sa.organization_id = tf.organization_id)
          or
          (sa.assignment_scope = 'organization_unit' and tf.organization_unit_id is not null and public.has_unit_scope(tf.organization_unit_id, array[sa.assignment_role]))
          or
          (sa.assignment_scope = 'facility' and sa.facility_id = tf.id)
          or
          (sa.assignment_scope = 'department' and exists (
            select 1 from public.facility_departments d
            where d.id = sa.department_id
              and d.facility_id = tf.id
          ))
        )
      )
    end;
$$;

comment on function public.has_facility_scope is
  'Evaluates whether current user has required role over target facility by platform, organization, unit, facility, or department assignment paths.';

-- =============================================================================
-- 6) Capability helpers (metadata/management/troubleshooting/break-glass)
-- =============================================================================

create or replace function public.can_read_facility_metadata(target_facility_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_facility_scope(
    target_facility_id,
    array[
      'SUPER_ADMIN',
      'SUPPORT_ADMIN',
      'ORG_ADMIN',
      'REGIONAL_ADMIN',
      'DISTRICT_ADMIN',
      'FACILITY_ADMIN',
      'ADMIN',
      'AUDITOR'
    ]
  );
$$;

comment on function public.can_read_facility_metadata is
  'Metadata-only access helper for facility-level operational visibility.';

create or replace function public.can_manage_facility(target_facility_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_facility_scope(
    target_facility_id,
    array[
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'REGIONAL_ADMIN',
      'DISTRICT_ADMIN',
      'FACILITY_ADMIN',
      'ADMIN'
    ]
  );
$$;

comment on function public.can_manage_facility is
  'Facility management capability helper for administrative scopes only.';

create or replace function public.can_troubleshoot_facility(target_facility_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_facility_scope(
    target_facility_id,
    array[
      'SUPER_ADMIN',
      'SUPPORT_ADMIN',
      'ORG_ADMIN',
      'REGIONAL_ADMIN',
      'DISTRICT_ADMIN',
      'FACILITY_ADMIN',
      'AUDITOR'
    ]
  );
$$;

comment on function public.can_troubleshoot_facility is
  'Troubleshooting helper intended for metadata/system diagnostics scope.';

create or replace function public.can_break_glass_access(target_facility_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.auth_user_id = public.current_auth_user_id()
      and pa.status = 'active'
      and pa.can_break_glass = true
      and upper(pa.platform_role) in ('SUPER_ADMIN', 'SUPPORT_ADMIN')
  )
  and exists (
    select 1
    from public.facilities f
    where f.id = target_facility_id
  );
$$;

comment on function public.can_break_glass_access is
  'Break-glass eligibility helper. Eligibility only; actual break-glass approval and audit controls must be enforced separately.';

commit;

-- =============================================================================
-- Validation notes (staging only)
-- =============================================================================

-- Q1: Helpers compile and execute without modifying policies
-- select public.current_auth_user_id();
-- select * from public.current_staff_assignments() limit 5;

-- Q2: Scope checks against known facility
-- select public.can_read_facility_metadata('<facility_uuid>'::uuid);
-- select public.can_manage_facility('<facility_uuid>'::uuid);
-- select public.can_troubleshoot_facility('<facility_uuid>'::uuid);
-- select public.can_break_glass_access('<facility_uuid>'::uuid);

-- Q3: Existing policies are untouched in this phase
-- select policyname, tablename
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;
