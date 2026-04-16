-- ======================================
-- MIGRATION: 20260414000000_core_foundations.sql
-- ======================================
-- Initial Ayura OS Base Schema
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";
create extension if not exists "pg_trgm";

-- Admin: Delete Tenant Cascade
create or replace function public.delete_tenant_cascade(target_tenant_id uuid)
returns void language plpgsql security definer as $$
begin
  -- Check permission (only service_role or specific super-admins should call this)
  -- Perform deletes in order if cascade isn't fully covering
  delete from public.tenants where id = target_tenant_id;
end;
$$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

create or replace function public.jwt_tenant() returns uuid
language sql stable as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

-- Helper to allow to_tsvector in indexes/generated columns
create or replace function public.immutable_to_tsvector(config regconfig, text text)
returns tsvector language sql immutable as $$
  select to_tsvector(config, text);
$$;

-- 1. Tenants (Hospitals)
create type public.subscription_tier as enum ('free', 'basic', 'pro', 'enterprise');

create table public.tenant_subscriptions (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  tier public.subscription_tier not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  updated_at timestamptz default now()
);

create table if not exists public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subdomain text unique not null,
  created_at timestamptz default now()
);

-- 2. User Profiles
DO $$ BEGIN
  create type staff_role as enum ('su', 'admin', 'doctor', 'nurse', 'pharmacist', 'lab_manager', 'patient');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  tenant_id uuid references public.tenants(id) not null,
  role staff_role not null default 'patient',
  full_name text not null,
  department text, -- e.g. "Biochemistry", "Ward B"
  avatar_url text,
  fido2_public_key text, -- Zero-trust hardware key store
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;

-- Strict Tenant Isolation Policy
create policy "Isolate Profiles per Tenant"
  on public.profiles
  for all using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- 3. Tamper-Evident Audit Log (Epic 10)
create table if not exists public.audit_log (
  id bigserial primary key,
  tenant_id uuid references public.tenants(id) not null,
  actor_id uuid references public.profiles(id) not null,
  action text not null,
  payload jsonb not null,
  -- The cryptographic hash representing this row + previous row
  hash_signature text not null, 
  created_at timestamptz default now()
);

-- Trigger to prevent ANY updates or deletes to the audit log
create function prevent_audit_tampering() returns trigger as $$
begin
  raise exception 'TAMPERING DETECTED: Audit logs cannot be modified or deleted.';
end;
$$ language plpgsql;

create trigger trg_prevent_audit_tampering
  before update or delete on public.audit_log
  for each row execute function prevent_audit_tampering();

-- ======================================
-- MIGRATION: 20260414120000_fhir_abdm_core.sql
-- ======================================
-- =====================================================================
-- S-ABDM-1 · ABDM / FHIR R4 Core Clinical & Operational Schema
-- Sprint 0 · Foundations · Ayura OS
-- =====================================================================
-- Depends on: 20260414000000_core_foundations.sql (tenants, profiles, audit_log)
-- Scope: Patient, Encounter, Observation, Condition, MedicationRequest,
--        ServiceRequest, DiagnosticReport, AllergyIntolerance (FHIR R4)
--        + hospital-ops: beds, admissions, queue_tokens, lab_samples,
--          stock_stores, stock_items, stock_batches, stock_movements,
--          bills, bill_items.
-- All tables carry tenant_id + RLS. Audit log gains HMAC-SHA256 hash chain.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Required extensions + tenant JWT helper (Moved to top)
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
DO $$ BEGIN
  create type gender_kind as enum ('male', 'female', 'other', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type encounter_class as enum ('opd', 'ipd', 'emergency', 'tele', 'home');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type encounter_status as enum ('planned', 'arrived', 'in-progress', 'finished', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type admission_status as enum ('pending', 'admitted', 'discharged', 'transferred');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type bed_status as enum ('vacant', 'occupied', 'cleaning', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type queue_status as enum ('waiting', 'next', 'in-consult', 'done', 'no-show');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type observation_status as enum ('registered', 'preliminary', 'final', 'amended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type observation_flag as enum ('normal', 'low', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type service_request_status as enum ('draft', 'active', 'completed', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type diagnostic_report_status as enum ('registered', 'partial', 'final', 'amended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type medication_request_status as enum ('draft', 'active', 'completed', 'stopped', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type lab_sample_status as enum ('planned', 'collected', 'received', 'in-progress', 'resulted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type stock_movement_kind as enum ('receipt', 'dispense', 'transfer-out', 'transfer-in', 'adjustment', 'wastage');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type bill_status as enum ('draft', 'finalized', 'partially-paid', 'paid', 'void');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------
-- 2. Patient (FHIR R4)
-- ---------------------------------------------------------------------
create table if not exists public.patients (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  mrn           text not null,                        -- local medical record number
  abha_id       text,                                 -- ABDM Health ID (14-digit)
  abha_address  text,                                 -- username@abdm
  phone         text not null,                        -- +91 ...
  full_name     text not null,
  dob           date,
  gender        gender_kind not null default 'unknown',
  address_line  text,
  city          text,
  state         text,
  pincode       text,
  metadata      jsonb not null default '{}'::jsonb,   -- extensions, flags
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, mrn)
);
create index if not exists patients_phone_idx on public.patients (tenant_id, phone);
create index if not exists patients_abha_idx on public.patients (tenant_id, abha_id) where abha_id is not null;
create index if not exists patients_name_trgm_idx on public.patients using gin (full_name gin_trgm_ops);

-- ---------------------------------------------------------------------
-- 3. Encounter (FHIR R4)
-- ---------------------------------------------------------------------
create table if not exists public.encounters (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  patient_id     uuid not null references public.patients(id) on delete cascade,
  practitioner_id uuid references public.profiles(id),
  class          encounter_class not null,
  status         encounter_status not null default 'planned',
  reason         text,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  created_at     timestamptz not null default now()
);
-- Backfill columns added after initial deploy
alter table public.encounters add column if not exists started_at  timestamptz not null default now();
alter table public.encounters add column if not exists ended_at    timestamptz;
alter table public.encounters add column if not exists reason      text;
create table public.ot_rooms (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  status text not null default 'available',
  unique (tenant_id, name)
);

create table public.ot_bookings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id),
  patient_id uuid not null references public.patients(id),
  ot_id uuid not null references public.ot_rooms(id),
  surgeon_id uuid references public.profiles(id),
  anesthetist_id uuid references public.profiles(id),
  procedure_name text not null,
  status text not null default 'scheduled',
  scheduled_at timestamptz not null,
  duration_mins integer default 60,
  notes text,
  created_at timestamptz default now()
);

alter table public.admissions add column if not exists is_surgical boolean default false;
create index if not exists encounters_patient_idx on public.encounters (tenant_id, patient_id, started_at desc);

-- ---------------------------------------------------------------------
-- 4. OPD queue tokens  (drives S-OPD-1 Live Queue Board)
-- ---------------------------------------------------------------------
create table if not exists public.queue_tokens (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  practitioner_id uuid not null references public.profiles(id),
  encounter_id    uuid references public.encounters(id) on delete set null,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  token_number    int not null,                       -- #34, daily-reset
  token_date      date not null default current_date,
  status          queue_status not null default 'waiting',
  called_at       timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  unique (tenant_id, practitioner_id, token_date, token_number)
);
create index if not exists queue_tokens_live_idx on public.queue_tokens (tenant_id, token_date, practitioner_id, status);

-- ---------------------------------------------------------------------
-- 5. IPD bed board  (drives S-IPD-1 Drag-and-drop allocation)
-- ---------------------------------------------------------------------
create table if not exists public.beds (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  ward       text not null,          -- e.g., 'W2'
  label      text not null,          -- e.g., 'W2-08'
  status     bed_status not null default 'vacant',
  unique (tenant_id, label)
);
create index if not exists beds_tenant_status_idx on public.beds (tenant_id, status);

create table if not exists public.admissions (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  bed_id        uuid references public.beds(id) on delete set null,
  encounter_id  uuid references public.encounters(id) on delete set null,
  status        admission_status not null default 'admitted',
  admitted_at   timestamptz not null default now(),
  discharged_at timestamptz,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
create index if not exists admissions_active_idx on public.admissions (tenant_id, status, admitted_at desc);

-- ---------------------------------------------------------------------
-- 6. Observation (vitals + lab results)
-- ---------------------------------------------------------------------
create table if not exists public.observations (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  encounter_id  uuid references public.encounters(id) on delete set null,
  category      text not null default 'vital-signs', -- e.g. 'vital-signs', 'laboratory', 'imaging'
  code          text not null,                        -- LOINC/SNOMED
  code_system   text not null default 'http://loinc.org',
  display       text not null,
  value_num     numeric,
  value_unit    text,
  value_text    text,
  ref_low       numeric,
  ref_high      numeric,
  flag          observation_flag,
  status        observation_status not null default 'final',
  effective_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists observations_patient_idx on public.observations (tenant_id, patient_id, effective_at desc);

-- ---------------------------------------------------------------------
-- 7. Condition, Allergy, Procedure (summaries)
-- ---------------------------------------------------------------------
create table if not exists public.conditions (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  encounter_id  uuid references public.encounters(id) on delete set null,
  code          text not null,                 -- ICD-10 / SNOMED
  display       text not null,
  onset_at      timestamptz,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists conditions_patient_idx on public.conditions (tenant_id, patient_id);

create table if not exists public.allergies (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  patient_id  uuid not null references public.patients(id) on delete cascade,
  substance   text not null,
  reaction    text,
  severity    text,
  created_at  timestamptz not null default now()
);
create index if not exists allergies_patient_idx on public.allergies (tenant_id, patient_id);

-- ---------------------------------------------------------------------
-- 8. MedicationRequest (prescriptions)
-- ---------------------------------------------------------------------
create table if not exists public.medication_requests (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  patient_id     uuid not null references public.patients(id) on delete cascade,
  encounter_id   uuid references public.encounters(id) on delete set null,
  prescriber_id  uuid references public.profiles(id),
  drug_name      text not null,
  strength       text,
  route          text,
  dosage         text,                               -- "1 tab BID for 5 days"
  status         medication_request_status not null default 'active',
  authored_at    timestamptz not null default now()
);
create index if not exists mr_patient_idx on public.medication_requests (tenant_id, patient_id, authored_at desc);

-- ---------------------------------------------------------------------
-- 9. Lab Orders (ServiceRequest) + Samples + DiagnosticReport
-- ---------------------------------------------------------------------
create table if not exists public.service_requests (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  encounter_id  uuid references public.encounters(id) on delete set null,
  requester_id  uuid references public.profiles(id),
  code          text not null,                -- e.g., 'CBC', 'LFT'
  display       text not null,
  category      text not null default 'lab',
  status        service_request_status not null default 'active',
  requested_at  timestamptz not null default now()
);
create index if not exists sr_patient_idx on public.service_requests (tenant_id, patient_id, requested_at desc);

create table if not exists public.lab_samples (
  id                 uuid primary key default uuid_generate_v4(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  patient_id         uuid not null references public.patients(id) on delete cascade,
  barcode            text not null,
  container          text,
  status             lab_sample_status not null default 'planned',
  collected_at       timestamptz,
  received_at        timestamptz,
  created_at         timestamptz not null default now(),
  unique (tenant_id, barcode)
);
create index if not exists lab_samples_status_idx on public.lab_samples (tenant_id, status);

create table if not exists public.diagnostic_reports (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  encounter_id  uuid references public.encounters(id) on delete set null,
  service_request_id uuid references public.service_requests(id) on delete set null,
  code          text not null,
  display       text not null,
  status        diagnostic_report_status not null default 'registered',
  issued_at     timestamptz,
  signed_by     uuid references public.profiles(id),
  storage_path  text,                       -- signed-URL target in Supabase Storage
  created_at    timestamptz not null default now()
);
create index if not exists dr_patient_idx on public.diagnostic_reports (tenant_id, patient_id, issued_at desc);

-- ---------------------------------------------------------------------
-- 10. Pharmacy: stores → items → batches → movements
-- ---------------------------------------------------------------------
create table if not exists public.stock_stores (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  kind       text not null default 'main',    -- main | ward | icu | pharmacy
  unique (tenant_id, name)
);

create table if not exists public.stock_items (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  generic      text,
  form         text,                          -- tab | cap | syp | inj
  strength     text,
  hsn_sac      text,
  gst_pct      numeric(5,2) default 12.00,
  barcode      text,
  rol          int not null default 0,        -- re-order level
  preferred_supplier text,
  unique (tenant_id, name, strength)
);
create index if not exists stock_items_barcode_idx on public.stock_items (tenant_id, barcode) where barcode is not null;

create table if not exists public.stock_batches (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  item_id      uuid not null references public.stock_items(id) on delete cascade,
  store_id     uuid not null references public.stock_stores(id) on delete cascade,
  batch_no     text not null,
  expiry       date not null,
  mrp          numeric(10,2),
  quantity     int not null default 0,
  unique (tenant_id, item_id, store_id, batch_no)
);
create index if not exists stock_batches_fefo_idx on public.stock_batches (tenant_id, item_id, store_id, expiry);

create table if not exists public.stock_movements (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  item_id      uuid not null references public.stock_items(id) on delete cascade,
  batch_id     uuid references public.stock_batches(id) on delete set null,
  from_store   uuid references public.stock_stores(id),
  to_store     uuid references public.stock_stores(id),
  kind         stock_movement_kind not null,
  quantity     int not null,
  reference    text,                     -- Rx id / indent id / adjustment id
  actor_id     uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);
create index if not exists stock_movements_item_time_idx on public.stock_movements (tenant_id, item_id, created_at desc);

-- ---------------------------------------------------------------------
-- 11. Billing: header + line items (auto-capture from modules)
-- ---------------------------------------------------------------------
create table if not exists public.bills (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  patient_id   uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  number       text not null,
  status       bill_status not null default 'draft',
  subtotal     numeric(12,2) not null default 0,
  tax_total    numeric(12,2) not null default 0,
  grand_total  numeric(12,2) not null default 0,
  created_at   timestamptz not null default now(),
  finalized_at timestamptz,
  unique (tenant_id, number)
);
create index if not exists bills_encounter_idx on public.bills (tenant_id, encounter_id);

create table if not exists public.bill_items (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  bill_id     uuid not null references public.bills(id) on delete cascade,
  source      text not null,                 -- opd | ipd | lab | pharmacy
  ref_id      uuid,                          -- encounter/service_request/medication_request etc.
  description text not null,
  qty         numeric(10,2) not null default 1,
  unit_price  numeric(10,2) not null default 0,
  gst_pct     numeric(5,2) not null default 0,
  line_total  numeric(12,2) not null default 0
);
create index if not exists bill_items_bill_idx on public.bill_items (bill_id);

-- =====================================================================
-- RLS · Every table above isolates by tenant_id via JWT claim.
-- =====================================================================
alter table public.patients              enable row level security;
alter table public.encounters            enable row level security;
alter table public.queue_tokens          enable row level security;
alter table public.beds                  enable row level security;
alter table public.admissions            enable row level security;
alter table public.observations          enable row level security;
alter table public.conditions            enable row level security;
alter table public.allergies             enable row level security;
alter table public.medication_requests   enable row level security;
alter table public.service_requests      enable row level security;
alter table public.lab_samples           enable row level security;
alter table public.diagnostic_reports    enable row level security;
alter table public.stock_stores          enable row level security;
alter table public.stock_items           enable row level security;
alter table public.stock_batches         enable row level security;
alter table public.stock_movements       enable row level security;
alter table public.bills                 enable row level security;
alter table public.bill_items            enable row level security;

do $$
declare
  t text;
  targets text[] := array[
    'patients','encounters','queue_tokens','beds','admissions',
    'observations','conditions','allergies','medication_requests',
    'service_requests','lab_samples','diagnostic_reports',
    'stock_stores','stock_items','stock_batches','stock_movements',
    'bills','bill_items'
  ];
begin
  foreach t in array targets loop
    execute format($f$
      create policy tenant_isolation on public.%I
        for all
        using (tenant_id = public.jwt_tenant())
        with check (tenant_id = public.jwt_tenant())
    $f$, t);
  end loop;
end $$;

-- =====================================================================
-- S-AUDIT-1 foundation · HMAC-SHA256 hash chain on audit_log inserts
-- =====================================================================
-- The 20260414000000_core_foundations migration created audit_log
-- with a non-null `hash_signature` column but no population logic.
-- We compute: hash_signature = hmac(prev_hash || payload_canonical, secret).
-- The secret lives in pg settings (`app.audit_secret`) — rotation handled
-- outside SQL. If absent, the trigger raises to fail closed.
-- ---------------------------------------------------------------------

-- Canonicalize the row payload so both insert-time and audit-time
-- computations agree bit-for-bit. Kept as its own function so the
-- verifier stays in sync with the trigger.
create or replace function public.canonical_audit_payload(
  prev_hash text, p_tenant uuid, p_actor uuid,
  p_action text, p_payload jsonb, p_created_at timestamptz
) returns text language sql immutable as $$
  select
    coalesce(prev_hash, '') || '|' ||
    p_tenant::text || '|' || p_actor::text || '|' ||
    p_action || '|' || p_payload::text || '|' ||
    p_created_at::text
$$;

create or replace function public.compute_audit_hash() returns trigger
language plpgsql as $$
declare
  prev_hash text;
  secret text;
begin
  secret := current_setting('app.audit_secret', true);
  if secret is null or secret = '' then
    raise exception 'app.audit_secret not configured — audit chain cannot be sealed';
  end if;

  select hash_signature into prev_hash
    from public.audit_log
    where tenant_id = new.tenant_id
    order by id desc
    limit 1;

  if new.created_at is null then new.created_at := now(); end if;

  new.hash_signature := encode(
    hmac(
      public.canonical_audit_payload(
        prev_hash, new.tenant_id, new.actor_id,
        new.action, new.payload, new.created_at
      ),
      secret, 'sha256'
    ),
    'hex'
  );
  return new;
end;
$$;

drop trigger if exists trg_audit_hash_chain on public.audit_log;
create trigger trg_audit_hash_chain
  before insert on public.audit_log
  for each row execute function public.compute_audit_hash();

-- Integrity verifier: returns first broken row id (null = chain intact)
create or replace function public.verify_audit_chain(p_tenant uuid)
returns bigint language plpgsql stable as $$
declare
  r record;
  prev_hash text := null;
  expected text;
  secret text;
begin
  secret := current_setting('app.audit_secret', true);
  if secret is null then return null; end if;

  for r in
    select * from public.audit_log
     where tenant_id = p_tenant
     order by id asc
  loop
    expected := encode(
      hmac(
        public.canonical_audit_payload(
          prev_hash, r.tenant_id, r.actor_id,
          r.action, r.payload, r.created_at
        ),
        secret, 'sha256'
      ),
      'hex'
    );
    if expected <> r.hash_signature then
      return r.id;
    end if;
    prev_hash := r.hash_signature;
  end loop;
  return null;
end;
$$;

-- =====================================================================
-- Realtime publications · boards that listen live
-- =====================================================================
-- Supabase publishes to the `supabase_realtime` publication.
do $$
declare
  t text;
  live text[] := array['queue_tokens','beds','admissions','lab_samples','observations'];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;
  foreach t in array live loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- =====================================================================
-- Convenience: updated_at touch trigger (used by patients)
-- =====================================================================
create trigger trg_patients_touch before update on public.patients
  for each row execute function public.set_updated_at();

-- ======================================
-- MIGRATION: 20260414130000_opd_slots.sql
-- ======================================
-- =====================================================================
-- S-OPD-2 · OPD Slot Self-Booking Tables
-- =====================================================================
-- Depends on: 20260414120000_fhir_abdm_core.sql
-- Adds: appointment_slots, appointment_bookings
-- All tables carry tenant_id + RLS via public.jwt_tenant()
-- =====================================================================

-- Enums
DO $$ BEGIN
  create type slot_status    as enum ('available', 'booked', 'blocked', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no-show');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------
-- 1. appointment_slots — practitioner availability grid
-- ---------------------------------------------------------------------
create table if not exists public.appointment_slots (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  practitioner_id uuid not null references public.profiles(id) on delete cascade,
  slot_date       date not null,
  start_time      time not null,   -- wall-clock IST, e.g. 09:30
  end_time        time not null,   -- typically start_time + 30 min
  status          slot_status not null default 'available',
  created_at      timestamptz not null default now()
);

create index if not exists appointment_slots_lookup_idx
  on public.appointment_slots (tenant_id, practitioner_id, slot_date, status);

alter table public.appointment_slots enable row level security;

create policy "Tenant isolate appointment_slots"
  on public.appointment_slots for all
  using (tenant_id = public.jwt_tenant());

-- ---------------------------------------------------------------------
-- 2. appointment_bookings — confirmed patient-slot mappings
-- ---------------------------------------------------------------------
create table if not exists public.appointment_bookings (
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

create index if not exists appointment_bookings_patient_idx
  on public.appointment_bookings (tenant_id, patient_id, slot_date);
create index if not exists appointment_bookings_practitioner_date_idx
  on public.appointment_bookings (tenant_id, practitioner_id, slot_date);

alter table public.appointment_bookings enable row level security;

create policy "Tenant isolate appointment_bookings"
  on public.appointment_bookings for all
  using (tenant_id = public.jwt_tenant());

-- ======================================
-- MIGRATION: 20260414140000_wearable_ingest.sql
-- ======================================
-- =====================================================================
-- S-WEARABLE-1 · Wearable Data Ingest — observations extension
-- Sprint Antigravity · Ayura OS
-- =====================================================================
-- Depends on: 20260414120000_fhir_abdm_core.sql (observations table)
--
-- Adds a `metadata` JSONB column to observations so the wearable-ingest
-- Edge Function can persist source (apple_health | google_fit) and
-- ingested_at timestamp alongside FHIR Observation rows.
--
-- The observations table already carries tenant_id + RLS via the
-- blanket tenant_isolation policy created in the parent migration.
-- No new tables are needed; we just extend the existing schema.
-- =====================================================================

-- Add metadata column if it doesn't already exist (idempotent guard)
alter table public.observations
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Partial index speeds up queries that filter by wearable source
create index if not exists observations_wearable_source_idx
  on public.observations ((metadata ->> 'source'), tenant_id, patient_id)
  where metadata ->> 'source' in ('apple_health', 'google_fit', 'wearable');

-- =====================================================================
-- Helper view: wearable_observations
-- Exposes only rows that originated from a wearable device.
-- Inherits RLS from the base table — no extra policy needed.
-- =====================================================================
create or replace view public.wearable_observations
  with (security_invoker = true)
as
select
  o.id,
  o.tenant_id,
  o.patient_id,
  o.encounter_id,
  o.code,
  o.code_system,
  o.display,
  o.value_num,
  o.value_unit,
  o.flag,
  o.status,
  o.effective_at,
  o.created_at,
  o.metadata ->> 'source'       as wearable_source,
  o.metadata ->> 'ingested_at'  as ingested_at
from public.observations o
where o.metadata ->> 'source' in ('apple_health', 'google_fit', 'wearable');

comment on view public.wearable_observations is
  'Filtered view of FHIR Observations ingested from Apple Health or Google Fit. '
  'Inherits tenant RLS from public.observations.';

-- ======================================
-- MIGRATION: 20260414150000_teleconsult.sql
-- ======================================
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
DO $$ BEGIN
  create type session_status as enum ('waiting', 'in-progress', 'ended', 'missed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------
-- 1. teleconsult_sessions — one row per video-call attempt
-- -----------------------------------------------------------------------
create table if not exists public.teleconsult_sessions (
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
  -- Using (at time zone 'UTC') to make internal subtraction immutable
  duration_seconds       int generated always as (
                           extract(epoch from (
                             (ended_at at time zone 'UTC') - (started_at at time zone 'UTC')
                           ))::int
                         ) stored,

  -- Clinical data captured during the call
  chief_complaint        text,
  diagnosis              text,
  notes                  text,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists teleconsult_sessions_practitioner_idx
  on public.teleconsult_sessions (tenant_id, practitioner_id, created_at desc);

create index if not exists teleconsult_sessions_patient_idx
  on public.teleconsult_sessions (tenant_id, patient_id, created_at desc);

create index if not exists teleconsult_sessions_booking_idx
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

-- ======================================
-- MIGRATION: 20260415000000_lims_qc.sql
-- ======================================
-- =====================================================================
-- S-LIMS-5 · Levey–Jennings QC Chart — LIMS Quality Control Schema
-- =====================================================================
-- Depends on: 20260414000000_core_foundations.sql (tenants, audit_log)
-- Scope: Analyser registry, per-analyte QC targets, individual QC run
--        results with Westgard rule flags and generated z-score column.
-- All tables carry tenant_id + RLS policy using public.jwt_tenant().
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Analyser registry
--    Tracks all instruments (haematology, biochemistry, POC, etc.)
--    whose QC is managed within the tenant.
-- ---------------------------------------------------------------------
create table if not exists public.lims_analysers (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,             -- e.g. "Cobas c311 (Lab A)"
  model       text,                      -- e.g. "Roche Cobas c311"
  serial_no   text,
  department  text,                      -- e.g. "Biochemistry"
  active      boolean not null default true,
  created_at  timestamptz not null default now(),

  unique (tenant_id, serial_no)
);

alter table public.lims_analysers enable row level security;

create policy "tenant_isolation" on public.lims_analysers
  using (tenant_id = public.jwt_tenant());

-- ---------------------------------------------------------------------
-- 2. QC targets (mean + SD per analyser × analyte × effective date)
--    A new row is inserted when a new lot of QC material is introduced,
--    or after a calibration event that shifts the reference range.
-- ---------------------------------------------------------------------
create table if not exists public.lims_qc_targets (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id)       on delete cascade,
  analyser_id     uuid not null references public.lims_analysers(id) on delete cascade,
  analyte_code    text not null,          -- e.g. "GLU", "CREA"
  analyte_name    text not null,          -- display name
  unit            text not null,          -- e.g. "mmol/L"
  lot_number      text,                   -- QC material lot
  level           text not null default 'L1', -- QC level: L1 / L2 / L3
  target_mean     numeric(14, 6) not null,
  target_sd       numeric(14, 6) not null,
  effective_from  date not null default current_date,
  created_at      timestamptz not null default now(),

  unique (tenant_id, analyser_id, analyte_code, level, effective_from)
);

alter table public.lims_qc_targets enable row level security;

create policy "tenant_isolation" on public.lims_qc_targets
  using (tenant_id = public.jwt_tenant());

-- ---------------------------------------------------------------------
-- 3. QC run results
--    One row per QC measurement. The z_score column is generated so
--    range queries (e.g. WHERE abs(z_score) >= 2) stay efficient.
--    westgard_flags stores which rules fired (e.g. '{"1-2s","2-2s"}').
-- ---------------------------------------------------------------------
create table if not exists public.lims_qc_results (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references public.tenants(id)       on delete cascade,
  analyser_id      uuid not null references public.lims_analysers(id) on delete cascade,
  analyte_code     text not null,
  level            text not null default 'L1',
  run_number       integer not null,
  value            numeric(14, 6) not null,
  mean             numeric(14, 6) not null,  -- snapshot of target at run time
  sd               numeric(14, 6) not null,  -- snapshot of target at run time
  z_score          numeric(10, 4) generated always as (
                     (value - mean) / nullif(sd, 0)
                   ) stored,
  westgard_flags   text[]  not null default '{}',
  accepted         boolean not null default true,  -- false if rejected by Westgard
  operator_id      uuid references public.profiles(id) on delete set null,
  comment          text,
  run_at           timestamptz not null default now(),
  created_at       timestamptz not null default now(),

  unique (tenant_id, analyser_id, analyte_code, level, run_number, run_at)
);

alter table public.lims_qc_results enable row level security;

create policy "tenant_isolation" on public.lims_qc_results
  using (tenant_id = public.jwt_tenant());

-- Index: latest runs per (analyser, analyte) — used by Westgard 2-2s look-back
create index if not exists lims_qc_results_lookup_idx
  on public.lims_qc_results (tenant_id, analyser_id, analyte_code, level, run_at desc);

-- Index: fast z_score range scans for control-chart dashboards
create index if not exists lims_qc_results_zscore_idx
  on public.lims_qc_results (tenant_id, analyser_id, analyte_code, z_score);

-- ======================================
-- MIGRATION: 20260415010000_biometric_lock.sql
-- ======================================
-- =====================================================================
-- S-APP-3 · Biometric Lock on Launch — Patient App Security Schema
-- =====================================================================
-- Depends on: 20260414000000_core_foundations.sql (tenants, audit_log,
--               set_updated_at trigger function)
--             20260414120000_fhir_abdm_core.sql   (patients)
-- Scope: Per-patient biometric lock preferences, WebAuthn credential
--        store (one row per enrolled device), and an append-only audit
--        log of every lock/unlock event for HIPAA compliance.
-- All tables carry tenant_id + RLS policy using public.jwt_tenant().
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. patient_biometric_settings
--    One row per patient. Stores lock on/off flag, auto-lock timeout,
--    and the pgcrypto crypt() hash of the 6-digit fallback PIN.
-- ---------------------------------------------------------------------
create table if not exists public.patient_biometric_settings (
  id                uuid        primary key default uuid_generate_v4(),
  tenant_id         uuid        not null references public.tenants(id)  on delete cascade,
  patient_id        uuid        not null references public.patients(id) on delete cascade,
  lock_enabled      boolean     not null default false,
  lock_timeout_min  integer     not null default 5
                                check (lock_timeout_min in (1, 5, 15, 30)),
  pin_hash          text,                  -- pgcrypto crypt() hash of 6-digit PIN
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (tenant_id, patient_id)
);

alter table public.patient_biometric_settings enable row level security;

create policy "tenant_isolation" on public.patient_biometric_settings
  using (tenant_id = public.jwt_tenant());

-- Keep updated_at current on every write
create trigger set_updated_at
  before update on public.patient_biometric_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. patient_webauthn_credentials
--    Supports multiple enrolled devices per patient (phone, tablet,
--    laptop Windows Hello, etc.).  credential_id is the base64url-
--    encoded WebAuthn credential ID returned by the authenticator.
-- ---------------------------------------------------------------------
create table if not exists public.patient_webauthn_credentials (
  id              uuid        primary key default uuid_generate_v4(),
  tenant_id       uuid        not null references public.tenants(id)  on delete cascade,
  patient_id      uuid        not null references public.patients(id) on delete cascade,
  credential_id   text        not null,   -- base64url-encoded credential ID
  public_key_cbor text        not null,   -- base64url CBOR-encoded public key
  counter         bigint      not null default 0,
  device_name     text,                   -- user-friendly label, e.g. "iPhone 16 · Face ID"
  aaguid          text,                   -- authenticator AAGUID (used for device-type icon)
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz,

  unique (tenant_id, credential_id)
);

alter table public.patient_webauthn_credentials enable row level security;

create policy "tenant_isolation" on public.patient_webauthn_credentials
  using (tenant_id = public.jwt_tenant());

-- List all credentials for a patient (device management screen)
create index if not exists patient_webauthn_creds_patient_idx
  on public.patient_webauthn_credentials (tenant_id, patient_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. patient_lock_events
--    Append-only audit trail of every lock/unlock attempt.
--    event_type drives HIPAA reporting; success = false marks
--    suspicious activity that can trigger an alert after N failures.
-- ---------------------------------------------------------------------
create table if not exists public.patient_lock_events (
  id           uuid        primary key default uuid_generate_v4(),
  tenant_id    uuid        not null references public.tenants(id)  on delete cascade,
  patient_id   uuid        not null references public.patients(id) on delete cascade,
  event_type   text        not null
               check (event_type in (
                 'locked',
                 'unlock_biometric',
                 'unlock_pin',
                 'unlock_failed',
                 'setup_biometric',
                 'setup_pin',
                 'disable_lock',
                 'change_pin',
                 'revoke_credential'
               )),
  method       text,                    -- 'webauthn' | 'pin' | 'auto' | null
  success      boolean     not null,
  ip_address   inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);

alter table public.patient_lock_events enable row level security;

create policy "tenant_isolation" on public.patient_lock_events
  using (tenant_id = public.jwt_tenant());

-- Retention / purge index — events older than 90 days can be archived
create index if not exists patient_lock_events_age_idx
  on public.patient_lock_events (tenant_id, created_at);

-- Fast lookup: recent failures per patient (brute-force detection)
create index if not exists patient_lock_events_failures_idx
  on public.patient_lock_events (tenant_id, patient_id, success, created_at desc)
  where success = false;

-- ======================================
-- MIGRATION: 20260415020000_document_vault.sql
-- ======================================
-- =====================================================================
-- S-EMR-3 · Document Vault with Signed URLs
-- =====================================================================
-- Depends on: 20260414000000_core_foundations.sql (tenants, profiles,
--               audit_log, set_updated_at trigger function)
--             20260414120000_fhir_abdm_core.sql (patients, encounters)
-- Scope: Per-patient document metadata, Supabase Storage object paths,
--        checksum integrity, soft-delete, and an append-only access-log
--        that captures every signed-URL generation for HIPAA compliance.
-- All tables carry tenant_id + RLS policy using public.jwt_tenant().
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. patient_documents
--    Stores document metadata; the actual binary lives in Supabase
--    Storage at storage_path.  Soft-delete via deleted_at ensures audit
--    continuity — rows are never physically removed.
-- ---------------------------------------------------------------------
create table if not exists public.patient_documents (
  id               uuid        primary key default uuid_generate_v4(),
  tenant_id        uuid        not null references public.tenants(id)     on delete cascade,
  patient_id       uuid        not null references public.patients(id)    on delete cascade,
  encounter_id     uuid                    references public.encounters(id) on delete set null,

  -- Classification
  doc_type         text        not null
                   check (doc_type in (
                     'lab_report',
                     'discharge_summary',
                     'prescription',
                     'imaging',
                     'referral_letter',
                     'insurance_form',
                     'consent_form',
                     'other'
                   )),

  -- File metadata
  name             text        not null,       -- Display name shown to user
  storage_path     text        not null,       -- Supabase Storage object key
  mime_type        text        not null default 'application/octet-stream',
  size_bytes       bigint      not null default 0,
  checksum_sha256  text,                       -- hex SHA-256 for integrity checks

  -- Provenance
  uploaded_by      uuid        references public.profiles(id) on delete set null,

  -- Soft delete — NULL means active
  deleted_at       timestamptz,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.patient_documents enable row level security;

create policy "tenant_isolation" on public.patient_documents
  using (tenant_id = public.jwt_tenant());

-- Keep updated_at current on every write
create trigger set_updated_at
  before update on public.patient_documents
  for each row execute function public.set_updated_at();

-- Active documents for a patient, newest first (primary list query)
create index if not exists patient_documents_patient_idx
  on public.patient_documents (tenant_id, patient_id, created_at desc)
  where deleted_at is null;

-- Filter by doc_type within a patient chart
create index if not exists patient_documents_type_idx
  on public.patient_documents (tenant_id, patient_id, doc_type, created_at desc)
  where deleted_at is null;

-- Full-text search on document name
create index if not exists patient_documents_name_fts_idx
  on public.patient_documents using gin (public.immutable_to_tsvector('english', name))
  where deleted_at is null;

-- ---------------------------------------------------------------------
-- 2. document_access_log
--    Append-only audit trail of every vault action.
--    signed_url_expires_at is populated only for 'view' / 'download'
--    actions where a Supabase Storage signed URL was generated.
--    This table is intentionally never updated (audit integrity).
-- ---------------------------------------------------------------------
create table if not exists public.document_access_log (
  id                    uuid        primary key default uuid_generate_v4(),
  tenant_id             uuid        not null references public.tenants(id)           on delete cascade,
  document_id           uuid        not null references public.patient_documents(id) on delete cascade,

  accessed_by           uuid        references public.profiles(id) on delete set null,
  action                text        not null
                        check (action in ('upload', 'view', 'download', 'delete')),

  -- Signed URL metadata (non-null for view / download)
  signed_url_expires_at timestamptz,

  -- Caller context
  ip_address            inet,
  user_agent            text,

  created_at            timestamptz not null default now()
);

alter table public.document_access_log enable row level security;

create policy "tenant_isolation" on public.document_access_log
  using (tenant_id = public.jwt_tenant());

-- Retention / purge index — events older than 7 years can be archived
create index if not exists document_access_log_age_idx
  on public.document_access_log (tenant_id, created_at);

-- Per-document access history (used by the audit panel)
create index if not exists document_access_log_doc_idx
  on public.document_access_log (tenant_id, document_id, created_at desc);

-- Detect suspicious bulk-download patterns per user
create index if not exists document_access_log_user_idx
  on public.document_access_log (tenant_id, accessed_by, action, created_at desc);

-- ======================================
-- MIGRATION: 20260415030000_ipd_dashboard.sql
-- ======================================
-- =====================================================================
-- S-IPD-2 · IP Admissions Dashboard — Supporting Views & Policies
-- =====================================================================
-- Depends on:
--   20260414000000_core_foundations.sql  (tenants, profiles, audit_log)
--   20260414120000_fhir_abdm_core.sql    (patients, encounters,
--                                         beds, admissions)
-- Scope:
--   1. Ensure RLS is active on beds + admissions (idempotent guards).
--   2. ipd_ward_summary  — materialised view for ward-wise KPIs,
--      refreshed by a trigger on beds.
--   3. ipd_daily_census  — view returning admission / discharge counts
--      per calendar day (last 30 days) for trend sparklines.
--   4. Helper function: public.ipd_avg_los(p_tenant uuid)
--      Returns average length-of-stay in hours for active admissions.
-- All objects are tenant-scoped via public.jwt_tenant().
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Harden RLS on beds & admissions (safe to re-run)
-- ---------------------------------------------------------------------

alter table public.beds      enable row level security;
alter table public.admissions enable row level security;

-- beds: tenant isolation
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'beds'
      and policyname = 'tenant_isolation'
  ) then
    create policy "tenant_isolation" on public.beds
      using (tenant_id = public.jwt_tenant());
  end if;
end $$;

-- admissions: tenant isolation
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'admissions'
      and policyname = 'tenant_isolation'
  ) then
    create policy "tenant_isolation" on public.admissions
      using (tenant_id = public.jwt_tenant());
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. ipd_ward_summary view
--    Returns one row per (tenant_id, ward) with occupancy counts.
--    The dashboard client reads this instead of scanning all beds rows.
-- ---------------------------------------------------------------------

create or replace view public.ipd_ward_summary as
select
  tenant_id,
  ward,
  count(*)                                           as total_beds,
  count(*) filter (where status = 'occupied')        as occupied,
  count(*) filter (where status = 'vacant')          as vacant,
  count(*) filter (where status = 'cleaning')        as cleaning,
  round(
    count(*) filter (where status = 'occupied')::numeric
    / nullif(count(*), 0) * 100
  , 1)                                               as occupancy_pct
from  public.beds
group by tenant_id, ward;

-- RLS is inherited from the underlying beds table; the view is
-- automatically tenant-scoped because every row carries tenant_id.

-- ---------------------------------------------------------------------
-- 3. ipd_daily_census view
--    Admission + discharge counts per calendar day (UTC), last 30 days.
--    Powers the trend sparkline on the dashboard.
-- ---------------------------------------------------------------------

create or replace view public.ipd_daily_census as
with days as (
  select generate_series(
    (current_date - interval '29 days')::date,
    current_date,
    interval '1 day'
  )::date as census_date
),
admits as (
  select
    tenant_id,
    admitted_at::date as census_date,
    count(*)          as admissions
  from  public.admissions
  where admitted_at >= current_date - interval '29 days'
  group by tenant_id, admitted_at::date
),
discharges as (
  select
    tenant_id,
    discharged_at::date as census_date,
    count(*)            as discharges
  from  public.admissions
  where discharged_at is not null
    and discharged_at >= current_date - interval '29 days'
  group by tenant_id, discharged_at::date
)
select
  coalesce(a.tenant_id, d.tenant_id)       as tenant_id,
  coalesce(a.census_date, d.census_date)   as census_date,
  coalesce(a.admissions,  0)               as admissions,
  coalesce(d.discharges,  0)               as discharges
from  admits a
full  outer join discharges d
  on  a.tenant_id   = d.tenant_id
  and a.census_date = d.census_date
order by census_date;

-- ---------------------------------------------------------------------
-- 4. public.ipd_avg_los(p_tenant uuid)
--    Returns average length-of-stay (hours) for currently active
--    admissions belonging to the given tenant.
--    Used by server actions; Realtime clients compute this client-side.
-- ---------------------------------------------------------------------

create or replace function public.ipd_avg_los(p_tenant uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select round(
    avg(
      extract(epoch from (
        coalesce(discharged_at, now()) - admitted_at
      )) / 3600
    )::numeric,
    1
  )
  from  public.admissions
  where tenant_id = p_tenant
    and status    = 'admitted';
$$;

-- Only the service-role key (used by server actions) may call this.
-- Authenticated users interact through the views/RLS-governed tables.
revoke all on function public.ipd_avg_los(uuid) from public, anon;
grant  execute on function public.ipd_avg_los(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Composite index to accelerate daily census aggregation
-- ---------------------------------------------------------------------

create index if not exists admissions_admitted_date_idx
  on public.admissions (tenant_id, ((admitted_at at time zone 'UTC')::date));

create index if not exists admissions_discharged_date_idx
  on public.admissions (tenant_id, ((discharged_at at time zone 'UTC')::date))
  where discharged_at is not null;

-- ======================================
-- MIGRATION: 20260415170000_tenant_branding.sql
-- ======================================
-- S-SAAS-5: White-label tenant branding
-- Add custom domain, logo, and color customization per tenant

alter table public.tenants add column if not exists custom_domain  text unique;
alter table public.tenants add column if not exists logo_url       text;
alter table public.tenants add column if not exists primary_color  text default '#0F766E';
alter table public.tenants add column if not exists display_name   text;

-- RLS Policy: Tenants can read their own branding
alter table public.tenants enable row level security;

create policy "Tenants can read own branding"
  on public.tenants
  for select using (
    id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Allow service role (via middleware) to read by custom_domain
create policy "Service role reads tenants by domain"
  on public.tenants
  for select using (true);

-- ======================================
-- MIGRATION: 20260415190000_memory_forge.sql
-- ======================================
-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Agent Memories table for "Cognitive Checkpoints"
-- This table allows AI agents to store key decisions, context snapshots, 
-- and logic patterns to be recalled semantically, saving tokens by avoiding 
-- repetitive large-context prompts.
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT public.jwt_tenant(),
  agent_id TEXT NOT NULL,           -- The identity of the agent (e.g., 'story-builder', 'lims-bot')
  content TEXT NOT NULL,            -- The actual logic/decision/context to remember
  embedding vector(1536),           -- OpenAI or similar embedding for semantic search
  tags TEXT[] DEFAULT '{}',         -- Searchable keywords
  metadata JSONB DEFAULT '{}',      -- Extra context (run_id, story_slug, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- RLS for multi-tenant safety
  CONSTRAINT tenant_id_check CHECK (tenant_id IS NOT NULL)
);

-- Index for tags
create index if not exists idx_agent_memories_tags ON agent_memories USING GIN (tags);

-- Enable RLS
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policy (scoped to tenant)
CREATE POLICY "Users can only see memories from their tenant"
ON agent_memories
FOR ALL
USING (tenant_id = public.jwt_tenant());

-- Helper function for semantic search
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_agent_id text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity float,
  tags TEXT[],
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) AS similarity,
    m.tags,
    m.metadata
  FROM agent_memories m
  WHERE (p_agent_id IS NULL OR m.agent_id = p_agent_id)
    AND (1 - (m.embedding <=> query_embedding) > match_threshold)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ======================================
-- MIGRATION: 20260415200000_marketing_leads.sql
-- ======================================
-- ─── S-SAAS-1: Marketing Leads ───────────────────────────────────────────────
-- Stores inbound demo requests captured on the public landing page.
-- tenant_id is a soft reference to the provisioned tenant once the lead
-- converts; pre-conversion rows use a well-known sentinel UUID so RLS can
-- still satisfy the NOT NULL constraint via the service-role insert.

CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  hospital_name text        NOT NULL,
  contact_name  text        NOT NULL,
  email         text        NOT NULL,
  phone         text,
  bed_count     text,
  message       text,
  source        text        NOT NULL DEFAULT 'landing_page',
  -- lifecycle
  status        text        NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'converted', 'lost')),
  converted_at  timestamptz,
  -- audit
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS marketing_leads_tenant_id_idx ON public.marketing_leads (tenant_id);
CREATE INDEX IF NOT EXISTS marketing_leads_email_idx      ON public.marketing_leads (email);
CREATE INDEX IF NOT EXISTS marketing_leads_status_idx     ON public.marketing_leads (status);

-- ── Updated-at trigger ────────────────────────────────────────────────────────

CREATE TRIGGER marketing_leads_updated_at
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

-- Internal staff (authenticated, same tenant) can read their own leads.
CREATE POLICY "tenant_select_leads"
  ON public.marketing_leads
  FOR SELECT
  USING (tenant_id = public.jwt_tenant());

-- Internal staff can update lead status / notes.
CREATE POLICY "tenant_update_leads"
  ON public.marketing_leads
  FOR UPDATE
  USING (tenant_id = public.jwt_tenant())
  WITH CHECK (tenant_id = public.jwt_tenant());

-- Public (anon) inserts are intentionally handled via service-role in the
-- server action; no anon INSERT policy is granted here.

-- ======================================
-- MIGRATION: 20260415210000_webauthn_staff.sql
-- ======================================
-- =====================================================================
-- S-AUTH-HWKEY · Zero-Trust Hardware Key Pairing — Staff FIDO2 Schema
-- =====================================================================
-- Depends on: 20260414000000_core_foundations.sql (tenants, profiles,
--               jwt_tenant(), set_updated_at trigger)
-- Scope: Per-staff WebAuthn/FIDO2 credential store (one row per enrolled
--        hardware key / passkey) and an append-only audit trail of every
--        registration and revocation event for Zero-Trust compliance.
-- All tables carry tenant_id NOT NULL + RLS policy via public.jwt_tenant().
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. webauthn_credentials
--    Supports multiple enrolled security keys per staff member
--    (YubiKey, Windows Hello, Touch ID on MacBook, etc.).
--    credential_id is the base64url-encoded credential ID returned by
--    the FIDO2 authenticator; it is unique per tenant to prevent
--    cross-hospital credential re-use.
-- ---------------------------------------------------------------------
create table if not exists public.webauthn_credentials (
  id              uuid        primary key default uuid_generate_v4(),
  tenant_id       uuid        not null references public.tenants(id)   on delete cascade,
  staff_id        uuid        not null references public.profiles(id)  on delete cascade,
  credential_id   text        not null,          -- base64url authenticator credential ID
  public_key_cbor text        not null,          -- base64url CBOR-encoded public key
  counter         bigint      not null default 0,-- signature counter for replay protection
  device_name     text,                          -- user label: "YubiKey 5C", "MacBook Touch ID"
  aaguid          text,                          -- authenticator AAGUID for device-type icon
  transports      text[],                        -- ["usb","nfc","ble","internal"] subset
  backed_up       boolean     not null default false, -- passkey cloud backup flag
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz,

  -- Credential IDs must be unique within a tenant (prevents cross-account abuse)
  unique (tenant_id, credential_id)
);

alter table public.webauthn_credentials enable row level security;

create policy "tenant_isolation" on public.webauthn_credentials
  for all
  using  (tenant_id = public.jwt_tenant())
  with check (tenant_id = public.jwt_tenant());

-- Staff can only see their own keys (defence-in-depth on top of tenant isolation)
create policy "owner_isolation" on public.webauthn_credentials
  for all
  using (staff_id = auth.uid());

-- Fast lookup for authentication flow (challenge verification)
create index if not exists webauthn_credentials_lookup_idx
  on public.webauthn_credentials (tenant_id, credential_id);

-- Device management list (staff settings page)
create index if not exists webauthn_credentials_staff_idx
  on public.webauthn_credentials (tenant_id, staff_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. staff_webauthn_events
--    Append-only audit trail of every registration, revocation, and
--    authentication attempt. Drives Zero-Trust alerting (N consecutive
--    failures, registration from unknown IP, etc.).
--    Immutable: only INSERT is permitted via the prevent_delete trigger.
-- ---------------------------------------------------------------------
create table if not exists public.staff_webauthn_events (
  id             uuid        primary key default uuid_generate_v4(),
  tenant_id      uuid        not null references public.tenants(id)   on delete cascade,
  staff_id       uuid        not null references public.profiles(id)  on delete cascade,
  credential_id  text,                           -- null for failed attempts before lookup
  event_type     text        not null
                 check (event_type in (
                   'register_challenge_issued',
                   'register_success',
                   'register_failed',
                   'auth_challenge_issued',
                   'auth_success',
                   'auth_failed',
                   'revoke_success'
                 )),
  success        boolean     not null,
  ip_address     inet,
  user_agent     text,
  rp_id          text,                           -- relying party ID for cross-origin audit
  created_at     timestamptz not null default now()
);

alter table public.staff_webauthn_events enable row level security;

create policy "tenant_isolation" on public.staff_webauthn_events
  for all
  using  (tenant_id = public.jwt_tenant())
  with check (tenant_id = public.jwt_tenant());

-- Retention / SIEM export index
create index if not exists staff_webauthn_events_age_idx
  on public.staff_webauthn_events (tenant_id, created_at desc);

-- Brute-force detection: recent failures per staff member
create index if not exists staff_webauthn_events_failures_idx
  on public.staff_webauthn_events (tenant_id, staff_id, success, created_at desc)
  where success = false;

-- Prevent tampering (mirror of audit_log protection)
create function public.prevent_webauthn_event_tampering()
returns trigger language plpgsql as $$
begin
  raise exception 'ZERO-TRUST VIOLATION: staff_webauthn_events rows cannot be modified or deleted.';
end;
$$;

create trigger trg_prevent_webauthn_event_tampering
  before update or delete on public.staff_webauthn_events
  for each row execute function public.prevent_webauthn_event_tampering();

-- ======================================
-- MIGRATION: 20260415220000_mobile_rbac.sql
-- ======================================
-- S-MOB-RBAC: Mobile RBAC — Role-based Nav Shell
-- Adds mobile_role enum and mobile_feature_flags table.
-- profiles.role already defined as staff_role in 20260414000000_core_foundations.sql.

-- ── 1. Mobile role enum (maps staff_role groups to 4 mobile personas) ────────
create type public.mobile_role as enum ('patient', 'doctor', 'admin', 'staff');

-- Helper: derive mobile_role from staff_role stored in JWT / profile
create or replace function public.to_mobile_role(p_role public.staff_role)
  returns public.mobile_role
  language sql immutable parallel safe as $$
    select case p_role
      when 'patient'     then 'patient'::public.mobile_role
      when 'doctor'      then 'doctor'::public.mobile_role
      when 'su'          then 'admin'::public.mobile_role
      when 'admin'       then 'admin'::public.mobile_role
      else                    'staff'::public.mobile_role   -- nurse, pharmacist, lab_manager
    end;
$$;

-- ── 2. Mobile feature flags — role × feature matrix per tenant ───────────────
create table if not exists public.mobile_feature_flags (
  id          uuid          primary key default gen_random_uuid(),
  tenant_id   uuid          not null references public.tenants(id) on delete cascade,
  feature_key text          not null,
  label       text          not null,
  mobile_role public.mobile_role not null,
  enabled     boolean       not null default true,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now(),
  constraint uq_flag unique (tenant_id, feature_key, mobile_role)
);

alter table public.mobile_feature_flags enable row level security;

-- Only same-tenant rows visible; only admins may mutate
create policy "tenant_isolate_feature_flags"
  on public.mobile_feature_flags
  for select
  using (tenant_id = public.jwt_tenant());

create policy "admin_manage_feature_flags"
  on public.mobile_feature_flags
  for all
  using (
    tenant_id = public.jwt_tenant()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'su')
    )
  )
  with check (tenant_id = public.jwt_tenant());

-- updated_at trigger
create trigger trg_mobile_flags_updated_at
  before update on public.mobile_feature_flags
  for each row execute function public.set_updated_at();

-- ── 3. Seed default feature flags for every existing tenant ─────────────────
-- Inserts the cross-product of standard features × roles.
-- Hospitals can customise per-tenant after the fact.
do $$
declare
  r record;
begin
  for r in select id from public.tenants loop
    insert into public.mobile_feature_flags (tenant_id, feature_key, label, mobile_role, enabled)
    values
      -- patient features
      (r.id, 'lab_results',       'Lab Results',        'patient', true),
      (r.id, 'appointments',      'Appointments',       'patient', true),
      (r.id, 'health_timeline',   'Health Timeline',    'patient', true),
      (r.id, 'teleconsult',       'Teleconsult',        'patient', true),
      (r.id, 'rx_history',        'Rx History',         'patient', false),
      -- doctor features
      (r.id, 'opd_queue',         'OPD Queue',          'doctor', true),
      (r.id, 'ai_scribe',         'AI Scribe',          'doctor', true),
      (r.id, 'e_prescription',    'e-Prescription',     'doctor', true),
      (r.id, 'patient_timeline',  'Patient Timeline',   'doctor', true),
      (r.id, 'lab_orders',        'Lab Orders',         'doctor', false),
      -- admin features
      (r.id, 'bed_management',    'Bed Management',     'admin',  true),
      (r.id, 'billing_dashboard', 'Billing Dashboard',  'admin',  true),
      (r.id, 'staff_directory',   'Staff Directory',    'admin',  true),
      (r.id, 'census_report',     'Census Report',      'admin',  true),
      (r.id, 'feature_flags_ui',  'Feature Flags UI',   'admin',  true),
      -- staff features
      (r.id, 'task_board',        'Task Board',         'staff',  true),
      (r.id, 'vitals_capture',    'Vitals Capture',     'staff',  true),
      (r.id, 'dispense_drugs',    'Dispense Drugs',     'staff',  true),
      (r.id, 'lab_collection',    'Lab Collection',     'staff',  true),
      (r.id, 'stock_alerts',      'Stock Alerts',       'staff',  false)
    on conflict (tenant_id, feature_key, mobile_role) do nothing;
  end loop;
end;
$$;

-- ======================================
-- MIGRATION: 20260415230000_doctor_mobile_screens.sql
-- ======================================
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

-- ======================================
-- MIGRATION: 20260415240000_admin_mobile_screens.sql
-- ======================================
-- ============================================================
-- S-MOB-ADMIN: Admin Mobile Screens
-- Adds duty_status + department to profiles; creates
-- admin_dashboard_kpis view; adds RLS policies for admin
-- reads on beds, admissions, bills, and profiles.
-- ============================================================
-- Depends on: 20260414000000_core_foundations.sql
--             20260414120000_fhir_abdm_core.sql
--             20260415030000_ipd_dashboard.sql
--             20260415220000_mobile_rbac.sql

-- ── 1. Extend profiles for staff directory ───────────────────
-- duty_status: whether the staff member is currently on shift.
-- department:  human-readable ward / dept label.

alter table public.profiles
  add column if not exists duty_status  text
    check (duty_status in ('on_duty', 'off_duty'))
    not null default 'off_duty',
  add column if not exists department   text;

comment on column public.profiles.duty_status is
  'Current shift status — toggled by clock-in/clock-out events.';
comment on column public.profiles.department is
  'Ward or department the staff member is assigned to.';

-- ── 2. Admin dashboard KPIs view ────────────────────────────
-- Aggregates admissions today, discharges today, bed occupancy,
-- and daily revenue into a single row per tenant.
-- The mobile dashboard screen queries this view.

create or replace view public.admin_dashboard_kpis as
select
  b.tenant_id,
  -- Admissions created today
  count(distinct a_in.id)                                           as admissions_today,
  -- Discharges completed today
  count(distinct a_out.id)                                          as discharges_today,
  -- Bed occupancy
  count(distinct b.id) filter (where b.status = 'occupied')        as beds_occupied,
  count(distinct b.id)                                              as beds_total,
  round(
    count(distinct b.id) filter (where b.status = 'occupied')::numeric
    / nullif(count(distinct b.id), 0) * 100
  , 1)                                                              as occupancy_pct,
  -- Revenue: sum of paid bills issued today
  coalesce(
    sum(bi_sum.total) filter (where bl.status = 'paid'
                               and bl.tenant_id = b.tenant_id
                               and date(bl.created_at) = current_date),
    0
  )                                                                 as revenue_today
from public.beds b
left join public.admissions a_in
  on a_in.tenant_id  = b.tenant_id
  and date(a_in.admitted_at) = current_date
  and a_in.status = 'admitted'
left join public.admissions a_out
  on a_out.tenant_id  = b.tenant_id
  and date(a_out.discharged_at) = current_date
  and a_out.status = 'discharged'
left join public.bills bl
  on bl.tenant_id = b.tenant_id
left join lateral (
  select bill_id, sum(unit_price * qty) as total
  from public.bill_items
  where bill_id = bl.id
  group by bill_id
) bi_sum on bi_sum.bill_id = bl.id
group by b.tenant_id;

comment on view public.admin_dashboard_kpis is
  'Real-time KPI snapshot used by the admin mobile dashboard screen. '
  'Filtered by tenant via RLS on the underlying tables.';

-- ── 3. Ward census view ──────────────────────────────────────
-- Used by the dashboard Ward Census section.

create or replace view public.ward_census as
select
  tenant_id,
  ward,
  count(*)                                           as total,
  count(*) filter (where status = 'occupied')        as occupied,
  round(
    count(*) filter (where status = 'occupied')::numeric
    / nullif(count(*), 0) * 100
  , 1)                                               as occupancy_pct
from public.beds
group by tenant_id, ward;

comment on view public.ward_census is
  'Per-ward bed occupancy summary for admin dashboard.';

-- ── 4. RLS — admin can read all beds in tenant ───────────────
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'beds'
      and policyname  = 'admin_read_beds'
  ) then
    execute $policy$
      create policy "admin_read_beds"
        on public.beds
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;

-- ── 5. RLS — admin can read all admissions in tenant ─────────
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'admissions'
      and policyname  = 'admin_read_admissions'
  ) then
    execute $policy$
      create policy "admin_read_admissions"
        on public.admissions
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;

-- ── 6. RLS — admin can read all bills / bill_items in tenant ─
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'bills'
      and policyname  = 'admin_read_bills'
  ) then
    execute $policy$
      create policy "admin_read_bills"
        on public.bills
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'bill_items'
      and policyname  = 'admin_read_bill_items'
  ) then
    execute $policy$
      create policy "admin_read_bill_items"
        on public.bill_items
        for select
        using (
          exists (
            select 1 from public.bills b
            join public.profiles p on p.id = auth.uid()
            where b.id = bill_items.bill_id
              and b.tenant_id = public.jwt_tenant()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;

-- ── 7. RLS — admin can UPDATE profiles.role within tenant ────
-- Admin changes staff roles via the Staff screen role picker.
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'profiles'
      and policyname  = 'admin_update_staff_role'
  ) then
    execute $policy$
      create policy "admin_update_staff_role"
        on public.profiles
        for update
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles admin_p
            where admin_p.id = auth.uid()
              and admin_p.role in ('admin', 'su')
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
        )
    $policy$;
  end if;
end $$;

-- ── 8. RLS — admin can read all profiles in tenant ───────────
-- Needed for the Staff Directory FlatList.
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'profiles'
      and policyname  = 'admin_read_staff'
  ) then
    execute $policy$
      create policy "admin_read_staff"
        on public.profiles
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;

-- ======================================
-- MIGRATION: 20260415250000_staff_mobile_screens.sql
-- ======================================
-- ============================================================
-- S-MOB-STAFF: Staff Mobile Screens
-- Adds RLS policies for nurse, pharmacist, lab_manager roles
-- to read observations, medication_requests, stock_movements,
-- lab_samples, and diagnostic_reports for their assigned wards.
-- ============================================================
-- Depends on: 20260414000000_core_foundations.sql
--             20260414120000_fhir_abdm_core.sql
--             20260415030000_ipd_dashboard.sql
--             20260415220000_mobile_rbac.sql

-- ── 1. RLS — observations (vitals capture) ──────────────────────
-- Nurses may read/write observations (vital signs) for patients
-- in their assigned ward. Written via the Vitals Capture screen.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'observations'
      and policyname  = 'nurse_vitals_own_ward'
  ) then
    execute $policy$
      create policy "nurse_vitals_own_ward"
        on public.observations
        for all
        using (
          tenant_id = public.jwt_tenant()
          and category = 'vital-signs'
          and exists (
            select 1 from public.admissions adm
            join public.beds b on b.id = adm.bed_id
            join public.profiles p on p.department = b.ward
            where adm.patient_id = observations.patient_id
              and adm.status = 'admitted'
              and p.id = auth.uid()
              and p.role = 'nurse'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and category = 'vital-signs'
          and exists (
            select 1 from public.admissions adm
            join public.beds b on b.id = adm.bed_id
            join public.profiles p on p.department = b.ward
            where adm.patient_id = observations.patient_id
              and adm.status = 'admitted'
              and p.id = auth.uid()
              and p.role = 'nurse'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 2. RLS — medication_requests (dispense view) ─────────────────
-- Pharmacists may read medication_requests for active admissions
-- and update dispense status.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'medication_requests'
      and policyname  = 'pharmacist_read_pending_rx'
  ) then
    execute $policy$
      create policy "pharmacist_read_pending_rx"
        on public.medication_requests
        for select
        using (
          tenant_id = public.jwt_tenant()
          and status in ('active', 'draft')
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
    $policy$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'medication_requests'
      and policyname  = 'pharmacist_update_dispense'
  ) then
    execute $policy$
      create policy "pharmacist_update_dispense"
        on public.medication_requests
        for update
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 3. RLS — stock_movements (inventory) ────────────────────────
-- Pharmacists may read and create stock_movements (dispense/request).

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'stock_movements'
      and policyname  = 'pharmacist_stock_movements'
  ) then
    execute $policy$
      create policy "pharmacist_stock_movements"
        on public.stock_movements
        for all
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 4. RLS — lab_samples (collection / results) ──────────────────
-- Lab managers may read lab_samples and update collection/result status.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'lab_samples'
      and policyname  = 'lab_manager_read_samples'
  ) then
    execute $policy$
      create policy "lab_manager_read_samples"
        on public.lab_samples
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
    $policy$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'lab_samples'
      and policyname  = 'lab_manager_update_samples'
  ) then
    execute $policy$
      create policy "lab_manager_update_samples"
        on public.lab_samples
        for update
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 5. RLS — diagnostic_reports (lab results) ───────────────────
-- Lab managers may write diagnostic_reports linked to lab_samples.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'diagnostic_reports'
      and policyname  = 'lab_manager_write_reports'
  ) then
    execute $policy$
      create policy "lab_manager_write_reports"
        on public.diagnostic_reports
        for all
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 6. RLS — patients (for ward-scoped reads) ───────────────────
-- Nurses and pharmacists may read patients in their assigned wards.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'patients'
      and policyname  = 'staff_read_ward_patients'
  ) then
    execute $policy$
      create policy "staff_read_ward_patients"
        on public.patients
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.admissions adm
            join public.beds b on b.id = adm.bed_id
            join public.profiles p on p.department = b.ward
            where adm.patient_id = patients.id
              and adm.status = 'admitted'
              and p.id = auth.uid()
              and p.role in ('nurse', 'pharmacist', 'lab_manager')
          )
        )
    $policy$;
  end if;
end $$;

-- ── 7. Comment block ────────────────────────────────────────────
-- This migration enables staff mobile screens:
-- - Vitals Capture (nurse + vital-signs observations)
-- - Dispense (pharmacist + medication_requests / stock_movements)
-- - Lab Collection (lab_manager + lab_samples / diagnostic_reports)
-- - Tasks (assigned via service_requests with category='nursing_task')

comment on policy "nurse_vitals_own_ward" on public.observations is
  'Allows nurses to record vital signs for admitted patients in their ward.';

comment on policy "pharmacist_read_pending_rx" on public.medication_requests is
  'Allows pharmacists to view active/pending medication requests.';

comment on policy "pharmacist_update_dispense" on public.medication_requests is
  'Allows pharmacists to mark medications as dispensed.';

comment on policy "pharmacist_stock_movements" on public.stock_movements is
  'Allows pharmacists to record dispense and stock request movements.';

comment on policy "lab_manager_read_samples" on public.lab_samples is
  'Allows lab managers to view lab samples across all wards.';

comment on policy "lab_manager_update_samples" on public.lab_samples is
  'Allows lab managers to update collection status and finalize samples.';

comment on policy "lab_manager_write_reports" on public.diagnostic_reports is
  'Allows lab managers to attach results to lab samples.';

comment on policy "staff_read_ward_patients" on public.patients is
  'Allows nurses, pharmacists, and lab managers to read patient data for their assigned wards.';

