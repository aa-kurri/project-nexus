-- Seed Demo Roles and Data
-- This migration populates the database with the requested demo accounts and mock data.

-- 1. Create the Demo Tenant (if not exists)
insert into public.tenants (id, name, subdomain)
values ('00000000-0000-0000-0000-000000000001', 'City General Hospital', 'citygeneral')
on conflict (subdomain) do update set name = excluded.name
returning id;

-- 2. Helper to create Auth Users and Profiles
-- Note: 'Demo@1234' hash (using MD5-style or bcrypt is standard in Supabase)
-- We use the supabase-compatible crypt format.
-- hash for 'Demo@1234': $2a$10$V0vV6J7F9Z8zF0Z1zV0vVu3h5Z7F9Z8zF0Z1zV0vVuxVvVvVvVvVv
-- (Actually we'll generate it properly using crypt() if enabled)

DO $$
DECLARE
  tenant_id_val uuid := '00000000-0000-0000-0000-000000000001';
  pass_hash text := crypt('Demo@1234', gen_salt('bf'));
BEGIN

  -- Admin
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
  VALUES (gen_random_uuid(), 'admin@citygeneral.demo', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sys Admin"}', now(), now(), 'authenticated', '')
  ON CONFLICT (email) DO NOTHING;
  
  INSERT INTO public.profiles (id, tenant_id, role, full_name)
  SELECT id, tenant_id_val, 'admin', 'Sys Admin' FROM auth.users WHERE email = 'admin@citygeneral.demo'
  ON CONFLICT (id) DO NOTHING;

  -- Doctor 1
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
  VALUES (gen_random_uuid(), 'dr.sharma@citygeneral.demo', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Sharma"}', now(), now(), 'authenticated', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, tenant_id, role, full_name)
  SELECT id, tenant_id_val, 'doctor', 'Dr. Sharma' FROM auth.users WHERE email = 'dr.sharma@citygeneral.demo'
  ON CONFLICT (id) DO NOTHING;

  -- Doctor 2
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
  VALUES (gen_random_uuid(), 'dr.patel@citygeneral.demo', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Patel"}', now(), now(), 'authenticated', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, tenant_id, role, full_name)
  SELECT id, tenant_id_val, 'doctor', 'Dr. Patel' FROM auth.users WHERE email = 'dr.patel@citygeneral.demo'
  ON CONFLICT (id) DO NOTHING;

  -- Nurse
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
  VALUES (gen_random_uuid(), 'nurse.priya@citygeneral.demo', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nurse Priya"}', now(), now(), 'authenticated', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, tenant_id, role, full_name)
  SELECT id, tenant_id_val, 'nurse', 'Nurse Priya' FROM auth.users WHERE email = 'nurse.priya@citygeneral.demo'
  ON CONFLICT (id) DO NOTHING;

  -- Pharmacist
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
  VALUES (gen_random_uuid(), 'pharma.raj@citygeneral.demo', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pharmacist Raj"}', now(), now(), 'authenticated', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, tenant_id, role, full_name)
  SELECT id, tenant_id_val, 'pharmacist', 'Pharmacist Raj' FROM auth.users WHERE email = 'pharma.raj@citygeneral.demo'
  ON CONFLICT (id) DO NOTHING;

  -- Lab Tech
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
  VALUES (gen_random_uuid(), 'lab.kumar@citygeneral.demo', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lab Tech Kumar"}', now(), now(), 'authenticated', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, tenant_id, role, full_name)
  SELECT id, tenant_id_val, 'lab_manager', 'Lab Tech Kumar' FROM auth.users WHERE email = 'lab.kumar@citygeneral.demo'
  ON CONFLICT (id) DO NOTHING;

  -- Patient 1
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
  VALUES (gen_random_uuid(), 'patient.arun@citygeneral.demo', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Arun K"}', now(), now(), 'authenticated', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, tenant_id, role, full_name)
  SELECT id, tenant_id_val, 'patient', 'Arun K' FROM auth.users WHERE email = 'patient.arun@citygeneral.demo'
  ON CONFLICT (id) DO NOTHING;

  -- Patient 2
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
  VALUES (gen_random_uuid(), 'patient.meena@citygeneral.demo', pass_hash, now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Meena S"}', now(), now(), 'authenticated', '')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.profiles (id, tenant_id, role, full_name)
  SELECT id, tenant_id_val, 'patient', 'Meena S' FROM auth.users WHERE email = 'patient.meena@citygeneral.demo'
  ON CONFLICT (id) DO NOTHING;

END $$;
