-- Initial Ayura OS Base Schema
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- 1. Tenants (Hospitals)
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subdomain text unique not null,
  created_at timestamptz default now()
);

-- 2. User Profiles
create type staff_role as enum ('su', 'admin', 'doctor', 'nurse', 'pharmacist', 'lab_manager', 'patient');

create table public.profiles (
  id uuid references auth.users(id) primary key,
  tenant_id uuid references public.tenants(id) not null,
  role staff_role not null default 'patient',
  full_name text not null,
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
create table public.audit_log (
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
