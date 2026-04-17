-- ============================================================
-- S-MOB-ADMIN: Admin Mobile Screens
-- Adds duty_status + department to profiles; creates
-- admin_dashboard_kpis view; adds RLS policies for admin
-- reads on beds, admissions, bills, and profiles.
-- ============================================================
-- Depends on: 20260414000000_core_foundations.sql
--             20260414120000_fhir_abdm_core.sql
--             20260415030000_ipd_dashboard.sql
--             20260415220000_mobile_rbac.sql

-- ── 1. Extend profiles for staff directory ───────────────────
-- duty_status: whether the staff member is currently on shift.
-- department:  human-readable ward / dept label.

alter table public.profiles
  add column if not exists duty_status  text
    check (duty_status in ('on_duty', 'off_duty'))
    not null default 'off_duty',
  add column if not exists department   text;

comment on column public.profiles.duty_status is
  'Current shift status — toggled by clock-in/clock-out events.';
comment on column public.profiles.department is
  'Ward or department the staff member is assigned to.';

-- ── 2. Admin dashboard KPIs view ────────────────────────────
-- Aggregates admissions today, discharges today, bed occupancy,
-- and daily revenue into a single row per tenant.
-- The mobile dashboard screen queries this view.

create or replace view public.admin_dashboard_kpis as
select
  b.tenant_id,
  -- Admissions created today
  count(distinct a_in.id)                                           as admissions_today,
  -- Discharges completed today
  count(distinct a_out.id)                                          as discharges_today,
  -- Bed occupancy
  count(distinct b.id) filter (where b.status = 'occupied')        as beds_occupied,
  count(distinct b.id)                                              as beds_total,
  round(
    count(distinct b.id) filter (where b.status = 'occupied')::numeric
    / nullif(count(distinct b.id), 0) * 100
  , 1)                                                              as occupancy_pct,
  -- Revenue: sum of paid bills issued today
  coalesce(
    sum(bi_sum.total) filter (where bl.status = 'paid'
                               and bl.tenant_id = b.tenant_id
                               and date(bl.created_at) = current_date),
    0
  )                                                                 as revenue_today
from public.beds b
left join public.admissions a_in
  on a_in.tenant_id  = b.tenant_id
  and date(a_in.admitted_at) = current_date
  and a_in.status = 'admitted'
left join public.admissions a_out
  on a_out.tenant_id  = b.tenant_id
  and date(a_out.discharged_at) = current_date
  and a_out.status = 'discharged'
left join public.bills bl
  on bl.tenant_id = b.tenant_id
left join lateral (
  select bill_id, sum(unit_price * qty) as total
  from public.bill_items
  where bill_id = bl.id
  group by bill_id
) bi_sum on bi_sum.bill_id = bl.id
group by b.tenant_id;

comment on view public.admin_dashboard_kpis is
  'Real-time KPI snapshot used by the admin mobile dashboard screen. '
  'Filtered by tenant via RLS on the underlying tables.';

-- ── 3. Ward census view ──────────────────────────────────────
-- Used by the dashboard Ward Census section.

create or replace view public.ward_census as
select
  tenant_id,
  ward,
  count(*)                                           as total,
  count(*) filter (where status = 'occupied')        as occupied,
  round(
    count(*) filter (where status = 'occupied')::numeric
    / nullif(count(*), 0) * 100
  , 1)                                               as occupancy_pct
from public.beds
group by tenant_id, ward;

comment on view public.ward_census is
  'Per-ward bed occupancy summary for admin dashboard.';

-- ── 4. RLS — admin can read all beds in tenant ───────────────
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'beds'
      and policyname  = 'admin_read_beds'
  ) then
    execute $policy$
      create policy "admin_read_beds"
        on public.beds
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;

-- ── 5. RLS — admin can read all admissions in tenant ─────────
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'admissions'
      and policyname  = 'admin_read_admissions'
  ) then
    execute $policy$
      create policy "admin_read_admissions"
        on public.admissions
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;

-- ── 6. RLS — admin can read all bills / bill_items in tenant ─
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'bills'
      and policyname  = 'admin_read_bills'
  ) then
    execute $policy$
      create policy "admin_read_bills"
        on public.bills
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'bill_items'
      and policyname  = 'admin_read_bill_items'
  ) then
    execute $policy$
      create policy "admin_read_bill_items"
        on public.bill_items
        for select
        using (
          exists (
            select 1 from public.bills b
            join public.profiles p on p.id = auth.uid()
            where b.id = bill_items.bill_id
              and b.tenant_id = public.jwt_tenant()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;

-- ── 7. RLS — admin can UPDATE profiles.role within tenant ────
-- Admin changes staff roles via the Staff screen role picker.
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'profiles'
      and policyname  = 'admin_update_staff_role'
  ) then
    execute $policy$
      create policy "admin_update_staff_role"
        on public.profiles
        for update
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles admin_p
            where admin_p.id = auth.uid()
              and admin_p.role in ('admin', 'su')
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
        )
    $policy$;
  end if;
end $$;

-- ── 8. RLS — admin can read all profiles in tenant ───────────
-- Needed for the Staff Directory FlatList.
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'profiles'
      and policyname  = 'admin_read_staff'
  ) then
    execute $policy$
      create policy "admin_read_staff"
        on public.profiles
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role in ('admin', 'su')
          )
        )
    $policy$;
  end if;
end $$;
