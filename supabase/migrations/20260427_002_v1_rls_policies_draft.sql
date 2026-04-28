-- CameroHealth Supabase v1.0 RLS and role policy draft
-- Phase 3 only: draft policies for tenant isolation and clinical role enforcement
-- IMPORTANT: Do not apply directly to production without validation in staging.

begin;

-- ============================================================================
-- 0) Helper functions based on JWT claims
-- ----------------------------------------------------------------------------
-- Expected JWT custom claims for authenticated app users:
--   staff_profile_id : uuid of public.staff_profiles.id
--   facility_id      : uuid of the current facility
--   role             : one of ADMIN, DOCTOR, NURSE, LAB, IMAGING
--
-- Frontend route guards remain UX-only helpers; authorization must be enforced
-- by these RLS checks at DB level.
-- ============================================================================

create or replace function public.request_jwt_claims()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

create or replace function public.current_staff_profile_id()
returns uuid
language sql
stable
as $$
  select nullif(public.request_jwt_claims()->>'staff_profile_id', '')::uuid;
$$;

create or replace function public.current_facility_id()
returns uuid
language sql
stable
as $$
  select nullif(public.request_jwt_claims()->>'facility_id', '')::uuid;
$$;

create or replace function public.current_staff_role()
returns text
language sql
stable
as $$
  select upper(coalesce(public.request_jwt_claims()->>'role', ''));
$$;

create or replace function public.get_current_staff_profile()
returns public.staff_profiles
language sql
stable
security definer
set search_path = public
as $$
  select sp.*
  from public.staff_profiles sp
  where sp.id = public.current_staff_profile_id()
    and sp.facility_id = public.current_facility_id()
    and sp.status = 'active'
    and upper(sp.role) = public.current_staff_role()
  limit 1;
$$;

create or replace function public.is_facility_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = public.current_staff_profile_id()
      and sp.facility_id = public.current_facility_id()
      and sp.status = 'active'
      and upper(sp.role) = 'ADMIN'
  );
$$;

create or replace function public.has_clinical_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = public.current_staff_profile_id()
      and sp.facility_id = public.current_facility_id()
      and sp.status = 'active'
      and upper(sp.role) = any (
        select upper(r) from unnest(required_roles) as r
      )
  );
$$;

create or replace function public.same_facility(row_facility_id uuid)
returns boolean
language sql
stable
as $$
  select row_facility_id is not null
     and public.current_facility_id() is not null
     and row_facility_id = public.current_facility_id();
$$;

-- ============================================================================
-- 1) Enable RLS on every table in v1 schema
-- ============================================================================

alter table public.facilities enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.patients enable row level security;
alter table public.visits enable row level security;
alter table public.appointments enable row level security;
alter table public.inpatient_admissions enable row level security;
alter table public.lab_orders enable row level security;
alter table public.imaging_orders enable row level security;
alter table public.medications enable row level security;
alter table public.invoices enable row level security;
alter table public.audit_logs enable row level security;
alter table public.facility_settings enable row level security;

-- Optionally force RLS (recommended for hard isolation)
alter table public.facilities force row level security;
alter table public.staff_profiles force row level security;
alter table public.patients force row level security;
alter table public.visits force row level security;
alter table public.appointments force row level security;
alter table public.inpatient_admissions force row level security;
alter table public.lab_orders force row level security;
alter table public.imaging_orders force row level security;
alter table public.medications force row level security;
alter table public.invoices force row level security;
alter table public.audit_logs force row level security;
alter table public.facility_settings force row level security;

-- ============================================================================
-- 2) FACILITIES policies
-- ============================================================================

drop policy if exists facilities_select_own on public.facilities;
create policy facilities_select_own
on public.facilities
for select
to authenticated
using (
  public.same_facility(id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE','LAB','IMAGING'])
);

-- Only ADMIN can update own facility metadata.
drop policy if exists facilities_update_admin_own on public.facilities;
create policy facilities_update_admin_own
on public.facilities
for update
to authenticated
using (
  public.same_facility(id)
  and public.is_facility_admin()
)
with check (
  public.same_facility(id)
  and public.is_facility_admin()
);

-- Initial facility insertion is ADMIN-only and must match claim facility_id.
drop policy if exists facilities_insert_admin_own on public.facilities;
create policy facilities_insert_admin_own
on public.facilities
for insert
to authenticated
with check (
  public.same_facility(id)
  and public.is_facility_admin()
);

-- No delete policy: cross-facility and destructive delete denied by default.

-- ============================================================================
-- 3) STAFF PROFILES policies
-- ============================================================================

-- Clinical users can list active staff in their own facility (for assignment context).
drop policy if exists staff_profiles_select_own_facility on public.staff_profiles;
create policy staff_profiles_select_own_facility
on public.staff_profiles
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE','LAB','IMAGING'])
);

-- ADMIN manages staff lifecycle in own facility.
drop policy if exists staff_profiles_insert_admin_own on public.staff_profiles;
create policy staff_profiles_insert_admin_own
on public.staff_profiles
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

drop policy if exists staff_profiles_update_admin_own on public.staff_profiles;
create policy staff_profiles_update_admin_own
on public.staff_profiles
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
)
with check (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

drop policy if exists staff_profiles_delete_admin_own on public.staff_profiles;
create policy staff_profiles_delete_admin_own
on public.staff_profiles
for delete
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

-- ============================================================================
-- 4) PATIENTS policies
-- ============================================================================

-- All clinical roles can read patients in own facility.
drop policy if exists patients_select_clinical_own on public.patients;
create policy patients_select_clinical_own
on public.patients
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE','LAB','IMAGING'])
);

-- ADMIN/DOCTOR/NURSE can create or update patient records in own facility.
drop policy if exists patients_insert_care_team_own on public.patients;
create policy patients_insert_care_team_own
on public.patients
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

drop policy if exists patients_update_care_team_own on public.patients;
create policy patients_update_care_team_own
on public.patients
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
)
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

-- Optional physical delete restricted to ADMIN only.
drop policy if exists patients_delete_admin_own on public.patients;
create policy patients_delete_admin_own
on public.patients
for delete
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

-- ============================================================================
-- 5) VISITS policies
-- ============================================================================

drop policy if exists visits_select_clinical_own on public.visits;
create policy visits_select_clinical_own
on public.visits
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE','LAB','IMAGING'])
);

-- DOCTOR and NURSE create clinical visits; ADMIN can also write.
drop policy if exists visits_insert_care_team_own on public.visits;
create policy visits_insert_care_team_own
on public.visits
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

drop policy if exists visits_update_care_team_own on public.visits;
create policy visits_update_care_team_own
on public.visits
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
)
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

-- ============================================================================
-- 6) APPOINTMENTS policies
-- ============================================================================

drop policy if exists appointments_select_clinical_own on public.appointments;
create policy appointments_select_clinical_own
on public.appointments
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE','LAB','IMAGING'])
);

-- ADMIN/DOCTOR/NURSE manage appointment lifecycle.
drop policy if exists appointments_insert_care_team_own on public.appointments;
create policy appointments_insert_care_team_own
on public.appointments
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

drop policy if exists appointments_update_care_team_own on public.appointments;
create policy appointments_update_care_team_own
on public.appointments
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
)
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

-- ============================================================================
-- 7) INPATIENT ADMISSIONS policies
-- ============================================================================

drop policy if exists inpatient_select_care_team_own on public.inpatient_admissions;
create policy inpatient_select_care_team_own
on public.inpatient_admissions
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

drop policy if exists inpatient_insert_care_team_own on public.inpatient_admissions;
create policy inpatient_insert_care_team_own
on public.inpatient_admissions
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

drop policy if exists inpatient_update_care_team_own on public.inpatient_admissions;
create policy inpatient_update_care_team_own
on public.inpatient_admissions
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
)
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

-- ============================================================================
-- 8) LAB ORDERS policies
-- ============================================================================

drop policy if exists lab_orders_select_own on public.lab_orders;
create policy lab_orders_select_own
on public.lab_orders
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE','LAB'])
);

-- DOCTOR/ADMIN create lab orders; LAB can update execution/results.
drop policy if exists lab_orders_insert_doctor_admin_own on public.lab_orders;
create policy lab_orders_insert_doctor_admin_own
on public.lab_orders
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR'])
);

drop policy if exists lab_orders_update_doctor_lab_admin_own on public.lab_orders;
create policy lab_orders_update_doctor_lab_admin_own
on public.lab_orders
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','LAB'])
)
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','LAB'])
);

-- ============================================================================
-- 9) IMAGING ORDERS policies
-- ============================================================================

drop policy if exists imaging_orders_select_own on public.imaging_orders;
create policy imaging_orders_select_own
on public.imaging_orders
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE','IMAGING'])
);

-- DOCTOR/ADMIN create imaging orders; IMAGING can update execution/results.
drop policy if exists imaging_orders_insert_doctor_admin_own on public.imaging_orders;
create policy imaging_orders_insert_doctor_admin_own
on public.imaging_orders
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR'])
);

drop policy if exists imaging_orders_update_doctor_imaging_admin_own on public.imaging_orders;
create policy imaging_orders_update_doctor_imaging_admin_own
on public.imaging_orders
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','IMAGING'])
)
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','IMAGING'])
);

-- ============================================================================
-- 10) MEDICATIONS policies
-- ============================================================================

drop policy if exists medications_select_care_team_own on public.medications;
create policy medications_select_care_team_own
on public.medications
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE'])
);

-- DOCTOR/ADMIN prescribe or update medication plan.
drop policy if exists medications_insert_doctor_admin_own on public.medications;
create policy medications_insert_doctor_admin_own
on public.medications
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR'])
);

drop policy if exists medications_update_doctor_admin_own on public.medications;
create policy medications_update_doctor_admin_own
on public.medications
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR'])
)
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR'])
);

-- ============================================================================
-- 11) INVOICES policies
-- ============================================================================

drop policy if exists invoices_select_admin_own on public.invoices;
create policy invoices_select_admin_own
on public.invoices
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

drop policy if exists invoices_insert_admin_own on public.invoices;
create policy invoices_insert_admin_own
on public.invoices
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

drop policy if exists invoices_update_admin_own on public.invoices;
create policy invoices_update_admin_own
on public.invoices
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
)
with check (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

drop policy if exists invoices_delete_admin_own on public.invoices;
create policy invoices_delete_admin_own
on public.invoices
for delete
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

-- ============================================================================
-- 12) AUDIT LOGS policies (special protection)
-- ============================================================================

-- ADMIN can read audit logs for own facility.
drop policy if exists audit_logs_select_admin_own on public.audit_logs;
create policy audit_logs_select_admin_own
on public.audit_logs
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

-- Insert-only for normal app activity across clinical roles, within own facility.
drop policy if exists audit_logs_insert_clinical_own on public.audit_logs;
create policy audit_logs_insert_clinical_own
on public.audit_logs
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.has_clinical_role(array['ADMIN','DOCTOR','NURSE','LAB','IMAGING'])
  and coalesce(created_by, public.current_staff_profile_id()) = public.current_staff_profile_id()
);

-- Optional ADMIN-only update for lifecycle states (e.g., archived marker).
drop policy if exists audit_logs_update_admin_own on public.audit_logs;
create policy audit_logs_update_admin_own
on public.audit_logs
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
)
with check (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

-- No delete policy for audit_logs: normal users cannot delete, and default deny
-- blocks deletes for everyone unless explicitly granted in future.

-- ============================================================================
-- 13) FACILITY SETTINGS policies
-- ============================================================================

drop policy if exists facility_settings_select_admin_own on public.facility_settings;
create policy facility_settings_select_admin_own
on public.facility_settings
for select
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

drop policy if exists facility_settings_insert_admin_own on public.facility_settings;
create policy facility_settings_insert_admin_own
on public.facility_settings
for insert
to authenticated
with check (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

drop policy if exists facility_settings_update_admin_own on public.facility_settings;
create policy facility_settings_update_admin_own
on public.facility_settings
for update
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
)
with check (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

drop policy if exists facility_settings_delete_admin_own on public.facility_settings;
create policy facility_settings_delete_admin_own
on public.facility_settings
for delete
to authenticated
using (
  public.same_facility(facility_id)
  and public.is_facility_admin()
);

commit;

-- ============================================================================
-- Verification notes (run in staging only, never production first)
-- ----------------------------------------------------------------------------
-- 1) Simulate JWT claims for testing inside SQL session:
--    select set_config('request.jwt.claims',
--      '{"staff_profile_id":"<uuid>","facility_id":"<uuid>","role":"DOCTOR"}', true);
--
-- 2) Tenant isolation checks:
--    - select count(*) from public.patients where facility_id <> public.current_facility_id();
--      Expected visible rows: 0 due to RLS filtering.
--
-- 3) Role checks:
--    - As LAB role, insert into public.lab_orders(...) should fail.
--    - As LAB role, update public.lab_orders set status='completed' ... should pass (own facility).
--    - As NURSE role, insert into public.visits encounter_type='NURSING' should pass.
--    - As NURSE role, update public.invoices should fail.
--
-- 4) Audit protection:
--    - delete from public.audit_logs where ... should fail for normal users.
--    - insert into public.audit_logs(...) should pass for authenticated clinical roles in own facility.
-- ============================================================================
