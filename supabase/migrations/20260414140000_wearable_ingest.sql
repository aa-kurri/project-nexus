-- =====================================================================
-- S-WEARABLE-1 · Wearable Data Ingest — observations extension
-- Sprint Antigravity · Ayura OS
-- =====================================================================
-- Depends on: 20260414120000_fhir_abdm_core.sql (observations table)
--
-- Adds a `metadata` JSONB column to observations so the wearable-ingest
-- Edge Function can persist source (apple_health | google_fit) and
-- ingested_at timestamp alongside FHIR Observation rows.
--
-- The observations table already carries tenant_id + RLS via the
-- blanket tenant_isolation policy created in the parent migration.
-- No new tables are needed; we just extend the existing schema.
-- =====================================================================

-- Add metadata column if it doesn't already exist (idempotent guard)
alter table public.observations
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Partial index speeds up queries that filter by wearable source
create index if not exists observations_wearable_source_idx
  on public.observations ((metadata ->> 'source'), tenant_id, patient_id)
  where metadata ->> 'source' in ('apple_health', 'google_fit', 'wearable');

-- =====================================================================
-- Helper view: wearable_observations
-- Exposes only rows that originated from a wearable device.
-- Inherits RLS from the base table — no extra policy needed.
-- =====================================================================
create or replace view public.wearable_observations
  with (security_invoker = true)
as
select
  o.id,
  o.tenant_id,
  o.patient_id,
  o.encounter_id,
  o.code,
  o.code_system,
  o.display,
  o.value_num,
  o.value_unit,
  o.flag,
  o.status,
  o.effective_at,
  o.created_at,
  o.metadata ->> 'source'       as wearable_source,
  o.metadata ->> 'ingested_at'  as ingested_at
from public.observations o
where o.metadata ->> 'source' in ('apple_health', 'google_fit', 'wearable');

comment on view public.wearable_observations is
  'Filtered view of FHIR Observations ingested from Apple Health or Google Fit. '
  'Inherits tenant RLS from public.observations.';
