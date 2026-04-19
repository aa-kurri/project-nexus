// rx/actions.ts — real Supabase implementation
import { supabase } from "../../../lib/supabase";

export interface DrugSearchResult {
  id:       string;
  name:     string;
  generic:  string;
  form:     string;
  strength: string;
  in_stock: boolean;
}

export interface RxLine {
  drug:      string;
  dose:      string;
  frequency: string;
  duration:  string;
  route:     string;
}

export interface CreateRxPayload {
  patientId:    string;
  encounterId?: string;
  lines:        RxLine[];
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

/**
 * Search hospital formulary (stock_items) with in-stock derived from stock_batches.
 * Uses ilike for name match; aggregates batch quantity per item.
 */
export async function searchDrugs(query: string): Promise<DrugSearchResult[]> {
  const { data: items, error } = await supabase
    .from("stock_items")
    .select("id, name, generic, form, strength")
    .ilike("name", `%${query}%`)
    .limit(15);

  if (error) throw new Error(error.message);
  if (!items || items.length === 0) return [];

  const ids = items.map((i: any) => i.id);

  // Sum available quantity per item from batches
  const { data: batches } = await supabase
    .from("stock_batches")
    .select("item_id, quantity")
    .in("item_id", ids)
    .gt("quantity", 0)
    .gt("expiry", new Date().toISOString().slice(0, 10)); // not expired

  const stockMap: Record<string, number> = {};
  for (const b of (batches ?? [])) {
    stockMap[(b as any).item_id] = (stockMap[(b as any).item_id] ?? 0) + (b as any).quantity;
  }

  return items.map((i: any) => ({
    id:       i.id,
    name:     i.name,
    generic:  i.generic ?? "",
    form:     i.form ?? "",
    strength: i.strength ?? "",
    in_stock: (stockMap[i.id] ?? 0) > 0,
  }));
}

/**
 * Bulk-create medication_request rows for a prescription, then log to audit_log.
 */
export async function createMedicationRequests(
  payload: CreateRxPayload,
): Promise<MedicationRequestRow[]> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  const rows = payload.lines.map((line) => ({
    patient_id:   payload.patientId,
    encounter_id: payload.encounterId ?? null,
    prescriber_id: userId ?? null,
    drug_name:    line.drug,
    dosage:       `${line.dose} ${line.frequency} for ${line.duration}`,
    route:        line.route,
    status:       "active",
  }));

  const { data, error } = await supabase
    .from("medication_requests")
    .insert(rows)
    .select("id, drug_name, strength, route, dosage, status, authored_at");

  if (error) throw new Error(error.message);

  // Audit log — best-effort
  if (userId && data && data.length > 0) {
    await supabase.from("audit_log").insert({
      actor_id:       userId,
      action:         "rx.create",
      payload:        { patient_id: payload.patientId, rx_ids: data.map((r: any) => r.id) },
      hash_signature: "mobile-rx",
    }).then(() => null); // ignore audit errors
  }

  return (data ?? []).map((r: any) => ({
    id:          r.id,
    drug_name:   r.drug_name,
    strength:    r.strength,
    dosage:      r.dosage,
    route:       r.route,
    status:      r.status,
    authored_at: r.authored_at,
  }));
}

/**
 * Check drug-drug interactions against the drug_interactions table if present,
 * otherwise returns empty (no false positives).
 */
export async function checkInteractions(
  patientId: string,
  newLines:  RxLine[],
): Promise<InteractionWarning[]> {
  // Fetch patient's active medications
  const { data: activeMeds } = await supabase
    .from("medication_requests")
    .select("drug_name")
    .eq("patient_id", patientId)
    .eq("status", "active");

  if (!activeMeds || activeMeds.length === 0) return [];

  const existingDrugs = activeMeds.map((m: any) => m.drug_name.toLowerCase());
  const newDrugs = newLines.map((l) => l.drug.toLowerCase());

  // Try drug_interactions table — gracefully absent
  const { data: interactions } = await supabase
    .from("drug_interactions")
    .select("drug_a, drug_b, severity, summary")
    .in("drug_a", [...existingDrugs, ...newDrugs])
    .in("drug_b", [...existingDrugs, ...newDrugs]);

  if (!interactions) return [];

  return (interactions as any[])
    .filter((ix) => {
      const a = ix.drug_a.toLowerCase();
      const b = ix.drug_b.toLowerCase();
      const crossesNewExisting =
        (newDrugs.includes(a) && existingDrugs.includes(b)) ||
        (newDrugs.includes(b) && existingDrugs.includes(a));
      return crossesNewExisting;
    })
    .map((ix) => ({
      drug1:    ix.drug_a,
      drug2:    ix.drug_b,
      severity: ix.severity as InteractionWarning["severity"],
      summary:  ix.summary,
    }));
}

/** Stop (cancel) an active medication request. */
export async function stopMedication(rxId: string): Promise<void> {
  const { error } = await supabase
    .from("medication_requests")
    .update({ status: "stopped" })
    .eq("id", rxId);

  if (error) throw new Error(error.message);
}
