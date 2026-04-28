-- CameroHealth Supabase v1.0 schema draft
-- Phase 2 only: database draft (no frontend migration, no production apply)

begin;

create extension if not exists pgcrypto;

-- Shared helper: auto-maintain updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) FACILITIES
create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null unique default gen_random_uuid(),
  code text unique,
  name text not null,
  region text,
  city text,
  quarter text,
  phone text,
  email text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.facilities is
  'Healthcare facility master table (clinic/hospital identity, location, operational status).';

-- 2) STAFF PROFILES
create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  staff_code text not null,
  full_name text not null,
  email text,
  role text not null check (role in ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'IMAGING', 'PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST')),
  license_number text,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, staff_code)
);

comment on table public.staff_profiles is
  'Staff identity and role directory scoped to facility (application users and clinicians).';

alter table public.facilities
  drop constraint if exists facilities_created_by_fkey,
  add constraint facilities_created_by_fkey
    foreign key (created_by) references public.staff_profiles(id) on delete set null;

alter table public.facilities
  drop constraint if exists facilities_updated_by_fkey,
  add constraint facilities_updated_by_fkey
    foreign key (updated_by) references public.staff_profiles(id) on delete set null;

alter table public.staff_profiles
  drop constraint if exists staff_profiles_created_by_fkey,
  add constraint staff_profiles_created_by_fkey
    foreign key (created_by) references public.staff_profiles(id) on delete set null;

alter table public.staff_profiles
  drop constraint if exists staff_profiles_updated_by_fkey,
  add constraint staff_profiles_updated_by_fkey
    foreign key (updated_by) references public.staff_profiles(id) on delete set null;

-- 3) PATIENTS
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_code text not null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  sex text,
  dob date,
  blood_type text,
  phone text,
  address text,
  region text,
  allergies text,
  medical_history text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived', 'deceased')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, patient_code)
);

comment on table public.patients is
  'Facility-scoped patient master records used by clinical chart and encounter workflows.';

-- 4) VISITS
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_type text not null check (encounter_type in ('NURSING', 'MEDICAL', 'FOLLOW_UP', 'TRIAGE', 'OTHER')),
  chief_complaint text,
  diagnosis text,
  notes jsonb,
  visit_at timestamptz not null default now(),
  status text not null default 'completed' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.visits is
  'Clinical encounters timeline (nursing and medical visits, diagnosis and encounter context).';

-- 5) APPOINTMENTS
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_type text,
  scheduled_at timestamptz not null,
  assigned_staff_id uuid references public.staff_profiles(id) on delete set null,
  reason text,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.appointments is
  'Outpatient planning and scheduling queue for patient consultations and follow-ups.';

-- 6) INPATIENT ADMISSIONS
create table if not exists public.inpatient_admissions (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  ward text,
  bed_number text,
  admission_type text,
  admission_reason text,
  admitted_at timestamptz not null default now(),
  discharged_at timestamptz,
  status text not null default 'admitted' check (status in ('admitted', 'stable', 'critical', 'discharged', 'transferred', 'deceased')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.inpatient_admissions is
  'Hospitalization records for admitted patients, bed allocation, and discharge lifecycle.';

-- 7) LAB ORDERS
create table if not exists public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  ordered_test text not null,
  priority text default 'routine' check (priority in ('routine', 'urgent', 'stat')),
  result_summary text,
  result_data jsonb,
  status text not null default 'requested' check (status in ('requested', 'sample_collected', 'in_progress', 'completed', 'cancelled')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.lab_orders is
  'Laboratory test orders and results lifecycle tied to patients and optional encounters.';

-- 8) IMAGING ORDERS
create table if not exists public.imaging_orders (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  imaging_type text not null,
  priority text default 'routine' check (priority in ('routine', 'urgent', 'stat')),
  findings text,
  report_data jsonb,
  status text not null default 'requested' check (status in ('requested', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.imaging_orders is
  'Imaging requests (X-ray, ultrasound, CT, MRI, etc.) with reporting lifecycle.';

-- 9) MEDICATIONS
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  drug_name text not null,
  dosage text,
  frequency text,
  route text,
  duration text,
  instructions text,
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'cancelled')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.medications is
  'Medication prescriptions and administration plan tracked per patient and encounter.';

-- 10) INVOICES
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  invoice_number text not null,
  subtotal numeric(14,2) not null default 0,
  taxes numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  currency text not null default 'XAF',
  due_date date,
  paid_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, invoice_number)
);

comment on table public.invoices is
  'Billing and financial ledger for patient care services at facility scope.';

-- 11) AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  actor_staff_id uuid references public.staff_profiles(id) on delete set null,
  target_table text not null,
  target_id uuid,
  action text not null,
  reason text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb,
  status text not null default 'recorded' check (status in ('recorded', 'archived')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Immutable-style activity journal for traceability of clinical and administrative changes.';

-- 12) FACILITY SETTINGS
create table if not exists public.facility_settings (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  settings_key text not null,
  settings_value jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, settings_key)
);

comment on table public.facility_settings is
  'Per-facility configurable settings (feature flags, defaults, operational preferences).';

-- Indexes for tenant filtering and common lookups
create index if not exists idx_staff_profiles_facility on public.staff_profiles(facility_id);
create index if not exists idx_patients_facility on public.patients(facility_id);
create index if not exists idx_visits_facility_patient on public.visits(facility_id, patient_id, visit_at desc);
create index if not exists idx_appointments_facility_patient on public.appointments(facility_id, patient_id, scheduled_at desc);
create index if not exists idx_inpatient_facility_patient on public.inpatient_admissions(facility_id, patient_id, admitted_at desc);
create index if not exists idx_lab_orders_facility_patient on public.lab_orders(facility_id, patient_id, created_at desc);
create index if not exists idx_imaging_orders_facility_patient on public.imaging_orders(facility_id, patient_id, created_at desc);
create index if not exists idx_medications_facility_patient on public.medications(facility_id, patient_id, created_at desc);
create index if not exists idx_invoices_facility_patient on public.invoices(facility_id, patient_id, created_at desc);
create index if not exists idx_audit_logs_facility_created_at on public.audit_logs(facility_id, created_at desc);
create index if not exists idx_facility_settings_facility on public.facility_settings(facility_id);

-- updated_at triggers
create trigger trg_facilities_set_updated_at
before update on public.facilities
for each row execute function public.set_updated_at();

create trigger trg_staff_profiles_set_updated_at
before update on public.staff_profiles
for each row execute function public.set_updated_at();

create trigger trg_patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

create trigger trg_visits_set_updated_at
before update on public.visits
for each row execute function public.set_updated_at();

create trigger trg_appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create trigger trg_inpatient_admissions_set_updated_at
before update on public.inpatient_admissions
for each row execute function public.set_updated_at();

create trigger trg_lab_orders_set_updated_at
before update on public.lab_orders
for each row execute function public.set_updated_at();

create trigger trg_imaging_orders_set_updated_at
before update on public.imaging_orders
for each row execute function public.set_updated_at();

create trigger trg_medications_set_updated_at
before update on public.medications
for each row execute function public.set_updated_at();

create trigger trg_invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create trigger trg_audit_logs_set_updated_at
before update on public.audit_logs
for each row execute function public.set_updated_at();

create trigger trg_facility_settings_set_updated_at
before update on public.facility_settings
for each row execute function public.set_updated_at();

commit;
