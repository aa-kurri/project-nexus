"use server";

import { z } from "zod";

// ── Save a single QC run result ───────────────────────────────────────────────

const SaveQcResultSchema = z.object({
  analyser_id:  z.string().uuid(),
  analyte_code: z.string().min(1).max(64),
  run_number:   z.number().int().positive(),
  value:        z.number().finite(),
});

export async function saveQcResult(
  input: z.infer<typeof SaveQcResultSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = SaveQcResultSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // TODO: implement with real Supabase writes
  // 1. Resolve tenant from JWT
  //    const tenant_id = await getServerTenant()  // reads auth.jwt() → tenant_id
  // 2. Fetch target mean/SD for this (analyser, analyte, effective today)
  //    const { data: target } = await sb
  //      .from("lims_qc_targets")
  //      .select("target_mean, target_sd, unit")
  //      .eq("tenant_id", tenant_id)
  //      .eq("analyser_id", analyser_id)
  //      .eq("analyte_code", analyte_code)
  //      .lte("effective_from", new Date().toISOString().slice(0, 10))
  //      .order("effective_from", { ascending: false })
  //      .limit(1)
  //      .single()
  // 3. Fetch the last 19 accepted results for 2-2s rule evaluation
  //    const { data: history } = await sb.from("lims_qc_results") ...
  // 4. Compute Westgard flags  (1-3s, 2-2s, 1-2s)
  //    const flags = computeWestgardFlags(value, target.mean, target.sd, history)
  // 5. Insert the new result row
  //    await sb.from("lims_qc_results").insert({
  //      tenant_id, analyser_id, analyte_code, run_number, value,
  //      mean: target.target_mean, sd: target.target_sd,
  //      westgard_flags: flags,
  //      accepted: !flags.some(f => f === "1-3s" || f === "2-2s"),
  //    })
  // 6. If rejection flag, append an audit_log entry
  //    if (rejected) await sb.from("audit_log").insert({ ... event: "lims.qc.rejection" })

  await new Promise(r => setTimeout(r, 400));
  return { ok: true };
}

// ── Fetch QC run history for a given (analyser, analyte) ─────────────────────

const GetHistorySchema = z.object({
  analyser_id:  z.string().uuid(),
  analyte_code: z.string().min(1).max(64),
  limit:        z.number().int().min(1).max(100).default(20),
});

export async function getQcRunHistory(
  input: z.infer<typeof GetHistorySchema>
): Promise<{ ok: true; data: unknown[] } | { ok: false; error: string }> {
  const parsed = GetHistorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // TODO: implement with real Supabase reads
  // const { data, error } = await sb
  //   .from("lims_qc_results")
  //   .select("id, run_number, value, mean, sd, z_score, westgard_flags, accepted, run_at")
  //   .eq("tenant_id", tenant_id)
  //   .eq("analyser_id", analyser_id)
  //   .eq("analyte_code", analyte_code)
  //   .order("run_number", { ascending: true })
  //   .limit(limit)
  // if (error) return { ok: false, error: error.message }
  // return { ok: true, data }

  await new Promise(r => setTimeout(r, 200));
  return { ok: true, data: [] };
}

// ── List analysers for the current tenant ─────────────────────────────────────

export async function listAnalysers(): Promise<
  { ok: true; data: unknown[] } | { ok: false; error: string }
> {
  // TODO: implement with real Supabase reads
  // const { data, error } = await sb
  //   .from("lims_analysers")
  //   .select("id, name, model, department")
  //   .eq("tenant_id", tenant_id)
  //   .eq("active", true)
  //   .order("name")
  // if (error) return { ok: false, error: error.message }
  // return { ok: true, data }

  await new Promise(r => setTimeout(r, 200));
  return { ok: true, data: [] };
}
