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
create table public.webauthn_credentials (
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
create index webauthn_credentials_lookup_idx
  on public.webauthn_credentials (tenant_id, credential_id);

-- Device management list (staff settings page)
create index webauthn_credentials_staff_idx
  on public.webauthn_credentials (tenant_id, staff_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. staff_webauthn_events
--    Append-only audit trail of every registration, revocation, and
--    authentication attempt. Drives Zero-Trust alerting (N consecutive
--    failures, registration from unknown IP, etc.).
--    Immutable: only INSERT is permitted via the prevent_delete trigger.
-- ---------------------------------------------------------------------
create table public.staff_webauthn_events (
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
create index staff_webauthn_events_age_idx
  on public.staff_webauthn_events (tenant_id, created_at desc);

-- Brute-force detection: recent failures per staff member
create index staff_webauthn_events_failures_idx
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
