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
-- 0. Required extensions + tenant JWT helper
-- ---------------------------------------------------------------------
create extension if not exists "pg_trgm";

create or replace function public.jwt_tenant() returns uuid
language sql stable as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
create type gender_kind as enum ('male', 'female', 'other', 'unknown');
create type encounter_class as enum ('opd', 'ipd', 'emergency', 'tele', 'home');
create type encounter_status as enum ('planned', 'arrived', 'in-progress', 'finished', 'cancelled');
create type admission_status as enum ('pending', 'admitted', 'discharged', 'transferred');
create type bed_status as enum ('vacant', 'occupied', 'cleaning', 'blocked');
create type queue_status as enum ('waiting', 'next', 'in-consult', 'done', 'no-show');
create type observation_status as enum ('registered', 'preliminary', 'final', 'amended', 'cancelled');
create type observation_flag as enum ('normal', 'low', 'high', 'critical');
create type service_request_status as enum ('draft', 'active', 'completed', 'revoked');
create type diagnostic_report_status as enum ('registered', 'partial', 'final', 'amended');
create type medication_request_status as enum ('draft', 'active', 'completed', 'stopped', 'cancelled');
create type lab_sample_status as enum ('planned', 'collected', 'received', 'in-progress', 'resulted', 'rejected');
create type stock_movement_kind as enum ('receipt', 'dispense', 'transfer-out', 'transfer-in', 'adjustment', 'wastage');
create type bill_status as enum ('draft', 'finalized', 'partially-paid', 'paid', 'void');

-- ---------------------------------------------------------------------
-- 2. Patient (FHIR R4)
-- ---------------------------------------------------------------------
create table public.patients (
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
create index patients_phone_idx on public.patients (tenant_id, phone);
create index patients_abha_idx on public.patients (tenant_id, abha_id) where abha_id is not null;
create index patients_name_trgm_idx on public.patients using gin (full_name gin_trgm_ops);

-- ---------------------------------------------------------------------
-- 3. Encounter (FHIR R4)
-- ---------------------------------------------------------------------
create table public.encounters (
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
create index encounters_patient_idx on public.encounters (tenant_id, patient_id, started_at desc);

-- ---------------------------------------------------------------------
-- 4. OPD queue tokens  (drives S-OPD-1 Live Queue Board)
-- ---------------------------------------------------------------------
create table public.queue_tokens (
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
create index queue_tokens_live_idx on public.queue_tokens (tenant_id, token_date, practitioner_id, status);

-- ---------------------------------------------------------------------
-- 5. IPD bed board  (drives S-IPD-1 Drag-and-drop allocation)
-- ---------------------------------------------------------------------
create table public.beds (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  ward       text not null,          -- e.g., 'W2'
  label      text not null,          -- e.g., 'W2-08'
  status     bed_status not null default 'vacant',
  unique (tenant_id, label)
);
create index beds_tenant_status_idx on public.beds (tenant_id, status);

create table public.admissions (
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
create index admissions_active_idx on public.admissions (tenant_id, status, admitted_at desc);

-- ---------------------------------------------------------------------
-- 6. Observation (vitals + lab results)
-- ---------------------------------------------------------------------
create table public.observations (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  encounter_id  uuid references public.encounters(id) on delete set null,
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
create index observations_patient_idx on public.observations (tenant_id, patient_id, effective_at desc);

-- ---------------------------------------------------------------------
-- 7. Condition, Allergy, Procedure (summaries)
-- ---------------------------------------------------------------------
create table public.conditions (
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
create index conditions_patient_idx on public.conditions (tenant_id, patient_id);

create table public.allergies (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  patient_id  uuid not null references public.patients(id) on delete cascade,
  substance   text not null,
  reaction    text,
  severity    text,
  created_at  timestamptz not null default now()
);
create index allergies_patient_idx on public.allergies (tenant_id, patient_id);

-- ---------------------------------------------------------------------
-- 8. MedicationRequest (prescriptions)
-- ---------------------------------------------------------------------
create table public.medication_requests (
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
create index mr_patient_idx on public.medication_requests (tenant_id, patient_id, authored_at desc);

-- ---------------------------------------------------------------------
-- 9. Lab Orders (ServiceRequest) + Samples + DiagnosticReport
-- ---------------------------------------------------------------------
create table public.service_requests (
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
create index sr_patient_idx on public.service_requests (tenant_id, patient_id, requested_at desc);

create table public.lab_samples (
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
create index lab_samples_status_idx on public.lab_samples (tenant_id, status);

create table public.diagnostic_reports (
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
create index dr_patient_idx on public.diagnostic_reports (tenant_id, patient_id, issued_at desc);

-- ---------------------------------------------------------------------
-- 10. Pharmacy: stores → items → batches → movements
-- ---------------------------------------------------------------------
create table public.stock_stores (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  name       text not null,
  kind       text not null default 'main',    -- main | ward | icu | pharmacy
  unique (tenant_id, name)
);

create table public.stock_items (
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
create index stock_items_barcode_idx on public.stock_items (tenant_id, barcode) where barcode is not null;

create table public.stock_batches (
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
create index stock_batches_fefo_idx on public.stock_batches (tenant_id, item_id, store_id, expiry);

create table public.stock_movements (
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
create index stock_movements_item_time_idx on public.stock_movements (tenant_id, item_id, created_at desc);

-- ---------------------------------------------------------------------
-- 11. Billing: header + line items (auto-capture from modules)
-- ---------------------------------------------------------------------
create table public.bills (
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
create index bills_encounter_idx on public.bills (tenant_id, encounter_id);

create table public.bill_items (
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
create index bill_items_bill_idx on public.bill_items (bill_id);

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
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger trg_patients_touch before update on public.patients
  for each row execute function public.touch_updated_at();
