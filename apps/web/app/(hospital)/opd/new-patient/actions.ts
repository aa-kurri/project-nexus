"use server";

import { z } from "zod";

const Schema = z.object({
  phone:  z.string().min(7),
  name:   z.string().min(2),
  dob:    z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
});

export async function registerPatient(input: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // TODO: implement with real Supabase writes
  // 1. Check for existing patient by phone (tenant-scoped)
  //    const { data: existing } = await sb.from("patients").select("id").eq("phone", phone).maybeSingle()
  // 2. If not found, insert new patient row
  //    const { data: patient } = await sb.from("patients").insert({ tenant_id, phone, full_name: name, dob, gender, mrn: generateMRN() }).select().single()
  // 3. Upsert a queue_token for today's OPD
  //    await sb.from("queue_tokens").insert({ tenant_id, patient_id: patient.id, practitioner_id, token_number: nextToken() })
  // 4. Append audit_log "patient.created"

  await new Promise(r => setTimeout(r, 600));
  return { ok: true as const };
}
