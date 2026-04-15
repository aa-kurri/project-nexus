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
create table public.lims_analysers (
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
create table public.lims_qc_targets (
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
create table public.lims_qc_results (
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
create index lims_qc_results_lookup_idx
  on public.lims_qc_results (tenant_id, analyser_id, analyte_code, level, run_at desc);

-- Index: fast z_score range scans for control-chart dashboards
create index lims_qc_results_zscore_idx
  on public.lims_qc_results (tenant_id, analyser_id, analyte_code, z_score);
