-- =====================================================================
-- Ayura OS — Smoke seed
-- Populates one tenant with a minimal realistic clinical day so that
-- downstream boards (OPD queue, bed board, timeline) render live data
-- and RLS policies can be verified against a known state.
-- =====================================================================

-- Required for HMAC audit chain. In production this is set out-of-band;
-- local dev uses a fixed secret so repeated seeds are deterministic.
alter database postgres set app.audit_secret = 'ayura-dev-audit-secret-not-for-prod';

-- Tenant
insert into public.tenants (id, name, subdomain)
values ('11111111-1111-1111-1111-111111111111', 'Ayura Demo Hospital', 'demo')
on conflict (subdomain) do nothing;

-- Profiles (assume auth.users rows are created by Supabase Auth; this
-- seed only links demo staff profiles when the users exist.)
-- For pure local smoke we insert synthetic profile ids that do NOT
-- reference auth.users; guard with a DO block.
do $$
declare t_id uuid := '11111111-1111-1111-1111-111111111111';
begin
  -- Skip if audit_secret unset (safety)
  if current_setting('app.audit_secret', true) is null then return; end if;

  -- Patients
  insert into public.patients (id, tenant_id, mrn, phone, full_name, dob, gender)
  values
    ('22222222-0000-0000-0000-000000000001', t_id, 'MRN-1001', '+919845123456', 'Ramesh Kumar',  '1978-06-12', 'male'),
    ('22222222-0000-0000-0000-000000000002', t_id, 'MRN-1002', '+919845123457', 'Priya Sharma',  '1985-11-03', 'female'),
    ('22222222-0000-0000-0000-000000000003', t_id, 'MRN-1003', '+919845123458', 'Arjun Patel',   '1992-02-19', 'male'),
    ('22222222-0000-0000-0000-000000000004', t_id, 'MRN-1004', '+919845123459', 'Sunita Mehta',  '1969-09-27', 'female')
  on conflict (tenant_id, mrn) do nothing;

  -- Beds (Ward 2)
  insert into public.beds (id, tenant_id, ward, label, status)
  values
    ('33333333-0000-0000-0000-000000000001', t_id, 'W2', 'W2-01', 'occupied'),
    ('33333333-0000-0000-0000-000000000002', t_id, 'W2', 'W2-02', 'vacant'),
    ('33333333-0000-0000-0000-000000000003', t_id, 'W2', 'W2-03', 'vacant'),
    ('33333333-0000-0000-0000-000000000004', t_id, 'W2', 'W2-04', 'occupied'),
    ('33333333-0000-0000-0000-000000000005', t_id, 'W2', 'W2-05', 'cleaning'),
    ('33333333-0000-0000-0000-000000000006', t_id, 'W2', 'W2-06', 'vacant')
  on conflict (tenant_id, label) do nothing;

  -- Pharmacy stores
  insert into public.stock_stores (id, tenant_id, name, kind) values
    ('44444444-0000-0000-0000-000000000001', t_id, 'Main Pharmacy', 'main'),
    ('44444444-0000-0000-0000-000000000002', t_id, 'ICU Sub-store', 'icu')
  on conflict (tenant_id, name) do nothing;

  -- Stock items
  insert into public.stock_items (id, tenant_id, name, generic, form, strength, gst_pct, barcode, rol)
  values
    ('55555555-0000-0000-0000-000000000001', t_id, 'Paracetamol 500mg', 'Paracetamol', 'tab', '500mg', 12.00, '8901012345678', 50),
    ('55555555-0000-0000-0000-000000000002', t_id, 'Amoxicillin 500mg', 'Amoxicillin', 'cap', '500mg', 12.00, '8901012345679', 50),
    ('55555555-0000-0000-0000-000000000003', t_id, 'Normal Saline',     'Sodium Chloride', 'inj', '500ml', 5.00, '8901012345680', 30)
  on conflict (tenant_id, name, strength) do nothing;
end $$;
