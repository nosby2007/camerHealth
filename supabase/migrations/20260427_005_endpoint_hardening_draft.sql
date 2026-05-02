-- CameroHealth Supabase v1.0
-- Phase 12 draft: endpoint hardening support structures
-- File: 20260427_005_endpoint_hardening_draft.sql
--
-- Purpose:
--   1) Add database-backed idempotency support for secure endpoints.
--   2) Add staff invitation lifecycle table for pending/accepted/revoked/expired/failed states.
--
-- Safety:
--   - Draft only (do not apply directly to production)
--   - Additive changes only

begin;

create extension if not exists pgcrypto;

-- =============================================================================
-- 1) Idempotency table
-- =============================================================================

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  endpoint text not null,
  requester_id text not null,
  request_hash text not null,
  response_body jsonb,
  status text not null check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

comment on table public.idempotency_keys is
  'Stores endpoint idempotency keys and canonical response snapshots for replay-safe retries.';

create unique index if not exists uq_idempotency_key_endpoint_requester
  on public.idempotency_keys (key, endpoint, requester_id);

create index if not exists idx_idempotency_endpoint_created_at
  on public.idempotency_keys (endpoint, created_at desc);

create index if not exists idx_idempotency_expires_at
  on public.idempotency_keys (expires_at);

-- =============================================================================
-- 2) Staff invite lifecycle table
-- =============================================================================

create table if not exists public.pending_staff_invites (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  email text not null,
  staff_code text not null,
  role text not null check (role in ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'IMAGING')),
  first_name text not null,
  last_name text,
  phone text,
  title text,
  department text,
  invited_by_staff_id uuid references public.staff_profiles(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  staff_profile_id uuid references public.staff_profiles(id) on delete set null,
  status text not null check (status in ('pending', 'accepted', 'revoked', 'expired', 'failed')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  last_invited_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pending_staff_invites is
  'Invitation lifecycle state table for secure backend-managed staff onboarding.';

create unique index if not exists uq_pending_invite_facility_email_staff_code
  on public.pending_staff_invites (facility_id, email, staff_code);

create index if not exists idx_pending_invites_facility_status
  on public.pending_staff_invites (facility_id, status, expires_at);

create index if not exists idx_pending_invites_email_status
  on public.pending_staff_invites (email, status, expires_at);

-- =============================================================================
-- 3) updated_at trigger coverage
-- =============================================================================

create trigger trg_idempotency_keys_set_updated_at
before update on public.idempotency_keys
for each row execute function public.set_updated_at();

create trigger trg_pending_staff_invites_set_updated_at
before update on public.pending_staff_invites
for each row execute function public.set_updated_at();

commit;

-- =============================================================================
-- Validation queries (staging only)
-- =============================================================================

-- select endpoint, status, count(*) from public.idempotency_keys group by endpoint, status order by endpoint;
-- select status, count(*) from public.pending_staff_invites group by status order by status;
-- select * from public.pending_staff_invites where status = 'pending' and expires_at < now();
