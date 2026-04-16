"use server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueueTokenRow {
  id: string;
  token_number: number;
  status: "waiting" | "next" | "in-consult" | "done" | "no-show";
  called_at: string | null;
  patient: {
    id: string;
    full_name: string;
    mrn: string;
  };
  encounter: {
    id: string;
    reason: string | null;
  } | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Fetch today's OPD queue for the authenticated doctor.
 *
 * TODO: implement with Supabase client:
 *   supabase
 *     .from("queue_tokens")
 *     .select(`
 *       id, token_number, status, called_at,
 *       patient:patients(id, full_name, mrn),
 *       encounter:encounters(id, reason)
 *     `)
 *     .eq("tenant_id", jwtTenant())
 *     .eq("practitioner_id", auth.uid())
 *     .eq("token_date", new Date().toISOString().split("T")[0])
 *     .neq("status", "done")
 *     .order("token_number", { ascending: true })
 */
export async function fetchTodayQueue(): Promise<QueueTokenRow[]> {
  // TODO: replace with real Supabase query
  throw new Error("fetchTodayQueue: not yet implemented");
}

/**
 * Advance the queue: mark the current in-consult token as done,
 * set the next waiting token to in-consult, record called_at.
 *
 * TODO: implement with Supabase RPC:
 *   supabase.rpc("call_next_patient", {
 *     p_practitioner_id: auth.uid(),
 *     p_tenant_id: jwtTenant(),
 *   })
 *   — RPC atomically transitions statuses and returns the new active token.
 */
export async function callNextPatient(): Promise<QueueTokenRow | null> {
  // TODO: replace with real Supabase RPC call
  throw new Error("callNextPatient: not yet implemented");
}

/**
 * Mark a specific token as no-show.
 *
 * TODO: implement:
 *   supabase.from("queue_tokens").update({ status: "no-show" })
 *     .eq("id", tokenId).eq("tenant_id", jwtTenant())
 */
export async function markNoShow(tokenId: string): Promise<void> {
  // TODO: replace with real Supabase update
  throw new Error("markNoShow: not yet implemented");
}

/**
 * Check drug interactions for all patients in today's queue.
 * Returns pairs of potentially interacting active medication_requests.
 *
 * TODO: implement:
 *   - collect patient_ids from today's queue_tokens
 *   - query medication_requests where patient_id IN (...) AND status = 'active'
 *   - call external interaction API (e.g., OpenFDA /drug/interaction) or
 *     maintain local drug_interactions table
 */
export async function checkQueueInteractions(patientIds: string[]): Promise<{
  patientId: string;
  drug1: string;
  drug2: string;
  severity: string;
}[]> {
  // TODO: replace with real interaction check
  throw new Error("checkQueueInteractions: not yet implemented");
}
