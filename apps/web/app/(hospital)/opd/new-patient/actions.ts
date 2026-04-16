"use server";

import { z } from "zod";

const Schema = z.object({
  phone:  z.string().min(7),
  name:   z.string().min(2),
  dob:    z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
});

import { createClient } from "@/utils/supabase/server";

export async function registerPatient(input: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createClient();
  
  // 1. Get Tenant Context from session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { ok: false as const, error: "Tenant not found" };

  // 2. Insert Patient with generated MRN
  const mrn = `MRN-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  
  const { data: patient, error: patientErr } = await supabase
    .from("patients")
    .insert([{
      tenant_id: profile.tenant_id,
      phone: parsed.data.phone,
      full_name: parsed.data.name,
      dob: parsed.data.dob,
      gender: parsed.data.gender,
      mrn: mrn,
    }])
    .select()
    .single();

  if (patientErr) {
    if (patientErr.code === '23505') return { ok: false as const, error: "Patient already exists" };
    return { ok: false as const, error: patientErr.message };
  }

  // 3. Create initial OPD token for today
  await supabase.from("queue_tokens").insert([{
    tenant_id: profile.tenant_id,
    patient_id: patient.id,
    token_number: Math.floor(Math.random() * 100) + 1,
    token_date: new Date().toISOString().split('T')[0],
    status: 'waiting'
  }]);

  return { ok: true as const };
}
