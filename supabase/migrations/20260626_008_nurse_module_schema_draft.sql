-- CameroHealth Supabase v1.0
-- Phase 15 draft: production-grade nurse module schema and RLS policies
-- Safety: draft only. Validate in staging before applying to production.

begin;

-- Extend future role vocabulary without rewriting earlier draft policies.
alter table public.staff_profiles drop constraint if exists staff_profiles_role_check;
alter table public.staff_profiles
  add constraint staff_profiles_role_check check (
    role in ('ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'LAB', 'IMAGING', 'BILLING', 'PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST')
  );

create table if not exists public.body_map_markers (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  x_position numeric(5,2) not null check (x_position >= 0 and x_position <= 100),
  y_position numeric(5,2) not null check (y_position >= 0 and y_position <= 100),
  body_region text not null,
  laterality text check (laterality in ('left', 'right', 'midline', 'bilateral')),
  view_type text not null default 'anterior' check (view_type in ('anterior', 'posterior', 'left_lateral', 'right_lateral')),
  marker_type text not null check (marker_type in ('wound', 'pressure_injury', 'surgical_incision', 'iv_line', 'peg_tube', 'foley_catheter', 'trach', 'ostomy', 'drain', 'rash', 'bruise', 'edema', 'pain_point')),
  severity text not null default 'moderate' check (severity in ('low', 'moderate', 'high', 'critical')),
  status text not null default 'active' check (status in ('active', 'resolved', 'monitoring')),
  linked_entity_type text,
  linked_entity_id uuid,
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wounds (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  marker_id uuid references public.body_map_markers(id) on delete set null,
  wound_type text not null,
  anatomical_location text not null,
  laterality text,
  classification text,
  acquired_location text check (acquired_location in ('present_on_admission', 'facility_acquired', 'community_acquired', 'unknown')),
  onset_date date,
  status text not null default 'active' check (status in ('active', 'improving', 'worsening', 'healed', 'closed')),
  provider_notified boolean not null default false,
  follow_up_date date,
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wound_assessments (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  wound_id uuid not null references public.wounds(id) on delete cascade,
  assessed_at timestamptz not null default now(),
  length_cm numeric(8,2) not null check (length_cm >= 0),
  width_cm numeric(8,2) not null check (width_cm >= 0),
  depth_cm numeric(8,2) check (depth_cm >= 0),
  surface_area numeric(10,2) generated always as (round(length_cm * width_cm, 2)) stored,
  volume numeric(10,2) generated always as (case when depth_cm is null then null else round(length_cm * width_cm * depth_cm, 2) end) stored,
  undermining text,
  tunneling text,
  tissue_types jsonb not null default '[]'::jsonb,
  drainage_amount text,
  drainage_type text,
  odor text,
  periwound_condition text,
  pain_score integer check (pain_score between 0 and 10),
  infection_signs jsonb not null default '[]'::jsonb,
  treatment_plan text,
  dressing_type text,
  dressing_frequency text,
  offloading text,
  compression text,
  npwt boolean not null default false,
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wound_photos (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  wound_id uuid not null references public.wounds(id) on delete cascade,
  assessment_id uuid references public.wound_assessments(id) on delete set null,
  storage_path text not null,
  thumbnail_path text,
  photo_label text,
  taken_at timestamptz not null default now(),
  consent_confirmed boolean not null default false,
  created_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.wound_treatments (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  wound_id uuid not null references public.wounds(id) on delete cascade,
  treatment_type text not null,
  dressing_type text,
  medication_applied text,
  response text,
  performed_at timestamptz not null default now(),
  performed_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.nursing_assessments (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  assessment_type text not null default 'shift' check (assessment_type in ('triage', 'admission', 'shift', 'focused', 'discharge', 'home_care')),
  mental_status text,
  neuro jsonb not null default '{}'::jsonb,
  respiratory jsonb not null default '{}'::jsonb,
  cardiovascular jsonb not null default '{}'::jsonb,
  gi_gu jsonb not null default '{}'::jsonb,
  skin jsonb not null default '{}'::jsonb,
  mobility jsonb not null default '{}'::jsonb,
  pain jsonb not null default '{}'::jsonb,
  nutrition jsonb not null default '{}'::jsonb,
  safety_risks jsonb not null default '{}'::jsonb,
  escalation_required boolean not null default false,
  escalation_reason text,
  assessed_by uuid references public.staff_profiles(id) on delete set null,
  assessed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  note_type text not null check (note_type in ('nursing_note', 'wound_note', 'progress_note', 'incident_note', 'provider_notification', 'discharge_note')),
  title text,
  body text not null,
  structured_data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'signed', 'amended')),
  signed_at timestamptz,
  signed_by uuid references public.staff_profiles(id) on delete set null,
  amendments jsonb not null default '[]'::jsonb,
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  order_type text not null,
  title text not null,
  instructions text,
  priority text not null default 'routine' check (priority in ('routine', 'urgent', 'stat')),
  assigned_role text check (assigned_role in ('DOCTOR', 'NP', 'NURSE', 'CNA', 'LAB', 'IMAGING', 'BILLING')),
  assigned_staff_id uuid references public.staff_profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'held', 'completed', 'cancelled')),
  due_at timestamptz,
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  linked_order_id uuid references public.orders(id) on delete set null,
  linked_order_type text,
  title text not null,
  reason text,
  priority text not null default 'routine' check (priority in ('routine', 'urgent', 'stat')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'refused', 'missed', 'cancelled')),
  assigned_role text default 'NURSE' check (assigned_role in ('NURSE', 'CNA', 'DOCTOR', 'NP', 'LAB', 'IMAGING', 'BILLING')),
  assigned_staff_id uuid references public.staff_profiles(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  status_reason text,
  history jsonb not null default '[]'::jsonb,
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_plans (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  problem text,
  goal text,
  interventions jsonb not null default '[]'::jsonb,
  outcomes jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'met', 'not_met', 'discontinued')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  document_type text not null,
  title text not null,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'superseded', 'deleted')),
  created_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.audit_logs add column if not exists patient_id uuid references public.patients(id) on delete set null;
alter table public.audit_logs add column if not exists context jsonb not null default '{}'::jsonb;

create index if not exists idx_body_map_markers_patient on public.body_map_markers(patient_id, status);
create index if not exists idx_wounds_patient on public.wounds(patient_id, status);
create index if not exists idx_wound_assessments_wound on public.wound_assessments(wound_id, assessed_at desc);
create index if not exists idx_nursing_assessments_patient on public.nursing_assessments(patient_id, assessed_at desc);
create index if not exists idx_clinical_notes_patient on public.clinical_notes(patient_id, created_at desc);
create index if not exists idx_orders_patient on public.orders(patient_id, status);
create index if not exists idx_tasks_patient_status on public.tasks(patient_id, status);
create index if not exists idx_care_plans_patient on public.care_plans(patient_id, status);
create index if not exists idx_documents_patient on public.documents(patient_id, document_type);

create or replace function public.append_clinical_note_amendment(note_id uuid, amendment_body text)
returns public.clinical_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_note public.clinical_notes;
begin
  update public.clinical_notes
  set status = 'amended',
      amendments = amendments || jsonb_build_array(jsonb_build_object(
        'body', amendment_body,
        'actor_staff_id', public.current_staff_profile_id(),
        'at', now()
      )),
      updated_at = now(),
      updated_by = public.current_staff_profile_id()
  where id = note_id
    and status in ('signed', 'amended')
    and public.same_facility(facility_id)
    and public.has_clinical_role(array['ADMIN','DOCTOR','NP','NURSE'])
  returning * into updated_note;

  if updated_note.id is null then
    raise exception 'Clinical note cannot be amended or was not found';
  end if;

  return updated_note;
end;
$$;

create or replace function public.audit_nurse_module_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (facility_id, actor_staff_id, target_table, target_id, patient_id, action, context)
  values (
    coalesce(new.facility_id, old.facility_id),
    public.current_staff_profile_id(),
    tg_table_name,
    coalesce(new.id, old.id),
    coalesce(new.patient_id, old.patient_id),
    tg_op,
    jsonb_build_object('changed_at', now())
  );
  return coalesce(new, old);
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['body_map_markers','wounds','wound_assessments','wound_photos','wound_treatments','nursing_assessments','clinical_notes','orders','tasks','care_plans','documents'] loop
    execute format('drop trigger if exists trg_%I_audit on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_audit after insert or update or delete on public.%I for each row execute function public.audit_nurse_module_changes()', table_name, table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array['body_map_markers','wounds','wound_assessments','nursing_assessments','clinical_notes','orders','tasks','care_plans'] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

-- RLS
alter table public.body_map_markers enable row level security;
alter table public.wounds enable row level security;
alter table public.wound_assessments enable row level security;
alter table public.wound_photos enable row level security;
alter table public.wound_treatments enable row level security;
alter table public.nursing_assessments enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.orders enable row level security;
alter table public.tasks enable row level security;
alter table public.care_plans enable row level security;
alter table public.documents enable row level security;

alter table public.body_map_markers force row level security;
alter table public.wounds force row level security;
alter table public.wound_assessments force row level security;
alter table public.wound_photos force row level security;
alter table public.wound_treatments force row level security;
alter table public.nursing_assessments force row level security;
alter table public.clinical_notes force row level security;
alter table public.orders force row level security;
alter table public.tasks force row level security;
alter table public.care_plans force row level security;
alter table public.documents force row level security;

-- Care-team read access. Billing reads tasks/documents only through dedicated policies below.
do $$
declare table_name text;
begin
  foreach table_name in array array['body_map_markers','wounds','wound_assessments','wound_photos','wound_treatments','nursing_assessments','clinical_notes','orders','tasks','care_plans','documents'] loop
    execute format('drop policy if exists %I_select_care_team_own on public.%I', table_name, table_name);
    execute format($policy$
      create policy %I_select_care_team_own on public.%I
      for select to authenticated
      using (public.same_facility(facility_id) and public.has_clinical_role(array['ADMIN','DOCTOR','NP','NURSE','CNA','LAB','IMAGING']))
    $policy$, table_name, table_name);
  end loop;
end $$;

-- Nursing write policies.
do $$
declare table_name text;
begin
  foreach table_name in array array['body_map_markers','wounds','wound_assessments','wound_photos','wound_treatments','nursing_assessments','clinical_notes','tasks','care_plans','documents'] loop
    execute format('drop policy if exists %I_insert_nursing_own on public.%I', table_name, table_name);
    execute format($policy$
      create policy %I_insert_nursing_own on public.%I
      for insert to authenticated
      with check (public.same_facility(facility_id) and public.has_clinical_role(array['ADMIN','DOCTOR','NP','NURSE']))
    $policy$, table_name, table_name);

    execute format('drop policy if exists %I_update_nursing_own on public.%I', table_name, table_name);
    execute format($policy$
      create policy %I_update_nursing_own on public.%I
      for update to authenticated
      using (public.same_facility(facility_id) and public.has_clinical_role(array['ADMIN','DOCTOR','NP','NURSE']))
      with check (public.same_facility(facility_id) and public.has_clinical_role(array['ADMIN','DOCTOR','NP','NURSE']))
    $policy$, table_name, table_name);
  end loop;
end $$;

-- Provider orders can be created by providers and administered by nurses when assigned.
drop policy if exists orders_insert_provider_own on public.orders;
create policy orders_insert_provider_own on public.orders
for insert to authenticated
with check (public.same_facility(facility_id) and public.has_clinical_role(array['ADMIN','DOCTOR','NP','NURSE']));

drop policy if exists orders_update_provider_or_assigned_own on public.orders;
create policy orders_update_provider_or_assigned_own on public.orders
for update to authenticated
using (
  public.same_facility(facility_id)
  and (
    public.has_clinical_role(array['ADMIN','DOCTOR','NP'])
    or (assigned_role in ('NURSE','CNA') and public.has_clinical_role(array['NURSE','CNA']))
  )
)
with check (
  public.same_facility(facility_id)
  and (
    public.has_clinical_role(array['ADMIN','DOCTOR','NP'])
    or (assigned_role in ('NURSE','CNA') and public.has_clinical_role(array['NURSE','CNA']))
  )
);

-- Billing can see administrative task/document shell data for claims, without wound assessment write access.
drop policy if exists tasks_select_billing_own on public.tasks;
create policy tasks_select_billing_own on public.tasks
for select to authenticated
using (public.same_facility(facility_id) and public.has_clinical_role(array['BILLING']));

drop policy if exists documents_select_billing_own on public.documents;
create policy documents_select_billing_own on public.documents
for select to authenticated
using (public.same_facility(facility_id) and public.has_clinical_role(array['BILLING']));

comment on table public.body_map_markers is 'Clinical Avatar markers for visible patient body-map findings and device locations.';
comment on table public.wounds is 'Skin and wound problem list with location, classification, acquisition, and lifecycle status.';
comment on table public.wound_assessments is 'Serial wound measurements, tissue/drainage findings, treatment plan, and generated surface/volume calculations.';
comment on table public.nursing_assessments is 'Structured triage, shift, focused, admission, and discharge nursing assessments.';
comment on table public.clinical_notes is 'Signed and amendable clinical nursing/provider notes with immutable amendment trail.';
comment on table public.tasks is 'Nurse TaskFlow task queue generated manually or from provider orders.';
comment on table public.care_plans is 'Nursing care plans with goals, interventions, outcomes, and status.';

commit;
