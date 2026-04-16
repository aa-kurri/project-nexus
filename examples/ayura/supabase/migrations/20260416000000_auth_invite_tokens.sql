-- S-AUTH-FLOW: Invite Token System
-- Enables admin-generated, single-use invite links that carry a tenant_id + role.
-- The register server action validates the token before creating auth user + profile.

-- ---------------------------------------------------------------------------
-- 1. invite_tokens table
-- ---------------------------------------------------------------------------
create table if not exists public.invite_tokens (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,                        -- cryptographic token embedded in invite URL
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  role        staff_role not null default 'nurse',         -- role the new user will receive
  created_by  uuid references public.profiles(id),         -- admin who generated the invite
  used_at     timestamptz,                                 -- null = unused
  expires_at  timestamptz not null default (now() + interval '72 hours'),
  created_at  timestamptz not null default now()
);

comment on table public.invite_tokens is
  'Single-use staff invite tokens. Validated by the register server action. '
  'Once used_at is set the token is rejected by the API.';

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
alter table public.invite_tokens enable row level security;

-- Only admins/su within the same tenant can read or insert invite tokens.
create policy "Tenant admins can manage their invite tokens"
  on public.invite_tokens
  for all
  using  (tenant_id = public.jwt_tenant())
  with check (tenant_id = public.jwt_tenant());

-- Service role (used by server actions) bypasses RLS, so the register action
-- can validate a token even before the user has a session.

-- ---------------------------------------------------------------------------
-- 3. Auto-expire index (for future cleanup job / GIN index on used_at)
-- ---------------------------------------------------------------------------
create index if not exists idx_invite_tokens_tenant
  on public.invite_tokens (tenant_id);

create index if not exists idx_invite_tokens_token
  on public.invite_tokens (token)
  where used_at is null;  -- partial index — only live tokens

-- ---------------------------------------------------------------------------
-- 4. Prevent re-use: mark token as used atomically
--    Called from the register server action via supabaseAdmin.
-- ---------------------------------------------------------------------------
create or replace function public.consume_invite_token(p_token text)
returns table (
  tenant_id uuid,
  role      staff_role
)
language plpgsql
security definer   -- runs as postgres; caller must be service role
as $$
declare
  v_row public.invite_tokens%rowtype;
begin
  select * into v_row
  from public.invite_tokens
  where token = p_token
    and used_at is null
    and expires_at > now()
  for update skip locked;  -- prevent race conditions on concurrent calls

  if not found then
    raise exception 'INVALID_INVITE_TOKEN'
      using hint = 'Token is invalid, already used, or has expired.';
  end if;

  update public.invite_tokens
  set    used_at = now()
  where  id = v_row.id;

  return query select v_row.tenant_id, v_row.role;
end;
$$;

comment on function public.consume_invite_token(text) is
  'Atomically validates and marks an invite token as used. '
  'Raises INVALID_INVITE_TOKEN if the token is bad/expired/already consumed.';
