-- Fix: Allow users to read their own profile even before tenant_id is in JWT
-- This is critical for the initial login redirect flow.

drop policy if exists "Isolate Profiles per Tenant" on public.profiles;

create policy "Isolate Profiles per Tenant"
  on public.profiles
  for all using (
    id = auth.uid() 
    or tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
