-- =====================================================================
-- Gap Fill: Doctor Payout Engine, Longitudinal Programs,
--           Diet Orders, Housekeeping, Hub-Spoke Lab, Specialty
-- Ayura OS — Competitive parity with Practo + Bahmni
-- =====================================================================

-- ── 1. Doctor Payout Engine ───────────────────────────────────────────

create type payout_basis as enum ('revenue_pct', 'flat_per_patient', 'flat_per_procedure', 'tiered');
create type payout_status as enum ('draft', 'approved', 'disbursed');

create table public.payout_rules (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  doctor_id     uuid not null references public.profiles(id) on delete cascade,
  basis         payout_basis not null default 'revenue_pct',
  pct_value     numeric(5,2),            -- used when basis = revenue_pct
  flat_value    numeric(10,2),           -- used for flat_per_* bases
  service_codes text[],                  -- null = applies to all
  effective_from date not null default current_date,
  effective_to   date,
  created_at    timestamptz not null default now(),
  unique (tenant_id, doctor_id, effective_from)
);
create index payout_rules_doctor_idx on public.payout_rules (tenant_id, doctor_id);

create table public.payout_ledger (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  doctor_id     uuid not null references public.profiles(id) on delete cascade,
  rule_id       uuid references public.payout_rules(id),
  period_start  date not null,
  period_end    date not null,
  gross_revenue numeric(14,2) not null default 0,
  payout_amount numeric(14,2) not null default 0,
  status        payout_status not null default 'draft',
  notes         text,
  approved_by   uuid references public.profiles(id),
  approved_at   timestamptz,
  disbursed_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index payout_ledger_doctor_idx on public.payout_ledger (tenant_id, doctor_id, period_start desc);

alter table public.payout_rules  enable row level security;
alter table public.payout_ledger enable row level security;

create policy tenant_isolation on public.payout_rules
  for all using (tenant_id = public.jwt_tenant())
  with check (tenant_id = public.jwt_tenant());

create policy tenant_isolation on public.payout_ledger
  for all using (tenant_id = public.jwt_tenant())
  with check (tenant_id = public.jwt_tenant());

-- ── 2. Longitudinal Care Programs (Bahmni parity) ─────────────────────

create type program_status as enum ('active', 'completed', 'transferred', 'lost_to_followup');

create table public.care_programs (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  name          text not null,                    -- "HIV Care", "TB DOTS", "Diabetes Management"
  code          text not null,
  description   text,
  followup_days int  not null default 30,         -- expected interval between visits
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.patient_programs (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  program_id    uuid not null references public.care_programs(id) on delete cascade,
  enrolled_at   timestamptz not null default now(),
  care_manager  uuid references public.profiles(id),
  status        program_status not null default 'active',
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  unique (tenant_id, patient_id, program_id)
);
create index patient_programs_patient_idx on public.patient_programs (tenant_id, patient_id);
create index patient_programs_due_idx on public.patient_programs (tenant_id, status, enrolled_at);

-- followup visits linked to program
create table public.program_visits (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  enrollment_id uuid not null references public.patient_programs(id) on delete cascade,
  encounter_id  uuid references public.encounters(id) on delete set null,
  scheduled_on  date not null,
  visited_on    date,
  outcome       text,
  created_at    timestamptz not null default now()
);
create index program_visits_enroll_idx on public.program_visits (enrollment_id, scheduled_on);

alter table public.care_programs   enable row level security;
alter table public.patient_programs enable row level security;
alter table public.program_visits  enable row level security;

create policy tenant_isolation on public.care_programs
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());
create policy tenant_isolation on public.patient_programs
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());
create policy tenant_isolation on public.program_visits
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());

-- ── 3. Diet & Nutrition Orders (IPD) ─────────────────────────────────

create type diet_status as enum ('ordered', 'prepared', 'delivered', 'cancelled');
create type meal_type   as enum ('breakfast', 'lunch', 'dinner', 'snack', 'supplement');

create table public.diet_orders (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  patient_id    uuid not null references public.patients(id) on delete cascade,
  admission_id  uuid references public.admissions(id) on delete cascade,
  ordered_by    uuid references public.profiles(id),
  diet_type     text not null,                    -- "low sodium", "diabetic", "liquid"
  meal          meal_type not null,
  notes         text,
  allergies_override text,                        -- any patient-specific restrictions
  status        diet_status not null default 'ordered',
  scheduled_at  timestamptz not null,
  delivered_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index diet_orders_admission_idx on public.diet_orders (tenant_id, admission_id, scheduled_at);
create index diet_orders_kitchen_idx   on public.diet_orders (tenant_id, scheduled_at, status);

alter table public.diet_orders enable row level security;
create policy tenant_isolation on public.diet_orders
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());

-- ── 4. Housekeeping / Bed Turnover ───────────────────────────────────

create type housekeeping_status as enum ('pending', 'in_progress', 'done', 'inspected');
create type housekeeping_task   as enum ('terminal_clean', 'routine_clean', 'linen_change', 'disinfection');

create table public.housekeeping_requests (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  bed_id        uuid not null references public.beds(id) on delete cascade,
  task          housekeeping_task not null default 'terminal_clean',
  status        housekeeping_status not null default 'pending',
  requested_by  uuid references public.profiles(id),
  assigned_to   uuid references public.profiles(id),
  requested_at  timestamptz not null default now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  inspected_by  uuid references public.profiles(id),
  notes         text,
  created_at    timestamptz not null default now()
);
create index housekeeping_bed_idx    on public.housekeeping_requests (tenant_id, bed_id, status);
create index housekeeping_staff_idx  on public.housekeeping_requests (tenant_id, assigned_to, status);

alter table public.housekeeping_requests enable row level security;
create policy tenant_isolation on public.housekeeping_requests
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());

-- Auto-trigger housekeeping when bed is vacated
create or replace function public.trigger_housekeeping_on_discharge()
returns trigger language plpgsql as $$
begin
  if new.status = 'discharged' and old.status != 'discharged' and new.bed_id is not null then
    insert into public.housekeeping_requests (tenant_id, bed_id, task, requested_by)
    values (new.tenant_id, new.bed_id, 'terminal_clean', new.created_by);
  end if;
  return new;
end;
$$;

create trigger trg_housekeeping_on_discharge
  after update on public.admissions
  for each row execute function public.trigger_housekeeping_on_discharge();

-- ── 5. Hub & Spoke Lab Network ────────────────────────────────────────

create type spoke_sample_status as enum ('dispatched', 'in_transit', 'received_at_hub', 'resulted', 'returned');

create table public.lab_hubs (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  address      text,
  contact      text,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.spoke_dispatches (
  id                 uuid primary key default uuid_generate_v4(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  hub_id             uuid not null references public.lab_hubs(id),
  lab_sample_id      uuid not null references public.lab_samples(id) on delete cascade,
  dispatch_batch_no  text not null,
  status             spoke_sample_status not null default 'dispatched',
  dispatched_at      timestamptz not null default now(),
  received_at_hub    timestamptz,
  resulted_at        timestamptz,
  courier_name       text,
  tracking_no        text,
  created_at         timestamptz not null default now()
);
create index spoke_dispatches_hub_idx    on public.spoke_dispatches (tenant_id, hub_id, status);
create index spoke_dispatches_sample_idx on public.spoke_dispatches (lab_sample_id);

alter table public.lab_hubs        enable row level security;
alter table public.spoke_dispatches enable row level security;

create policy tenant_isolation on public.lab_hubs
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());
create policy tenant_isolation on public.spoke_dispatches
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());

-- ── 6. Specialty Modules: Dialysis, Dental, IVF ──────────────────────

-- Dialysis sessions
create type dialysis_access as enum ('av_fistula', 'catheter', 'graft');
create table public.dialysis_sessions (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  encounter_id    uuid references public.encounters(id),
  access_type     dialysis_access,
  machine_id      text,
  session_no      int not null,
  pre_weight_kg   numeric(5,2),
  post_weight_kg  numeric(5,2),
  uf_goal_ml      int,
  uf_achieved_ml  int,
  duration_mins   int,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  complications   text,
  nurse_id        uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
create index dialysis_patient_idx on public.dialysis_sessions (tenant_id, patient_id, started_at desc);
alter table public.dialysis_sessions enable row level security;
create policy tenant_isolation on public.dialysis_sessions
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());

-- Dental chart
create table public.dental_chart (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  encounter_id    uuid references public.encounters(id),
  tooth_number    smallint not null check (tooth_number between 11 and 85),
  condition       text,                        -- "caries", "missing", "crown"
  treatment       text,                        -- "extraction", "RCT", "filling"
  surfaces        text[],                      -- "mesial", "distal", "occlusal"
  notes           text,
  treated_at      timestamptz,
  created_at      timestamptz not null default now()
);
create index dental_patient_idx on public.dental_chart (tenant_id, patient_id);
alter table public.dental_chart enable row level security;
create policy tenant_isolation on public.dental_chart
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());

-- IVF cycles
create type ivf_stage as enum ('stimulation','egg_retrieval','fertilization','embryo_transfer','outcome');
create table public.ivf_cycles (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  partner_id      uuid references public.patients(id),
  cycle_no        int not null,
  protocol        text,                        -- "long agonist", "antagonist"
  stage           ivf_stage not null default 'stimulation',
  eggs_retrieved  int,
  eggs_fertilized int,
  embryos_frozen  int,
  transferred     int,
  outcome         text,                        -- "positive_beta", "negative", "biochemical"
  started_at      date not null,
  created_at      timestamptz not null default now(),
  unique (tenant_id, patient_id, cycle_no)
);
create index ivf_patient_idx on public.ivf_cycles (tenant_id, patient_id, started_at desc);
alter table public.ivf_cycles enable row level security;
create policy tenant_isolation on public.ivf_cycles
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());

-- ── 7. Accounting Export Log (Tally / ERP) ───────────────────────────

create type accounting_export_status as enum ('pending', 'exported', 'failed', 'reconciled');

create table public.accounting_exports (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  format          text not null default 'tally_xml',   -- tally_xml | sap | csv | json
  period_start    date not null,
  period_end      date not null,
  payload         jsonb not null default '{}'::jsonb,  -- serialized vouchers / ledger entries
  status          accounting_export_status not null default 'pending',
  exported_at     timestamptz,
  exported_by     uuid references public.profiles(id),
  error           text,
  created_at      timestamptz not null default now()
);
create index accounting_exports_tenant_idx on public.accounting_exports (tenant_id, period_start desc);
alter table public.accounting_exports enable row level security;
create policy tenant_isolation on public.accounting_exports
  for all using (tenant_id = public.jwt_tenant()) with check (tenant_id = public.jwt_tenant());

-- ── Realtime: housekeeping board, diet kitchen display ───────────────
do $$
declare
  t text;
  live text[] := array['housekeeping_requests', 'diet_orders', 'spoke_dispatches', 'payout_ledger'];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then return; end if;
  foreach t in array live loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
