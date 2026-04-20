-- =====================================================================
-- Sarvam AI Document Intelligence
-- Adds OCR result columns to patient_documents and a translations table.
-- Depends on: 20260415020000_document_vault.sql (patient_documents)
-- =====================================================================

-- ── 1. Extend patient_documents with OCR columns ─────────────────────

alter table public.patient_documents
  add column if not exists ocr_text       text,
  add column if not exists ocr_confidence numeric(4,3),   -- 0.000–1.000
  add column if not exists ocr_language   text,           -- Sarvam language code e.g. 'hi-IN'
  add column if not exists ocr_reviewed   boolean not null default false,
  add column if not exists sarvam_job_id  text;           -- Sarvam request/job ID for traceability

comment on column public.patient_documents.ocr_text
  is 'Raw text extracted by Sarvam AI OCR; updated to corrected text after human review.';
comment on column public.patient_documents.ocr_confidence
  is 'OCR confidence score returned by Sarvam (0–1). NULL = OCR not yet run.';
comment on column public.patient_documents.ocr_reviewed
  is 'True once a staff member has accepted or corrected the OCR output.';

-- Fast lookup of documents pending OCR review
create index if not exists patient_documents_ocr_review_idx
  on public.patient_documents (tenant_id, ocr_reviewed, created_at desc)
  where deleted_at is null and ocr_text is not null;

-- ── 2. document_translations ─────────────────────────────────────────
-- Stores every Sarvam translation produced for a clinical text block.
-- Not tied to a specific document — plain-text snippets can also be
-- translated (e.g. verbal discharge instructions typed at the desk).

create table if not exists public.document_translations (
  id               uuid        primary key default uuid_generate_v4(),
  tenant_id        uuid        not null references public.tenants(id) on delete cascade,

  -- Optional link to the source document
  document_id      uuid        references public.patient_documents(id) on delete set null,

  source_text      text        not null,
  translated_text  text        not null,
  source_lang      text        not null,   -- BCP-47 code: 'en-IN', 'hi-IN', etc.
  target_lang      text        not null,

  -- Provenance
  translated_by    uuid        references public.profiles(id) on delete set null,

  created_at       timestamptz not null default now()
);

alter table public.document_translations enable row level security;

create policy "tenant_isolation" on public.document_translations
  using (tenant_id = public.jwt_tenant());

-- Translations for a given document (latest first)
create index if not exists document_translations_doc_idx
  on public.document_translations (tenant_id, document_id, created_at desc);

-- Translations by target language — useful for reporting language demand
create index if not exists document_translations_lang_idx
  on public.document_translations (tenant_id, target_lang, created_at desc);

-- ── 3. Auto-populate tenant_id via trigger ───────────────────────────
-- Mirrors the pattern used in other tables in this project.

create or replace function public.set_tenant_from_jwt()
returns trigger language plpgsql security definer as $$
begin
  if new.tenant_id is null then
    new.tenant_id := public.jwt_tenant();
  end if;
  return new;
end;
$$;

drop trigger if exists set_tenant_document_translations on public.document_translations;
create trigger set_tenant_document_translations
  before insert on public.document_translations
  for each row execute function public.set_tenant_from_jwt();
