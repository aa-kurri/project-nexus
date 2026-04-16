-- =============================================================
-- Ayura OS — Demo Seed Data
-- Run AFTER all_migrations.sql
-- Creates: 1 tenant, 8 staff users, 10 patients, OPD queue,
--          beds, admissions, observations, stock, bills, labs
-- =============================================================

-- ── 0. UUIDs we'll reuse ──────────────────────────────────────
do $$ begin
  -- intentionally empty — we use literals below for readability
end $$;

-- ── 1. Demo Hospital tenant ───────────────────────────────────
insert into public.tenants (id, name, subdomain)
values (
  'a0000000-0000-0000-0000-000000000001',
  'City General Hospital',
  'city-general'
)
on conflict (subdomain) do nothing;

-- ── 2. Auth users (Supabase internal) ────────────────────────
-- Insert stub auth users so profiles FK works
insert into auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
values
  -- admin
  ('b0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'admin@citygeneral.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}','{}',false,'','','',''),
  -- doctor 1
  ('b0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'dr.sharma@citygeneral.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}','{}',false,'','','',''),
  -- doctor 2
  ('b0000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'dr.patel@citygeneral.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}','{}',false,'','','',''),
  -- nurse
  ('b0000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'nurse.priya@citygeneral.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}','{}',false,'','','',''),
  -- pharmacist
  ('b0000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'pharma.raj@citygeneral.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}','{}',false,'','','',''),
  -- lab tech
  ('b0000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'lab.kumar@citygeneral.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}','{}',false,'','','',''),
  -- patient 1 (mobile login)
  ('b0000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'patient.arun@citygeneral.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}','{}',false,'','','',''),
  -- patient 2
  ('b0000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'patient.meena@citygeneral.demo', crypt('Demo@1234', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}','{}',false,'','','','')
on conflict (id) do nothing;

-- ── 3. Profiles ───────────────────────────────────────────────
insert into public.profiles (id, tenant_id, role, full_name)
values
  ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','admin',       'Admin User'),
  ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','doctor',      'Dr. Rahul Sharma'),
  ('b0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','doctor',      'Dr. Anita Patel'),
  ('b0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','nurse',       'Priya Nair'),
  ('b0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001','pharmacist',  'Raj Mehta'),
  ('b0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001','lab_manager', 'Kumar Suresh'),
  ('b0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001','patient',     'Arun Kumar'),
  ('b0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000001','patient',     'Meena Devi')
on conflict (id) do nothing;

-- ── 4. Patients ───────────────────────────────────────────────
insert into public.patients (id, tenant_id, mrn, phone, full_name, dob, gender, city, state)
values
  ('c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','MRN-001','+919876543201','Arun Kumar',      '1990-05-15','male',  'Mumbai',   'Maharashtra'),
  ('c0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','MRN-002','+919876543202','Meena Devi',      '1985-11-22','female','Delhi',    'Delhi'),
  ('c0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','MRN-003','+919876543203','Suresh Pillai',   '1972-03-08','male',  'Chennai',  'Tamil Nadu'),
  ('c0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','MRN-004','+919876543204','Kavita Singh',    '1995-07-30','female','Pune',     'Maharashtra'),
  ('c0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001','MRN-005','+919876543205','Ramesh Gupta',    '1965-01-12','male',  'Jaipur',   'Rajasthan'),
  ('c0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001','MRN-006','+919876543206','Lakshmi Iyer',    '2000-09-18','female','Bangalore', 'Karnataka'),
  ('c0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001','MRN-007','+919876543207','Vikram Bose',     '1988-04-25','male',  'Kolkata',  'West Bengal'),
  ('c0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000001','MRN-008','+919876543208','Anjali Reddy',    '1978-12-03','female','Hyderabad','Telangana'),
  ('c0000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000001','MRN-009','+919876543209','Mohammed Iqbal',  '1955-06-14','male',  'Lucknow',  'Uttar Pradesh'),
  ('c0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000001','MRN-010','+919876543210','Sunita Verma',    '1992-08-27','female','Ahmedabad','Gujarat')
on conflict (tenant_id, mrn) do nothing;

-- ── 5. Encounters ─────────────────────────────────────────────
insert into public.encounters (id, tenant_id, patient_id, practitioner_id, class, status, reason, started_at)
values
  ('d0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   'opd','in-progress','Fever and headache', now() - interval '30 min'),
  ('d0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000002',
   'opd','planned','Routine check-up', now() - interval '10 min'),
  ('d0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003',
   'opd','planned','Knee pain', now() - interval '5 min'),
  ('d0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000003',
   'ipd','in-progress','Post-operative recovery', now() - interval '2 days'),
  ('d0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000002',
   'ipd','in-progress','Cardiac monitoring', now() - interval '3 days'),
  ('d0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000002',
   'opd','finished','Diabetes follow-up', now() - interval '1 hour'),
  ('d0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000003',
   'opd','planned','Skin rash', now() - interval '2 min')
on conflict (id) do nothing;

-- ── 6. OPD Queue tokens (today) ───────────────────────────────
insert into public.queue_tokens (tenant_id, practitioner_id, encounter_id, patient_id, token_number, token_date, status, called_at)
values
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   'd0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
   1, current_date, 'in-consult', now() - interval '15 min'),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   'd0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002',
   2, current_date, 'next', now() - interval '2 min'),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   null,'c0000000-0000-0000-0000-000000000006',
   3, current_date, 'waiting', null),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   null,'c0000000-0000-0000-0000-000000000009',
   4, current_date, 'waiting', null),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   null,'c0000000-0000-0000-0000-000000000010',
   5, current_date, 'waiting', null),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000003',
   'd0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000003',
   1, current_date, 'next', now() - interval '5 min'),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000003',
   'd0000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000007',
   2, current_date, 'waiting', null),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000003',
   null,'c0000000-0000-0000-0000-000000000008',
   3, current_date, 'waiting', null)
on conflict (tenant_id, practitioner_id, token_date, token_number) do nothing;

-- ── 7. Beds ───────────────────────────────────────────────────
insert into public.beds (id, tenant_id, ward, label, status)
values
  -- Ward A (General)
  ('e0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','Ward A','A-01','occupied'),
  ('e0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','Ward A','A-02','occupied'),
  ('e0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','Ward A','A-03','vacant'),
  ('e0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','Ward A','A-04','vacant'),
  ('e0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001','Ward A','A-05','cleaning'),
  -- Ward B (Cardiac)
  ('e0000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001','Ward B','B-01','occupied'),
  ('e0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001','Ward B','B-02','vacant'),
  ('e0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000001','Ward B','B-03','vacant'),
  -- ICU
  ('e0000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000001','ICU','ICU-01','occupied'),
  ('e0000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000001','ICU','ICU-02','vacant'),
  ('e0000000-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000001','ICU','ICU-03','blocked'),
  -- Maternity
  ('e0000000-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000001','Maternity','M-01','vacant'),
  ('e0000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000001','Maternity','M-02','vacant')
on conflict (tenant_id, label) do nothing;

-- ── 8. Admissions (IPD) ───────────────────────────────────────
insert into public.admissions (id, tenant_id, patient_id, bed_id, encounter_id, status, admitted_at)
values
  ('f0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000004','admitted', now() - interval '2 days'),
  ('f0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000005','e0000000-0000-0000-0000-000000000006',
   'd0000000-0000-0000-0000-000000000005','admitted', now() - interval '3 days'),
  ('f0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002','e0000000-0000-0000-0000-000000000002',
   null,'admitted', now() - interval '1 day')
on conflict (id) do nothing;

-- ── 9. Observations (vitals) ──────────────────────────────────
insert into public.observations (tenant_id, patient_id, encounter_id, code, display, value_num, value_unit, ref_low, ref_high, flag, status, effective_at)
values
  -- Arun Kumar vitals
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001','8310-5','Body temperature',38.7,'°C',36.1,37.2,'high','final', now() - interval '20 min'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001','8867-4','Heart rate',102,'bpm',60,100,'high','final', now() - interval '20 min'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001','55284-4','Blood pressure (systolic)',128,'mmHg',90,120,'high','final', now() - interval '20 min'),
  -- Kavita Singh (IPD)
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000004',
   'd0000000-0000-0000-0000-000000000004','8310-5','Body temperature',37.1,'°C',36.1,37.2,'normal','final', now() - interval '1 hour'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000004',
   'd0000000-0000-0000-0000-000000000004','59408-5','Oxygen saturation',97,'%',95,100,'normal','final', now() - interval '1 hour'),
  -- Ramesh Gupta (cardiac)
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000005',
   'd0000000-0000-0000-0000-000000000005','8867-4','Heart rate',58,'bpm',60,100,'low','final', now() - interval '30 min'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000005',
   'd0000000-0000-0000-0000-000000000005','55284-4','Blood pressure (systolic)',158,'mmHg',90,120,'high','final', now() - interval '30 min')
on conflict do nothing;

-- ── 10. Stock stores & items (Pharmacy) ──────────────────────
insert into public.stock_stores (id, tenant_id, name, is_default)
values
  ('aa000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','Main Pharmacy', true),
  ('aa000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','Ward B Satellite', false)
on conflict (id) do nothing;

insert into public.stock_items (id, tenant_id, store_id, name, generic_name, unit, qty_on_hand, reorder_level, hsn_code)
values
  ('ab000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','aa000000-0000-0000-0000-000000000001',
   'Paracetamol 500mg Tab','Paracetamol','Tab',2400,500,'30049099'),
  ('ab000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','aa000000-0000-0000-0000-000000000001',
   'Amoxicillin 250mg Cap','Amoxicillin','Cap',860,300,'30041090'),
  ('ab000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','aa000000-0000-0000-0000-000000000001',
   'Metformin 500mg Tab','Metformin','Tab',1200,400,'30049099'),
  ('ab000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','aa000000-0000-0000-0000-000000000001',
   'Atorvastatin 10mg Tab','Atorvastatin','Tab',340,200,'30049099'),
  ('ab000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001','aa000000-0000-0000-0000-000000000001',
   'Normal Saline 500ml IV','Sodium Chloride 0.9%','Bag',45,20,'30049099'),
  ('ab000000-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001','aa000000-0000-0000-0000-000000000001',
   'Insulin Glargine 100U/ml Pen','Insulin Glargine','Pen',28,10,'30043100'),
  ('ab000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001','aa000000-0000-0000-0000-000000000001',
   'Omeprazole 20mg Cap','Omeprazole','Cap',180,100,'30049099'),
  ('ab000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000001','aa000000-0000-0000-0000-000000000002',
   'Paracetamol 500mg Tab','Paracetamol','Tab',120,50,'30049099')
on conflict (id) do nothing;

-- ── 11. Medication requests (Rx) ─────────────────────────────
insert into public.medication_requests (tenant_id, patient_id, encounter_id, practitioner_id, drug_name, dose, frequency, duration_days, status)
values
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   'Paracetamol 500mg Tab','1 Tab','Every 8 hours',5,'active'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000005',
   'd0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000002',
   'Atorvastatin 10mg Tab','1 Tab','Once daily at night',30,'active'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000006',
   'd0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000002',
   'Metformin 500mg Tab','1 Tab','Twice daily with meals',90,'active')
on conflict do nothing;

-- ── 12. Bills ────────────────────────────────────────────────
insert into public.bills (id, tenant_id, patient_id, encounter_id, status, total_amount)
values
  ('ac000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000004','partially-paid',18500),
  ('ac000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000005','draft',32000),
  ('ac000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','draft',450)
on conflict (id) do nothing;

insert into public.bill_items (tenant_id, bill_id, description, quantity, unit_price)
values
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000001','Bed charges (Ward A) per day',2,3500),
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000001','Surgeon fee',1,8000),
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000001','OT charges',1,3500),
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000001','Anaesthesia',1,3000),
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000002','Bed charges (Ward B/Cardiac) per day',3,5000),
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000002','Cardiologist fee',2,3500),
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000002','ECG',2,750),
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000002','Echo',1,2000),
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000003','OPD consultation',1,350),
  ('a0000000-0000-0000-0000-000000000001','ac000000-0000-0000-0000-000000000003','Paracetamol 500mg x5',5,20)
on conflict do nothing;

-- ── 13. Lab samples ──────────────────────────────────────────
insert into public.lab_samples (tenant_id, patient_id, encounter_id, practitioner_id, sample_type, status)
values
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   'Blood - CBC','in-progress'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000005',
   'd0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000002',
   'Blood - Lipid Profile','resulted'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000006',
   'd0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000002',
   'Blood - HbA1c','resulted'),
  ('a0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000003',
   'd0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000003',
   'Urine - Routine','collected')
on conflict do nothing;

-- ── 14. Appointment slots (OPD booking) ──────────────────────
insert into public.appointment_slots (tenant_id, practitioner_id, slot_date, start_time, end_time, is_booked)
values
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   current_date + 1, '09:00', '09:20', false),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   current_date + 1, '09:20', '09:40', false),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   current_date + 1, '09:40', '10:00', true),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
   current_date + 1, '10:00', '10:20', false),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000003',
   current_date + 1, '10:00', '10:20', false),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000003',
   current_date + 1, '10:20', '10:40', false),
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000003',
   current_date + 1, '11:00', '11:20', true)
on conflict do nothing;

-- ── Done ─────────────────────────────────────────────────────
select 'Seed complete ✓' as status,
  (select count(*) from public.tenants)            as tenants,
  (select count(*) from public.patients)           as patients,
  (select count(*) from public.queue_tokens)       as queue_tokens,
  (select count(*) from public.beds)               as beds,
  (select count(*) from public.admissions)         as admissions,
  (select count(*) from public.stock_items)        as stock_items,
  (select count(*) from public.observations)       as observations,
  (select count(*) from public.bills)              as bills,
  (select count(*) from public.lab_samples)        as lab_samples;
