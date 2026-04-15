-- =====================================================================
-- S-EMR-3 · Document Vault with Signed URLs
-- =====================================================================
-- Depends on: 20260414000000_core_foundations.sql (tenants, profiles,
--               audit_log, set_updated_at trigger function)
--             20260414120000_fhir_abdm_core.sql (patients, encounters)
-- Scope: Per-patient document metadata, Supabase Storage object paths,
--        checksum integrity, soft-delete, and an append-only access-log
--        that captures every signed-URL generation for HIPAA compliance.
-- All tables carry tenant_id + RLS policy using public.jwt_tenant().
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. patient_documents
--    Stores document metadata; the actual binary lives in Supabase
--    Storage at storage_path.  Soft-delete via deleted_at ensures audit
--    continuity — rows are never physically removed.
-- ---------------------------------------------------------------------
create table public.patient_documents (
  id               uuid        primary key default uuid_generate_v4(),
  tenant_id        uuid        not null references public.tenants(id)     on delete cascade,
  patient_id       uuid        not null references public.patients(id)    on delete cascade,
  encounter_id     uuid                    references public.encounters(id) on delete set null,

  -- Classification
  doc_type         text        not null
                   check (doc_type in (
                     'lab_report',
                     'discharge_summary',
                     'prescription',
                     'imaging',
                     'referral_letter',
                     'insurance_form',
                     'consent_form',
                     'other'
                   )),

  -- File metadata
  name             text        not null,       -- Display name shown to user
  storage_path     text        not null,       -- Supabase Storage object key
  mime_type        text        not null default 'application/octet-stream',
  size_bytes       bigint      not null default 0,
  checksum_sha256  text,                       -- hex SHA-256 for integrity checks

  -- Provenance
  uploaded_by      uuid        references public.profiles(id) on delete set null,

  -- Soft delete — NULL means active
  deleted_at       timestamptz,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.patient_documents enable row level security;

create policy "tenant_isolation" on public.patient_documents
  using (tenant_id = public.jwt_tenant());

-- Keep updated_at current on every write
create trigger set_updated_at
  before update on public.patient_documents
  for each row execute function public.set_updated_at();

-- Active documents for a patient, newest first (primary list query)
create index patient_documents_patient_idx
  on public.patient_documents (tenant_id, patient_id, created_at desc)
  where deleted_at is null;

-- Filter by doc_type within a patient chart
create index patient_documents_type_idx
  on public.patient_documents (tenant_id, patient_id, doc_type, created_at desc)
  where deleted_at is null;

-- Full-text search on document name
create index patient_documents_name_fts_idx
  on public.patient_documents using gin (to_tsvector('english', name))
  where deleted_at is null;

-- ---------------------------------------------------------------------
-- 2. document_access_log
--    Append-only audit trail of every vault action.
--    signed_url_expires_at is populated only for 'view' / 'download'
--    actions where a Supabase Storage signed URL was generated.
--    This table is intentionally never updated (audit integrity).
-- ---------------------------------------------------------------------
create table public.document_access_log (
  id                    uuid        primary key default uuid_generate_v4(),
  tenant_id             uuid        not null references public.tenants(id)           on delete cascade,
  document_id           uuid        not null references public.patient_documents(id) on delete cascade,

  accessed_by           uuid        references public.profiles(id) on delete set null,
  action                text        not null
                        check (action in ('upload', 'view', 'download', 'delete')),

  -- Signed URL metadata (non-null for view / download)
  signed_url_expires_at timestamptz,

  -- Caller context
  ip_address            inet,
  user_agent            text,

  created_at            timestamptz not null default now()
);

alter table public.document_access_log enable row level security;

create policy "tenant_isolation" on public.document_access_log
  using (tenant_id = public.jwt_tenant());

-- Retention / purge index — events older than 7 years can be archived
create index document_access_log_age_idx
  on public.document_access_log (tenant_id, created_at);

-- Per-document access history (used by the audit panel)
create index document_access_log_doc_idx
  on public.document_access_log (tenant_id, document_id, created_at desc);

-- Detect suspicious bulk-download patterns per user
create index document_access_log_user_idx
  on public.document_access_log (tenant_id, accessed_by, action, created_at desc);
