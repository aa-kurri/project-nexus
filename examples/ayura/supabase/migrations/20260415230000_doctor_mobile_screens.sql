-- ============================================================
-- S-MOB-DOCTOR: Doctor Mobile Screens
-- Adds complaint field to queue_tokens, doctor_notes table for
-- SOAP scribe output, and RLS policies for doctor-scoped reads.
-- ============================================================
-- Depends on: 20260414120000_fhir_abdm_core.sql
--             20260415220000_mobile_rbac.sql

-- ── 1. Add complaint text to queue_tokens ───────────────────
-- Stores the patient's chief complaint captured at registration.
-- Displayed on the Queue screen alongside token and wait time.

alter table public.queue_tokens
  add column if not exists complaint text;

comment on column public.queue_tokens.complaint is
  'Chief complaint entered at triage / token issuance.';

-- ── 2. doctor_notes — SOAP note linked to an encounter ──────
-- Stores structured SOAP output from the AI Scribe and the raw
-- audio transcript. One note per encounter (upsert on encounter_id).

create table if not exists public.doctor_notes (
  id            uuid        primary key default gen_random_uuid(),
  tenant_id     uuid        not null references public.tenants(id) on delete cascade,
  encounter_id  uuid        not null references public.encounters(id) on delete cascade,
  patient_id    uuid        not null references public.patients(id) on delete cascade,
  author_id     uuid        not null references public.profiles(id),
  transcript    text,
  soap          jsonb       not null default '{}'::jsonb,
  -- soap shape: { "Subjective": "", "Objective": "", "Assessment": "", "Plan": "" }
  audio_path    text,       -- Supabase Storage path for raw audio blob
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint uq_doctor_note_encounter unique (tenant_id, encounter_id)
);

create index if not exists doctor_notes_patient_idx
  on public.doctor_notes (tenant_id, patient_id, created_at desc);

alter table public.doctor_notes enable row level security;

-- Author (prescribing doctor) can read and write their own notes
create policy "doctor_own_notes"
  on public.doctor_notes
  for all
  using (
    tenant_id = public.jwt_tenant()
    and author_id = auth.uid()
  )
  with check (
    tenant_id = public.jwt_tenant()
    and author_id = auth.uid()
  );

-- Admins and su can read all notes within tenant
create policy "admin_read_doctor_notes"
  on public.doctor_notes
  for select
  using (
    tenant_id = public.jwt_tenant()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'su')
    )
  );

-- updated_at trigger (reuse set_updated_at from mobile_rbac migration)
create trigger trg_doctor_notes_updated_at
  before update on public.doctor_notes
  for each row execute function public.set_updated_at();

-- ── 3. RLS — queue_tokens doctor view ───────────────────────
-- Doctors may read queue_tokens for their own practitioner_id.
-- (INSERT / UPDATE handled by triage staff via separate policy.)

do $$ begin
  -- Only add if not already present (idempotent)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'queue_tokens'
      and policyname  = 'doctor_read_own_queue'
  ) then
    execute $policy$
      create policy "doctor_read_own_queue"
        on public.queue_tokens
        for select
        using (
          tenant_id = public.jwt_tenant()
          and practitioner_id = auth.uid()
        )
    $policy$;
  end if;
end $$;

-- ── 4. RLS — encounters doctor view ─────────────────────────
-- Doctors may read encounters where they are the practitioner.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'encounters'
      and policyname  = 'doctor_read_own_encounters'
  ) then
    execute $policy$
      create policy "doctor_read_own_encounters"
        on public.encounters
        for select
        using (
          tenant_id       = public.jwt_tenant()
          and practitioner_id = auth.uid()
        )
    $policy$;
  end if;
end $$;

-- ── 5. RLS — medication_requests doctor write ───────────────
-- Prescribing doctors may insert medication_requests and stop
-- only their own prescriptions.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'medication_requests'
      and policyname  = 'doctor_manage_prescriptions'
  ) then
    execute $policy$
      create policy "doctor_manage_prescriptions"
        on public.medication_requests
        for all
        using (
          tenant_id     = public.jwt_tenant()
          and prescriber_id = auth.uid()
        )
        with check (
          tenant_id     = public.jwt_tenant()
          and prescriber_id = auth.uid()
        )
    $policy$;
  end if;
end $$;

-- ── 6. call_next_patient RPC ─────────────────────────────────
-- Atomically advances the queue for a doctor:
--   • Marks current in-consult token as done
--   • Sets the next waiting token to in-consult and records called_at
-- Returns the newly active token row or NULL if queue is empty.

create or replace function public.call_next_patient(
  p_practitioner_id uuid,
  p_tenant_id       uuid
)
returns setof public.queue_tokens
language plpgsql security definer as $$
declare
  v_today     date := current_date;
  v_current   uuid;
  v_next_id   uuid;
begin
  -- 1. Mark current in-consult token as done
  update public.queue_tokens
  set status = 'done', completed_at = now()
  where tenant_id       = p_tenant_id
    and practitioner_id = p_practitioner_id
    and token_date      = v_today
    and status          = 'in-consult';

  -- 2. Pick the next waiting token (lowest token_number)
  select id into v_next_id
  from public.queue_tokens
  where tenant_id       = p_tenant_id
    and practitioner_id = p_practitioner_id
    and token_date      = v_today
    and status          = 'waiting'
  order by token_number asc
  limit 1
  for update skip locked;

  if v_next_id is null then
    return;  -- queue exhausted
  end if;

  -- 3. Advance to in-consult
  update public.queue_tokens
  set status = 'in-consult', called_at = now()
  where id = v_next_id;

  return query
    select * from public.queue_tokens where id = v_next_id;
end;
$$;

comment on function public.call_next_patient is
  'Atomically transitions queue: done current in-consult, promotes next waiting. '
  'Called from mobile doctor app Queue screen.';
