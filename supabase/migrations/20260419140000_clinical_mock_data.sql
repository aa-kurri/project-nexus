-- Clinical Mock Data Schema (Epic 3 & 4)
-- This migration establishes the clinical tables and mock data for the Nurse Station and Doctor portals.

-- 1. Patients Table
create table public.patients (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid references public.tenants(id) not null,
    uhid text unique not null,
    full_name text not null,
    age int,
    sex text,
    diagnosis text,
    ward text,
    bed_no text,
    admit_date timestamptz default now(),
    created_at timestamptz default now()
);

-- 2. Vitals Log Table
create table public.patient_vitals (
    id uuid primary key default uuid_generate_v4(),
    patient_id uuid references public.patients(id) on delete cascade not null,
    recorded_at timestamptz default now(),
    rr int,
    spo2 int,
    sbp int,
    dbp int,
    hr int,
    temp numeric(4,1),
    avpu text,
    on_o2 boolean default false,
    recorded_by uuid references public.profiles(id)
);

-- Enable RLS
alter table public.patients enable row level security;
alter table public.patient_vitals enable row level security;

-- Seeding Clinical Mock Data
DO $$
DECLARE
  tenant_id_val uuid := '00000000-0000-0000-0000-000000000001';
  p1_id uuid;
  p2_id uuid;
BEGIN
    -- Patient 1
    insert into public.patients (tenant_id, uhid, full_name, age, sex, diagnosis, ward, bed_no)
    values (tenant_id_val, 'AY-2026-001', 'Rajesh Kumar', 58, 'Male', 'COPD Exacerbation', 'Ward 3B', 'B-201')
    returning id into p1_id;

    insert into public.patient_vitals (patient_id, rr, spo2, sbp, dbp, hr, temp, avpu, on_o2)
    values (p1_id, 22, 93, 142, 88, 104, 37.8, 'A', true);

    -- Patient 2
    insert into public.patients (tenant_id, uhid, full_name, age, sex, diagnosis, ward, bed_no)
    values (tenant_id_val, 'AY-2026-002', 'Meena Sharma', 45, 'Female', 'Hypertensive Crisis', 'Ward 3B', 'B-205')
    returning id into p2_id;

    insert into public.patient_vitals (patient_id, rr, spo2, sbp, dbp, hr, temp, avpu, on_o2)
    values (p2_id, 26, 91, 188, 110, 118, 38.6, 'A', true);
END $$;
