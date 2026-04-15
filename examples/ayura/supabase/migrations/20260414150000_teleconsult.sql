-- =====================================================================
-- S-OPD-3 · Tele-consultation Sessions + in-call Rx
-- =====================================================================
-- Depends on: 20260414130000_opd_slots.sql (appointment_bookings, profiles)
--             20260414120000_fhir_abdm_core.sql (patients, encounters, medication_requests)
-- Adds: session_status enum, teleconsult_sessions
-- Patches: medication_requests — nullable teleconsult_session_id FK
-- All tables carry tenant_id + RLS via public.jwt_tenant()
-- =====================================================================

-- Enum
create type session_status as enum ('waiting', 'in-progress', 'ended', 'missed');

-- -----------------------------------------------------------------------
-- 1. teleconsult_sessions — one row per video-call attempt
-- -----------------------------------------------------------------------
create table public.teleconsult_sessions (
  id                     uuid primary key default uuid_generate_v4(),
  tenant_id              uuid not null references public.tenants(id) on delete cascade,
  appointment_booking_id uuid references public.appointment_bookings(id) on delete set null,
  patient_id             uuid references public.patients(id)   on delete set null,
  practitioner_id        uuid references public.profiles(id)   on delete set null,
  encounter_id           uuid references public.encounters(id) on delete set null,

  -- Room identifiers (Daily.co / LiveKit)
  room_name              text not null,   -- stable identifier e.g. "ayura-<uuid>"
  room_url               text not null,   -- full participant join URL

  status                 session_status not null default 'waiting',
  started_at             timestamptz,
  ended_at               timestamptz,

  -- Computed duration in seconds; null until ended
  duration_seconds       int generated always as (
                           extract(epoch from (ended_at - started_at))::int
                         ) stored,

  -- Clinical data captured during the call
  chief_complaint        text,
  diagnosis              text,
  notes                  text,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index teleconsult_sessions_practitioner_idx
  on public.teleconsult_sessions (tenant_id, practitioner_id, created_at desc);

create index teleconsult_sessions_patient_idx
  on public.teleconsult_sessions (tenant_id, patient_id, created_at desc);

create index teleconsult_sessions_booking_idx
  on public.teleconsult_sessions (tenant_id, appointment_booking_id);

alter table public.teleconsult_sessions enable row level security;

create policy "Tenant isolate teleconsult_sessions"
  on public.teleconsult_sessions for all
  using (tenant_id = public.jwt_tenant());

-- -----------------------------------------------------------------------
-- 2. Patch medication_requests — trace which tele-call generated the Rx
-- -----------------------------------------------------------------------
alter table public.medication_requests
  add column if not exists teleconsult_session_id uuid
    references public.teleconsult_sessions(id) on delete set null;

create index if not exists med_req_teleconsult_idx
  on public.medication_requests (teleconsult_session_id)
  where teleconsult_session_id is not null;
