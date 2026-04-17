-- ============================================================
-- S-MOB-STAFF: Staff Mobile Screens
-- Adds RLS policies for nurse, pharmacist, lab_manager roles
-- to read observations, medication_requests, stock_movements,
-- lab_samples, and diagnostic_reports for their assigned wards.
-- ============================================================
-- Depends on: 20260414000000_core_foundations.sql
--             20260414120000_fhir_abdm_core.sql
--             20260415030000_ipd_dashboard.sql
--             20260415220000_mobile_rbac.sql

-- ── 1. RLS — observations (vitals capture) ──────────────────────
-- Nurses may read/write observations (vital signs) for patients
-- in their assigned ward. Written via the Vitals Capture screen.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'observations'
      and policyname  = 'nurse_vitals_own_ward'
  ) then
    execute $policy$
      create policy "nurse_vitals_own_ward"
        on public.observations
        for all
        using (
          tenant_id = public.jwt_tenant()
          and category = 'vital-signs'
          and exists (
            select 1 from public.admissions adm
            join public.beds b on b.id = adm.bed_id
            join public.profiles p on p.department = b.ward_name
            where adm.patient_id = observations.patient_id
              and adm.status = 'admitted'
              and p.id = auth.uid()
              and p.role = 'nurse'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and category = 'vital-signs'
          and exists (
            select 1 from public.admissions adm
            join public.beds b on b.id = adm.bed_id
            join public.profiles p on p.department = b.ward_name
            where adm.patient_id = observations.patient_id
              and adm.status = 'admitted'
              and p.id = auth.uid()
              and p.role = 'nurse'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 2. RLS — medication_requests (dispense view) ─────────────────
-- Pharmacists may read medication_requests for active admissions
-- and update dispense status.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'medication_requests'
      and policyname  = 'pharmacist_read_pending_rx'
  ) then
    execute $policy$
      create policy "pharmacist_read_pending_rx"
        on public.medication_requests
        for select
        using (
          tenant_id = public.jwt_tenant()
          and status in ('active', 'pending')
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
    $policy$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'medication_requests'
      and policyname  = 'pharmacist_update_dispense'
  ) then
    execute $policy$
      create policy "pharmacist_update_dispense"
        on public.medication_requests
        for update
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 3. RLS — stock_movements (inventory) ────────────────────────
-- Pharmacists may read and create stock_movements (dispense/request).

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'stock_movements'
      and policyname  = 'pharmacist_stock_movements'
  ) then
    execute $policy$
      create policy "pharmacist_stock_movements"
        on public.stock_movements
        for all
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'pharmacist'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 4. RLS — lab_samples (collection / results) ──────────────────
-- Lab managers may read lab_samples and update collection/result status.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'lab_samples'
      and policyname  = 'lab_manager_read_samples'
  ) then
    execute $policy$
      create policy "lab_manager_read_samples"
        on public.lab_samples
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
    $policy$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'lab_samples'
      and policyname  = 'lab_manager_update_samples'
  ) then
    execute $policy$
      create policy "lab_manager_update_samples"
        on public.lab_samples
        for update
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 5. RLS — diagnostic_reports (lab results) ───────────────────
-- Lab managers may write diagnostic_reports linked to lab_samples.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'diagnostic_reports'
      and policyname  = 'lab_manager_write_reports'
  ) then
    execute $policy$
      create policy "lab_manager_write_reports"
        on public.diagnostic_reports
        for all
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
        with check (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.profiles p
            where p.id = auth.uid()
              and p.role = 'lab_manager'
          )
        )
    $policy$;
  end if;
end $$;

-- ── 6. RLS — patients (for ward-scoped reads) ───────────────────
-- Nurses and pharmacists may read patients in their assigned wards.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename   = 'patients'
      and policyname  = 'staff_read_ward_patients'
  ) then
    execute $policy$
      create policy "staff_read_ward_patients"
        on public.patients
        for select
        using (
          tenant_id = public.jwt_tenant()
          and exists (
            select 1 from public.admissions adm
            join public.beds b on b.id = adm.bed_id
            join public.profiles p on p.department = b.ward_name
            where adm.patient_id = patients.id
              and adm.status = 'admitted'
              and p.id = auth.uid()
              and p.role in ('nurse', 'pharmacist', 'lab_manager')
          )
        )
    $policy$;
  end if;
end $$;

-- ── 7. Comment block ────────────────────────────────────────────
-- This migration enables staff mobile screens:
-- - Vitals Capture (nurse + vital-signs observations)
-- - Dispense (pharmacist + medication_requests / stock_movements)
-- - Lab Collection (lab_manager + lab_samples / diagnostic_reports)
-- - Tasks (assigned via service_requests with category='nursing_task')

comment on policy "nurse_vitals_own_ward" on public.observations is
  'Allows nurses to record vital signs for admitted patients in their ward.';

comment on policy "pharmacist_read_pending_rx" on public.medication_requests is
  'Allows pharmacists to view active/pending medication requests.';

comment on policy "pharmacist_update_dispense" on public.medication_requests is
  'Allows pharmacists to mark medications as dispensed.';

comment on policy "pharmacist_stock_movements" on public.stock_movements is
  'Allows pharmacists to record dispense and stock request movements.';

comment on policy "lab_manager_read_samples" on public.lab_samples is
  'Allows lab managers to view lab samples across all wards.';

comment on policy "lab_manager_update_samples" on public.lab_samples is
  'Allows lab managers to update collection status and finalize samples.';

comment on policy "lab_manager_write_reports" on public.diagnostic_reports is
  'Allows lab managers to attach results to lab samples.';

comment on policy "staff_read_ward_patients" on public.patients is
  'Allows nurses, pharmacists, and lab managers to read patient data for their assigned wards.';
