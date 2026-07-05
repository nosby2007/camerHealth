create extension if not exists pgcrypto;

create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  facility_type text default 'acute_care',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  name text not null,
  code text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  department_id uuid references departments(id) on delete set null,
  name text not null,
  room_type text default 'inpatient',
  created_at timestamptz default now()
);

create table if not exists beds (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  status text default 'available',
  created_at timestamptz default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  mrn text not null unique,
  account_number text,
  first_name text not null,
  last_name text not null,
  dob date not null,
  gender text,
  code_status text default 'full',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists patient_contacts (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  contact_type text not null,
  full_name text not null,
  phone text,
  relationship text,
  created_at timestamptz default now()
);

create table if not exists patient_insurances (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  payer_name text not null,
  plan_name text,
  member_id text,
  policy_number text,
  created_at timestamptz default now()
);

create table if not exists encounters (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_type text default 'inpatient',
  status text default 'active',
  admitted_at timestamptz default now(),
  discharge_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists admissions (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  encounter_id uuid not null references encounters(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  admission_status text default 'admitted',
  admission_date timestamptz default now(),
  expected_discharge_date date,
  created_at timestamptz default now()
);

create table if not exists clinical_flags (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  flag_type text not null,
  description text,
  severity text default 'moderate',
  created_at timestamptz default now()
);

create table if not exists allergies (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  substance text not null,
  reaction text,
  severity text default 'moderate',
  created_at timestamptz default now()
);

create table if not exists precautions (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  precaution_type text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists diagnoses (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  diagnosis_code text,
  diagnosis_name text not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  medication_name text not null,
  route text,
  frequency text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  order_type text not null,
  category text,
  description text not null,
  status text default 'active',
  assigned_role text,
  assigned_user_id text,
  due_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists order_sets (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  name text not null,
  category text,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  assigned_role text,
  assigned_user_id text,
  source_type text,
  source_id text,
  title text not null,
  description text,
  priority text default 'routine',
  due_at timestamptz,
  status text default 'pending',
  completed_by text,
  completed_at timestamptz,
  audit_log_id text,
  created_at timestamptz default now()
);

create table if not exists worklists (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  name text not null,
  role_name text,
  created_at timestamptz default now()
);

create table if not exists nursing_assessments (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  assessment_type text not null,
  assessment_value text,
  created_at timestamptz default now()
);

create table if not exists flowsheet_templates (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists flowsheet_rows (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  template_id uuid not null references flowsheet_templates(id) on delete cascade,
  label text not null,
  required_documentation boolean default false,
  created_at timestamptz default now()
);

create table if not exists flowsheet_entries (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  row_id uuid references flowsheet_rows(id) on delete set null,
  entry_time timestamptz default now(),
  value text,
  comment text,
  signed boolean default false,
  audit_ref text,
  created_at timestamptz default now()
);

create table if not exists wounds (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  location text,
  wound_type text,
  stage text,
  length_cm numeric,
  width_cm numeric,
  depth_cm numeric,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists wound_assessments (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  wound_id uuid not null references wounds(id) on delete cascade,
  assessment_time timestamptz default now(),
  drainage text,
  odor text,
  pain_score int,
  provider_notified boolean default false,
  created_at timestamptz default now()
);

create table if not exists wound_photos (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  wound_id uuid not null references wounds(id) on delete cascade,
  file_path text not null,
  captured_at timestamptz default now()
);

create table if not exists wound_orders (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  wound_id uuid not null references wounds(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  dressing_type text,
  frequency text,
  follow_up_date date,
  created_at timestamptz default now()
);

create table if not exists body_map_markers (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  marker_type text not null,
  body_region text,
  laterality text,
  view_type text,
  x_position numeric,
  y_position numeric,
  severity text,
  status text default 'active',
  linked_entity_type text,
  linked_entity_id text,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists clinical_notes (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  note_type text not null,
  status text default 'draft',
  content text,
  amended_from_id uuid,
  version int default 1,
  signed_at timestamptz,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists care_plans (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  title text not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists education_records (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  topic text not null,
  delivered_at timestamptz default now(),
  delivered_by text,
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  document_type text,
  file_path text not null,
  uploaded_by text,
  created_at timestamptz default now()
);

create table if not exists blood_administration_records (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  blood_product text,
  status text default 'ordered',
  created_at timestamptz default now()
);

create table if not exists transfusion_checks (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  blood_record_id uuid not null references blood_administration_records(id) on delete cascade,
  check_type text not null,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists procedure_checklists (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  checklist_name text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists discharge_plans (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  expected_discharge_date date,
  expected_discharge_time text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists team_conferences (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  encounter_id uuid references encounters(id),
  topic text not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id) on delete cascade,
  patient_id uuid references patients(id),
  actor_role text,
  actor_user_id text,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz default now()
);

alter table facilities enable row level security;
alter table departments enable row level security;
alter table rooms enable row level security;
alter table beds enable row level security;
alter table patients enable row level security;
alter table patient_contacts enable row level security;
alter table patient_insurances enable row level security;
alter table encounters enable row level security;
alter table admissions enable row level security;
alter table clinical_flags enable row level security;
alter table allergies enable row level security;
alter table precautions enable row level security;
alter table diagnoses enable row level security;
alter table medications enable row level security;
alter table orders enable row level security;
alter table order_sets enable row level security;
alter table tasks enable row level security;
alter table worklists enable row level security;
alter table nursing_assessments enable row level security;
alter table flowsheet_templates enable row level security;
alter table flowsheet_rows enable row level security;
alter table flowsheet_entries enable row level security;
alter table wounds enable row level security;
alter table wound_assessments enable row level security;
alter table wound_photos enable row level security;
alter table wound_orders enable row level security;
alter table body_map_markers enable row level security;
alter table clinical_notes enable row level security;
alter table care_plans enable row level security;
alter table education_records enable row level security;
alter table documents enable row level security;
alter table blood_administration_records enable row level security;
alter table transfusion_checks enable row level security;
alter table procedure_checklists enable row level security;
alter table discharge_plans enable row level security;
alter table team_conferences enable row level security;
alter table audit_logs enable row level security;

create policy if not exists tenant_isolation_all on facilities for all to authenticated using (public.same_facility(id)) with check (public.same_facility(id));
create policy if not exists tenant_isolation_all on departments for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on rooms for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on beds for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on patients for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on patient_contacts for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on patient_insurances for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on encounters for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on admissions for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on clinical_flags for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on allergies for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on precautions for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on diagnoses for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on medications for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on orders for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on order_sets for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on tasks for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on worklists for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on nursing_assessments for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on flowsheet_templates for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on flowsheet_rows for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on flowsheet_entries for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on wounds for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on wound_assessments for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on wound_photos for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on wound_orders for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on body_map_markers for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on clinical_notes for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on care_plans for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on education_records for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on documents for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on blood_administration_records for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on transfusion_checks for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on procedure_checklists for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on discharge_plans for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on team_conferences for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
create policy if not exists tenant_isolation_all on audit_logs for all to authenticated using (public.same_facility(facility_id)) with check (public.same_facility(facility_id));
