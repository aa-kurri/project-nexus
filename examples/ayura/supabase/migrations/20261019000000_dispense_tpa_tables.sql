-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 14 companion migration: dispense_records + tpa_claims
-- All tables are tenant-scoped + RLS via public.jwt_tenant()
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. dispense_records — Medication Administration Record (MAR)
--    Records each time a nurse administers a dose from a medication_request.
create table if not exists public.dispense_records (
  id                    uuid primary key default uuid_generate_v4(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  medication_request_id uuid not null references public.medication_requests(id) on delete cascade,
  patient_id            uuid not null references public.patients(id) on delete cascade,
  administered_by       uuid references public.profiles(id),
  status                text not null default 'given'
                        check (status in ('given','missed','held','refused')),
  scheduled_at          timestamptz not null,
  administered_at       timestamptz,
  notes                 text,
  created_at            timestamptz not null default now()
);
create index if not exists dispense_records_patient_idx
  on public.dispense_records (tenant_id, patient_id, scheduled_at desc);
create index if not exists dispense_records_mr_idx
  on public.dispense_records (tenant_id, medication_request_id, scheduled_at desc);

alter table public.dispense_records enable row level security;
drop policy if exists "tenant_iso_dispense" on public.dispense_records;
create policy "tenant_iso_dispense" on public.dispense_records
  for all using (tenant_id = public.jwt_tenant());

-- 2. tpa_claims — TPA cashless & PMJAY government scheme claims
create table if not exists public.tpa_claims (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  admission_id    uuid references public.admissions(id) on delete set null,
  payer_type      text not null default 'tpa'
                  check (payer_type in ('tpa','pmjay','cghs','esis','other')),
  insurer         text,                -- "Star Health", "New India", etc.
  tpa_name        text,                -- "Vidal Health", "Paramount TPA", etc.
  beneficiary_id  text,                -- PMJAY beneficiary ID / policy number
  icd10_code      text,
  diagnosis       text,
  approved_amount numeric(12,2) not null default 0,
  claimed_amount  numeric(12,2) not null default 0,
  step            text not null default 'eligibility'
                  check (step in (
                    'eligibility','pre_auth','enhancement',
                    'final_bill','submitted','settled','rejected','query'
                  )),
  admit_date      date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists tpa_claims_patient_idx
  on public.tpa_claims (tenant_id, patient_id, created_at desc);
create index if not exists tpa_claims_step_idx
  on public.tpa_claims (tenant_id, step);

alter table public.tpa_claims enable row level security;
drop policy if exists "tenant_iso_tpa" on public.tpa_claims;
create policy "tenant_iso_tpa" on public.tpa_claims
  for all using (tenant_id = public.jwt_tenant());

-- updated_at trigger for tpa_claims
create or replace function public.set_tpa_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists tpa_updated_at on public.tpa_claims;
create trigger tpa_updated_at
  before update on public.tpa_claims
  for each row execute function public.set_tpa_updated_at();
