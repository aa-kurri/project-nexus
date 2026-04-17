-- =====================================================================
-- Concierge Messages — WhatsApp AI Concierge chat persistence
-- Backs apps/web/components/app/WhatsAppConcierge.tsx
-- =====================================================================

create table public.concierge_messages (
  id          uuid        primary key default gen_random_uuid(),
  tenant_id   uuid        not null references public.tenants(id) on delete cascade,
  patient_id  uuid        references public.patients(id) on delete set null,
  session_key text        not null,   -- phone number or patient_id-based key
  sender      text        not null check (sender in ('user', 'bot')),
  body        text        not null,
  attachment_name text,
  attachment_size text,
  created_at  timestamptz not null default now()
);

alter table public.concierge_messages enable row level security;

create policy "tenant_rw_concierge_messages"
  on public.concierge_messages for all
  using (tenant_id = public.jwt_tenant())
  with check (tenant_id = public.jwt_tenant());

create index concierge_messages_session_idx
  on public.concierge_messages (tenant_id, session_key, created_at asc);

alter publication supabase_realtime add table public.concierge_messages;
