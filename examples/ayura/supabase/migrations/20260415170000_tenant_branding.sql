-- S-SAAS-5: White-label tenant branding
-- Add custom domain, logo, and color customization per tenant

alter table public.tenants
  add column custom_domain text unique,
  add column logo_url text,
  add column primary_color text default '#0F766E',
  add column display_name text;

-- RLS Policy: Tenants can read their own branding
alter table public.tenants enable row level security;

create policy "Tenants can read own branding"
  on public.tenants
  for select using (
    id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Allow service role (via middleware) to read by custom_domain
create policy "Service role reads tenants by domain"
  on public.tenants
  for select using (true);
