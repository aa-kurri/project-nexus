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
create table public.patient_biometric_settings (
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
create table public.patient_webauthn_credentials (
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
create index patient_webauthn_creds_patient_idx
  on public.patient_webauthn_credentials (tenant_id, patient_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. patient_lock_events
--    Append-only audit trail of every lock/unlock attempt.
--    event_type drives HIPAA reporting; success = false marks
--    suspicious activity that can trigger an alert after N failures.
-- ---------------------------------------------------------------------
create table public.patient_lock_events (
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
create index patient_lock_events_age_idx
  on public.patient_lock_events (tenant_id, created_at);

-- Fast lookup: recent failures per patient (brute-force detection)
create index patient_lock_events_failures_idx
  on public.patient_lock_events (tenant_id, patient_id, success, created_at desc)
  where success = false;
