-- CameroHealth Supabase v1.0
-- Phase 13 draft: additive multi-tenant hierarchy and super admin model
-- File: 20260427_006_multi_tenant_superadmin_draft.sql
--
-- Purpose:
--   Add a non-breaking hierarchy above facility scope for public and private networks.
--
-- Safety:
--   - Draft only (do not apply directly to production)
--   - Additive only
--   - Does not replace facility_id
--   - organization_id and organization_unit_id remain nullable
--   - Does not modify existing RLS policies in this phase

begin;

create extension if not exists pgcrypto;

-- =============================================================================
-- 1) Organizations (tenant root)
-- =============================================================================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_code text unique,
  name text not null,
  organization_type text not null check (
    organization_type in ('PUBLIC_HEALTH_AUTHORITY', 'PRIVATE_NETWORK', 'NGO_NETWORK', 'FAITH_BASED_NETWORK', 'OTHER')
  ),
  country_code text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is
  'Top-level tenant entity for both public health authorities and private care networks.';

create index if not exists idx_organizations_type_status
  on public.organizations (organization_type, status);

-- =============================================================================
-- 2) Organization units (regional/district/city hierarchy)
-- =============================================================================

create table if not exists public.organization_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  parent_unit_id uuid references public.organization_units(id) on delete set null,
  unit_code text,
  name text not null,
  unit_type text not null check (
    unit_type in ('NATIONAL', 'REGIONAL_DELEGATION', 'DISTRICT', 'CITY_CLUSTER', 'ADMIN_ZONE', 'PRIVATE_REGION', 'PRIVATE_CITY', 'OTHER')
  ),
  hierarchy_level int not null default 0,
  region text,
  city text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, unit_code)
);

comment on table public.organization_units is
  'Hierarchical administrative units under each organization (for example regional delegation and district).';

create index if not exists idx_org_units_org_parent
  on public.organization_units (organization_id, parent_unit_id);

create index if not exists idx_org_units_type_status
  on public.organization_units (unit_type, status);

-- =============================================================================
-- 3) Transitional facility links (nullable by design)
-- =============================================================================

alter table public.facilities
  add column if not exists organization_id uuid null references public.organizations(id) on delete set null;

alter table public.facilities
  add column if not exists organization_unit_id uuid null references public.organization_units(id) on delete set null;

comment on column public.facilities.organization_id is
  'Optional phase-13 link to tenant root organization. Nullable during transition.';

comment on column public.facilities.organization_unit_id is
  'Optional phase-13 link to administrative unit. Nullable during transition.';

create index if not exists idx_facilities_organization_id
  on public.facilities (organization_id);

create index if not exists idx_facilities_organization_unit_id
  on public.facilities (organization_unit_id);

-- =============================================================================
-- 4) Facility departments / wards (site sub-scope)
-- =============================================================================

create table if not exists public.facility_departments (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  department_code text,
  name text not null,
  department_type text check (
    department_type in ('OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'MATERNITY', 'LAB', 'IMAGING', 'PHARMACY', 'ADMIN', 'OTHER')
  ),
  status text not null default 'active' check (status in ('active', 'inactive')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, department_code)
);

comment on table public.facility_departments is
  'Department and ward structure inside each facility/site.';

create index if not exists idx_facility_departments_facility
  on public.facility_departments (facility_id, status);

-- =============================================================================
-- 5) Staff assignments across scopes
-- =============================================================================

create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid not null references public.staff_profiles(id) on delete cascade,
  assignment_role text not null check (
    assignment_role in (
      'SUPER_ADMIN',
      'SUPPORT_ADMIN',
      'ORG_ADMIN',
      'REGIONAL_ADMIN',
      'DISTRICT_ADMIN',
      'FACILITY_ADMIN',
      'ADMIN',
      'DOCTOR',
      'NURSE',
      'LAB',
      'IMAGING',
      'AUDITOR'
    )
  ),
  assignment_scope text not null check (
    assignment_scope in ('platform', 'organization', 'organization_unit', 'facility', 'department')
  ),
  organization_id uuid null references public.organizations(id) on delete cascade,
  organization_unit_id uuid null references public.organization_units(id) on delete cascade,
  facility_id uuid null references public.facilities(id) on delete cascade,
  department_id uuid null references public.facility_departments(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive', 'revoked')),
  assigned_by_staff_id uuid references public.staff_profiles(id) on delete set null,
  assigned_reason text,
  start_at timestamptz not null default now(),
  end_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_staff_assignment_scope_binding check (
    (assignment_scope = 'platform' and organization_id is null and organization_unit_id is null and facility_id is null and department_id is null)
    or (assignment_scope = 'organization' and organization_id is not null and organization_unit_id is null and facility_id is null and department_id is null)
    or (assignment_scope = 'organization_unit' and organization_id is not null and organization_unit_id is not null and facility_id is null and department_id is null)
    or (assignment_scope = 'facility' and facility_id is not null and department_id is null)
    or (assignment_scope = 'department' and facility_id is not null and department_id is not null)
  )
);

comment on table public.staff_assignments is
  'Cross-scope access assignment layer for platform, organization, unit, facility, and department operations.';

create index if not exists idx_staff_assignments_profile_status
  on public.staff_assignments (staff_profile_id, status);

create index if not exists idx_staff_assignments_scope
  on public.staff_assignments (assignment_scope, status);

create index if not exists idx_staff_assignments_org
  on public.staff_assignments (organization_id, organization_unit_id, facility_id, department_id);

-- =============================================================================
-- 6) Platform admins / platform roles
-- =============================================================================

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  platform_role text not null check (platform_role in ('SUPER_ADMIN', 'SUPPORT_ADMIN', 'AUDITOR')),
  status text not null default 'active' check (status in ('active', 'inactive', 'revoked')),
  can_break_glass boolean not null default false,
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  created_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_user_id, platform_role)
);

comment on table public.platform_admins is
  'Platform-level privileged principals for super admin, support admin, and platform auditing.';

create index if not exists idx_platform_admins_status
  on public.platform_admins (platform_role, status);

-- =============================================================================
-- 7) Support tickets for troubleshooting workflow
-- =============================================================================

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique,
  reported_by_auth_user_id uuid references auth.users(id) on delete set null,
  assigned_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  organization_id uuid null references public.organizations(id) on delete set null,
  organization_unit_id uuid null references public.organization_units(id) on delete set null,
  facility_id uuid null references public.facilities(id) on delete set null,
  category text not null check (category in ('ACCESS', 'DATA_QUALITY', 'INTEGRATION', 'PERFORMANCE', 'SECURITY', 'OTHER')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'blocked', 'resolved', 'closed')),
  subject text not null,
  description text,
  resolution_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.support_tickets is
  'Operational support and troubleshooting ticketing for platform and tenant administration.';

create index if not exists idx_support_tickets_status_severity
  on public.support_tickets (status, severity, created_at desc);

-- =============================================================================
-- 8) System events for platform operations and break-glass traces
-- =============================================================================

create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  correlation_id text,
  event_type text not null,
  event_scope text not null check (event_scope in ('platform', 'organization', 'organization_unit', 'facility', 'department', 'break_glass')),
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  actor_staff_profile_id uuid references public.staff_profiles(id) on delete set null,
  organization_id uuid null references public.organizations(id) on delete set null,
  organization_unit_id uuid null references public.organization_units(id) on delete set null,
  facility_id uuid null references public.facilities(id) on delete set null,
  support_ticket_id uuid null references public.support_tickets(id) on delete set null,
  target_table text,
  target_id uuid,
  break_glass boolean not null default false,
  break_glass_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.system_events is
  'Platform and governance event stream, including support and break-glass access traces.';

create index if not exists idx_system_events_scope_time
  on public.system_events (event_scope, created_at desc);

create index if not exists idx_system_events_correlation
  on public.system_events (correlation_id);

-- =============================================================================
-- 9) updated_at trigger coverage for new mutable tables
-- =============================================================================

create trigger trg_organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger trg_organization_units_set_updated_at
before update on public.organization_units
for each row execute function public.set_updated_at();

create trigger trg_facility_departments_set_updated_at
before update on public.facility_departments
for each row execute function public.set_updated_at();

create trigger trg_staff_assignments_set_updated_at
before update on public.staff_assignments
for each row execute function public.set_updated_at();

create trigger trg_platform_admins_set_updated_at
before update on public.platform_admins
for each row execute function public.set_updated_at();

create trigger trg_support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

commit;

-- =============================================================================
-- Validation notes (staging only)
-- =============================================================================

-- Q1: Existing facilities remain valid with NULL organization links
-- select count(*) from public.facilities where organization_id is null;

-- Q2: Unit hierarchy check
-- select id, organization_id, parent_unit_id, unit_type, hierarchy_level
-- from public.organization_units
-- order by organization_id, hierarchy_level, name;

-- Q3: Scope assignment integrity
-- select id, assignment_scope, organization_id, organization_unit_id, facility_id, department_id
-- from public.staff_assignments;
