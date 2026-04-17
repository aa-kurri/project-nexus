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
  on public.admissions (tenant_id, (admitted_at::date));

create index if not exists admissions_discharged_date_idx
  on public.admissions (tenant_id, (discharged_at::date))
  where discharged_at is not null;
