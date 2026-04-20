// dispense/actions.ts — real Supabase implementation
import { supabase } from "../../../lib/supabase";

export interface PendingRx {
  id:          string;
  drug_name:   string;
  strength:    string | null;
  route:       string | null;
  dosage:      string | null;
  patient_name:string;
  bed_label:   string | null;
  urgent:      boolean;
}

export interface LowStockItem {
  id:       string;
  name:     string;
  quantity: number;
  unit:     string;
}

/** Fetch active prescriptions not yet dispensed */
export async function fetchPendingRx(tenantId: string): Promise<PendingRx[]> {
  const { data, error } = await supabase
    .from("medication_requests")
    .select(`
      id, drug_name, strength, route, dosage, status, authored_at,
      patients ( full_name ),
      admissions!inner ( beds ( label ) )
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("authored_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id:           row.id,
    drug_name:    row.drug_name,
    strength:     row.strength,
    route:        row.route,
    dosage:       row.dosage,
    patient_name: row.patients?.full_name ?? "Unknown",
    bed_label:    row.admissions?.[0]?.beds?.label ?? null,
    urgent:       false, // could be derived from a priority field
  }));
}

/** Mark a prescription as dispensed */
export async function recordDispense(rxId: string): Promise<void> {
  const { error } = await supabase
    .from("medication_requests")
    .update({ status: "completed" })
    .eq("id", rxId);

  if (error) throw new Error(error.message);
}

/** Fetch stock items below reorder level */
export async function fetchLowStock(tenantId: string): Promise<LowStockItem[]> {
  const { data, error } = await supabase
    .from("stock_items")
    .select("id, name, quantity, min_quantity, unit")
    .eq("tenant_id", tenantId)
    .filter("quantity", "lte", "min_quantity");

  if (error) throw new Error(error.message);
  return data ?? [];
}
