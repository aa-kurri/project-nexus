"use server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DrugSearchResult {
  id:       string;
  name:     string;
  generic:  string;
  form:     string;
  strength: string;
  in_stock: boolean;
}

export interface RxLine {
  drug:      string; // drug name + strength as typed / selected
  dose:      string;
  frequency: string;
  duration:  string;
  route:     string;
}

export interface CreateRxPayload {
  patientId:   string;
  encounterId?: string;
  lines:       RxLine[];
}

export interface MedicationRequestRow {
  id:          string;
  drug_name:   string;
  strength:    string | null;
  dosage:      string;
  route:       string | null;
  status:      string;
  authored_at: string;
}

export interface InteractionWarning {
  drug1:    string;
  drug2:    string;
  severity: "contraindicated" | "major" | "moderate" | "minor";
  summary:  string;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Search the hospital formulary (stock_items) for drugs matching the query.
 *
 * TODO: implement:
 *   supabase
 *     .from("stock_items")
 *     .select("id, name, generic, form, strength")
 *     .eq("tenant_id", jwtTenant())
 *     .ilike("name", `%${query}%`)
 *     .limit(10)
 *   — join with stock_batches to derive in_stock = (sum(quantity) > 0)
 */
export async function searchDrugs(query: string): Promise<DrugSearchResult[]> {
  // TODO: replace with real Supabase query
  throw new Error("searchDrugs: not yet implemented");
}

/**
 * Bulk-create medication_request rows for a prescription.
 *
 * TODO: implement:
 *   supabase.from("medication_requests").insert(
 *     payload.lines.map(line => ({
 *       tenant_id:     jwtTenant(),
 *       patient_id:    payload.patientId,
 *       encounter_id:  payload.encounterId ?? null,
 *       prescriber_id: auth.uid(),
 *       drug_name:     parseDrugName(line.drug),
 *       strength:      parseStrength(line.drug),
 *       dosage:        `${line.dose} ${line.frequency} for ${line.duration}`,
 *       route:         line.route,
 *       status:        "active",
 *     }))
 *   )
 *   — then insert audit_log (HMAC chain) for each row
 *   — then trigger pharmacy dispense queue notification via Supabase Realtime
 */
export async function createMedicationRequests(
  payload: CreateRxPayload,
): Promise<MedicationRequestRow[]> {
  // TODO: replace with real Supabase mutation
  throw new Error("createMedicationRequests: not yet implemented");
}

/**
 * Check interactions between a new prescription list and a patient's existing
 * active medication_requests.
 *
 * TODO: implement:
 *   1. Fetch patient's active meds from medication_requests
 *   2. Combine with new rx lines
 *   3. Call OpenFDA /drug/interaction API or local drug_interactions table
 *   Returns list of interaction warnings sorted by severity desc.
 */
export async function checkInteractions(
  patientId: string,
  newLines:  RxLine[],
): Promise<InteractionWarning[]> {
  // TODO: replace with real interaction check
  throw new Error("checkInteractions: not yet implemented");
}

/**
 * Cancel (stop) an existing medication_request.
 *
 * TODO: implement:
 *   supabase.from("medication_requests")
 *     .update({ status: "stopped" })
 *     .eq("id", rxId)
 *     .eq("tenant_id", jwtTenant())
 *     .eq("prescriber_id", auth.uid())  -- only prescriber can stop
 */
export async function stopMedication(rxId: string): Promise<void> {
  // TODO: replace with real Supabase update
  throw new Error("stopMedication: not yet implemented");
}
