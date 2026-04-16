-- =====================================================================
-- S-IPD-NURSE · Nursing Tasks — Table + RLS
-- =====================================================================
-- Depends on:
--   20260414000000_core_foundations.sql  (tenants, profiles)
--   20260414120000_fhir_abdm_core.sql    (admissions)
-- =====================================================================

-- ── 1. Status enum ───────────────────────────────────────────────────

do $$ begin
  create type public.nursing_task_status as enum ('pending', 'in-progress', 'done');
exception when duplicate_object then null;
end $$;

-- ── 2. nursing_tasks table ───────────────────────────────────────────

create table if not exists public.nursing_tasks (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid        not null references public.tenants(id)     on delete cascade,
  admission_id  uuid        not null references public.admissions(id)  on delete cascade,
  title         text        not null,
  status        public.nursing_task_status not null default 'pending',
  assigned_to   uuid        references public.profiles(id) on delete set null,
  due_at        timestamptz,
  notes         text,
  created_by    uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 3. Indexes ───────────────────────────────────────────────────────

create index if not exists nursing_tasks_admission_idx
  on public.nursing_tasks (tenant_id, admission_id, status);

create index if not exists nursing_tasks_due_idx
  on public.nursing_tasks (tenant_id, due_at)
  where status != 'done';

-- ── 4. updated_at trigger ────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger nursing_tasks_updated_at
    before update on public.nursing_tasks
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;

-- ── 5. Row Level Security ────────────────────────────────────────────

alter table public.nursing_tasks enable row level security;

-- Tenant isolation: all operations scoped to the JWT tenant
do $$ begin
  create policy "tenant_isolation" on public.nursing_tasks
    using (tenant_id = public.jwt_tenant())
    with check (tenant_id = public.jwt_tenant());
exception when duplicate_object then null;
end $$;

-- ── 6. Realtime publication (enable for live task board) ─────────────

-- Supabase requires tables to be added to the supabase_realtime publication
-- to receive postgres_changes events via the client SDK.
do $$ begin
  alter publication supabase_realtime add table public.nursing_tasks;
exception when others then null; -- idempotent
end $$;
