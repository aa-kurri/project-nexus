-- =====================================================================
-- S-OPD-2 · OPD Slot Self-Booking Tables
-- =====================================================================
-- Depends on: 20260414120000_fhir_abdm_core.sql
-- Adds: appointment_slots, appointment_bookings
-- All tables carry tenant_id + RLS via public.jwt_tenant()
-- =====================================================================

-- Enums
create type slot_status    as enum ('available', 'booked', 'blocked', 'cancelled');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no-show');

-- ---------------------------------------------------------------------
-- 1. appointment_slots — practitioner availability grid
-- ---------------------------------------------------------------------
create table public.appointment_slots (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  practitioner_id uuid not null references public.profiles(id) on delete cascade,
  slot_date       date not null,
  start_time      time not null,   -- wall-clock IST, e.g. 09:30
  end_time        time not null,   -- typically start_time + 30 min
  status          slot_status not null default 'available',
  created_at      timestamptz not null default now()
);

create index appointment_slots_lookup_idx
  on public.appointment_slots (tenant_id, practitioner_id, slot_date, status);

alter table public.appointment_slots enable row level security;

create policy "Tenant isolate appointment_slots"
  on public.appointment_slots for all
  using (tenant_id = public.jwt_tenant());

-- ---------------------------------------------------------------------
-- 2. appointment_bookings — confirmed patient-slot mappings
-- ---------------------------------------------------------------------
create table public.appointment_bookings (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  slot_id         uuid not null references public.appointment_slots(id) on delete restrict,
  patient_id      uuid references public.patients(id) on delete set null,
  patient_name    text not null,   -- denormalised for fast display
  patient_phone   text not null,
  practitioner_id uuid not null references public.profiles(id),
  slot_date       date not null,
  start_time      time not null,
  status          booking_status not null default 'confirmed',
  reason          text,
  booked_by       uuid references public.profiles(id),  -- null = patient self-booked
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index appointment_bookings_patient_idx
  on public.appointment_bookings (tenant_id, patient_id, slot_date);
create index appointment_bookings_practitioner_date_idx
  on public.appointment_bookings (tenant_id, practitioner_id, slot_date);

alter table public.appointment_bookings enable row level security;

create policy "Tenant isolate appointment_bookings"
  on public.appointment_bookings for all
  using (tenant_id = public.jwt_tenant());
