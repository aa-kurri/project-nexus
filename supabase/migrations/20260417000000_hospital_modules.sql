-- =====================================================================
-- Hospital Modules — per-tenant feature toggle table
-- Backs the Admin → Modules page (apps/web/app/(hospital)/admin/modules)
-- =====================================================================
-- Depends on: 20260414000000_core_foundations.sql (tenants, profiles)

create table public.hospital_modules (
  id          uuid      primary key default gen_random_uuid(),
  tenant_id   uuid      not null references public.tenants(id) on delete cascade,
  module_id   text      not null,   -- e.g. 'abha', 'cpoe', 'mar', 'icu_flowsheet'
  enabled     boolean   not null default false,
  config      jsonb     not null default '{}'::jsonb,  -- module-specific settings
  updated_at  timestamptz not null default now(),
  updated_by  uuid      references public.profiles(id) on delete set null,
  constraint uq_tenant_module unique (tenant_id, module_id)
);

alter table public.hospital_modules enable row level security;

-- All staff can read module config (drives sidebar gate)
create policy "tenant_read_modules"
  on public.hospital_modules
  for select
  using (tenant_id = public.jwt_tenant());

-- Only admins/su can write
create policy "admin_write_modules"
  on public.hospital_modules
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
create trigger trg_hospital_modules_touch
  before update on public.hospital_modules
  for each row execute function public.set_updated_at();

-- Index for fast sidebar lookups (read all enabled modules for a tenant)
create index hospital_modules_tenant_idx
  on public.hospital_modules (tenant_id, enabled, module_id);

-- ─────────────────────────────────────────────────────────────────────
-- Seed default rows for every existing tenant (all disabled by default)
-- Module IDs match the admin/modules page INITIAL_MODULES[].id
-- ─────────────────────────────────────────────────────────────────────
insert into public.hospital_modules (tenant_id, module_id, enabled)
select
  t.id,
  m.module_id,
  false
from public.tenants t
cross join (
  values
    ('abha'),
    ('pcpndt'),
    ('pmjay'),
    ('drug_schedule'),
    ('nabh'),
    ('cpoe'),
    ('mar'),
    ('icu_flowsheet'),
    ('ai_scribe'),
    ('teleconsult'),
    ('wearable'),
    ('lims_hl7'),
    ('tpa'),
    ('revenue_audit'),
    ('drug_cds')
) as m(module_id)
on conflict (tenant_id, module_id) do nothing;
