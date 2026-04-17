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
create table public.mobile_feature_flags (
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
create or replace function public.set_updated_at()
  returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

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
