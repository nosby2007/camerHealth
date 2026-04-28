-- CameroHealth Supabase v1.0
-- Phase 5 draft: Auth user <-> staff profile linkage
-- File: 20260427_003_auth_user_staff_profile_linkage_draft.sql
--
-- Purpose:
--   Establish a reliable identity chain for DB authorization:
--   auth.users.id -> staff_profiles.auth_user_id -> staff_profiles.facility_id -> staff_profiles.role
--
-- Safety:
--   - Draft only (do not apply directly to production)
--   - No fake users inserted
--   - No production data manipulation in this migration

begin;

-- =============================================================================
-- 1) Add auth_user_id to staff_profiles (idempotent)
-- =============================================================================

alter table public.staff_profiles
  add column if not exists auth_user_id uuid;

comment on column public.staff_profiles.auth_user_id is
  'References Supabase Auth principal (auth.users.id). Used as canonical login identity for RLS authorization context.';

-- =============================================================================
-- 2) Link staff_profiles.auth_user_id to auth.users(id)
-- =============================================================================

-- Keep linkage nullable during transition while prototype localStorage accounts are still in use.
alter table public.staff_profiles
  drop constraint if exists staff_profiles_auth_user_id_fkey,
  add constraint staff_profiles_auth_user_id_fkey
    foreign key (auth_user_id)
    references auth.users(id)
    on update cascade
    on delete set null;

-- =============================================================================
-- 3) Uniqueness controls to avoid unsafe duplicate active profiles
-- =============================================================================

-- Rule A: One auth user must not map to multiple ACTIVE staff profiles.
-- (Allows historical/inactive rows during transitions and account lifecycle.)
create unique index if not exists uq_staff_profiles_auth_user_active
  on public.staff_profiles (auth_user_id)
  where auth_user_id is not null and status = 'active';

-- Rule B: Keep one ACTIVE row per facility+staff_code identity.
-- A global unique(facility_id, staff_code) already exists in v1 schema;
-- this partial index documents active-account intent explicitly.
create unique index if not exists uq_staff_profiles_facility_staff_code_active
  on public.staff_profiles (facility_id, staff_code)
  where status = 'active';

-- =============================================================================
-- 4) Operational indexes for identity and authorization lookups
-- =============================================================================

create index if not exists idx_staff_profiles_auth_user_id
  on public.staff_profiles (auth_user_id);

create index if not exists idx_staff_profiles_facility_role_status
  on public.staff_profiles (facility_id, role, status);

create index if not exists idx_staff_profiles_status
  on public.staff_profiles (status);

-- =============================================================================
-- 5) Helper constraints / comments for status semantics
-- =============================================================================

comment on column public.staff_profiles.status is
  'Account lifecycle state. Expected values: active, inactive, suspended. Only active profiles should authorize application access.';

comment on table public.staff_profiles is
  'Staff identity directory linked to Supabase Auth. auth_user_id binds authenticated user to facility-scoped role for RLS checks.';

-- Guard role quality even if legacy rows exist (role column already NOT NULL + CHECK in v1 schema).
-- This additional comment clarifies authorization expectation.
comment on column public.staff_profiles.role is
  'Clinical authorization role used by RLS resolution. Must be one of the allowed role enum values defined in schema check constraint.';

-- =============================================================================
-- 6) Transitional migration note (prototype localStorage -> Supabase Auth)
-- =============================================================================

-- NOTE (transition strategy, executed outside this migration):
-- 1. Existing prototype staff accounts currently stored in browser localStorage should be exported/imported into staff_profiles.
-- 2. For each real user onboarded to Supabase Auth, map auth.users.id -> staff_profiles.auth_user_id.
-- 3. Prefer manual admin-assisted mapping or controlled script in staging first.
-- 4. Keep auth_user_id nullable until all active users are mapped and validated.
-- 5. After cutover parity, a future migration may enforce auth_user_id NOT NULL for active accounts.

commit;

-- =============================================================================
-- Rollback notes (manual, review before execution)
-- =============================================================================
-- In reverse order:
-- 1. drop index if exists idx_staff_profiles_status;
-- 2. drop index if exists idx_staff_profiles_facility_role_status;
-- 3. drop index if exists idx_staff_profiles_auth_user_id;
-- 4. drop index if exists uq_staff_profiles_facility_staff_code_active;
-- 5. drop index if exists uq_staff_profiles_auth_user_active;
-- 6. alter table public.staff_profiles drop constraint if exists staff_profiles_auth_user_id_fkey;
-- 7. alter table public.staff_profiles drop column if exists auth_user_id;
--
-- Rollback caution:
-- - Do not rollback if downstream auth/RLS changes already depend on auth_user_id.
-- - Validate in staging before any rollback in shared environments.

-- =============================================================================
-- Validation queries (staging only)
-- =============================================================================

-- Q1: Each auth user maps to at most one ACTIVE staff profile
-- (Expected rows: 0)
-- select auth_user_id, count(*)
-- from public.staff_profiles
-- where auth_user_id is not null and status = 'active'
-- group by auth_user_id
-- having count(*) > 1;

-- Q2: Every staff profile belongs to exactly one facility (non-null FK integrity)
-- (Expected rows: 0)
-- select id
-- from public.staff_profiles
-- where facility_id is null;

-- Q3: Role must be present and valid
-- (Expected rows: 0)
-- select id, role
-- from public.staff_profiles
-- where role is null
--    or role not in ('ADMIN','DOCTOR','NURSE','LAB','IMAGING','PUBLIC_HEALTH_OFFICER','EPIDEMIOLOGIST');

-- Q4: Deactivated profiles must not be used for authorization
-- (Expected rows: 0 for production-ready state after full cutover)
-- select id, auth_user_id, status
-- from public.staff_profiles
-- where status <> 'active' and auth_user_id is not null;

-- Q5: Quick linkage coverage snapshot
-- select
--   count(*) as total_profiles,
--   count(*) filter (where status = 'active') as active_profiles,
--   count(*) filter (where status = 'active' and auth_user_id is not null) as active_linked_profiles,
--   count(*) filter (where status = 'active' and auth_user_id is null) as active_unlinked_profiles
-- from public.staff_profiles;
