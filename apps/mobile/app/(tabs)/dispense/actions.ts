"use server";
// Server actions for dispense (pharmacy) tab.
// All queries and mutations are tenant-scoped — jwt_tenant() enforced by RLS.

import { supabase } from "../../../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export interface DispensingPayload {
  rxId: string;
  batchId?: string;  // Optional: specific stock batch to dispense from
}

export interface PendingRx {
  id: string;
  patientId: string;
  patientName: string;
  drugName: string;
  quantity: string;
  ward: string;
  urgent: boolean;
  requestedAt: string;
}

export interface StockAlert {
  id: string;
  itemName: string;
  remaining: string;
  threshold: string;
}

export interface DispenseRecord {
  id: string;
  rxId: string;
  dispensedAt: string;
  dispensedBy: string;
  batchId: string;
}

// ── Actions ────────────────────────────────────────────────────────────────

/**
 * Record a medication dispense event.
 * Inserts into stock_movements table (type='dispense') and marks the Rx as dispensed.
 *
 * TODO: implement with Supabase:
 *   - BEGIN TRANSACTION
 *   - Insert into stock_movements (type='dispense', stock_batch_id, quantity)
 *     Fetch medication_requests.quantity and stock_item details
 *   - Update medication_requests SET status = 'dispensed', dispensed_at = now()
 *   - Return confirmation
 *   - All tenant-scoped by jwt_tenant() via RLS
 */
export async function recordDispense(payload: DispensingPayload): Promise<DispenseRecord> {
  // TODO: replace with real Supabase transaction
  console.log("[DISPENSE] Record dispense stub called:", payload);

  // Simulate delay
  await new Promise((r) => setTimeout(r, 1000));

  return {
    id: `dispense-${Date.now()}`,
    rxId: payload.rxId,
    dispensedAt: new Date().toISOString(),
    dispensedBy: "current-user", // TODO: get from auth.uid()
    batchId: payload.batchId || "batch-unknown",
  };
}

/**
 * Fetch pending prescriptions (medication_requests) for pharmacist.
 *
 * TODO: implement with Supabase:
 *   SELECT mr.id, mr.patient_id, p.full_name, md.drug_name,
 *          mr.quantity, a.bed_number, mr.priority,
 *          mr.created_at
 *   FROM medication_requests mr
 *   JOIN patients p ON p.id = mr.patient_id
 *   JOIN medications md ON md.id = mr.medication_id
 *   JOIN admissions a ON a.patient_id = p.id AND a.status = 'admitted'
 *   WHERE mr.tenant_id = jwt_tenant()
 *         AND mr.status = 'active' (or 'pending_dispense')
 *         AND mr.dispensed_at IS NULL
 *   ORDER BY mr.priority DESC, mr.created_at ASC
 */
export async function fetchPendingRxList(): Promise<PendingRx[]> {
  // TODO: replace with real Supabase query
  console.log("[DISPENSE] Fetch pending Rx list stub called");
  return [];
}

/**
 * Fetch stock items with levels below their threshold.
 *
 * TODO: implement with Supabase:
 *   SELECT si.id, si.item_name,
 *          COALESCE(SUM(sb.quantity - sb.used_qty), 0) AS current_qty,
 *          si.min_threshold
 *   FROM stock_items si
 *   LEFT JOIN stock_batches sb ON sb.stock_item_id = si.id
 *                                 AND sb.expiry_date > now()
 *   WHERE si.tenant_id = jwt_tenant()
 *   GROUP BY si.id, si.item_name, si.min_threshold
 *   HAVING COALESCE(SUM(sb.quantity - sb.used_qty), 0) < si.min_threshold
 *   ORDER BY (si.min_threshold - current_qty) DESC
 */
export async function fetchLowStockAlerts(): Promise<StockAlert[]> {
  // TODO: replace with real Supabase query
  console.log("[DISPENSE] Fetch low stock alerts stub called");
  return [];
}

/**
 * Raise a stock replenishment request.
 *
 * TODO: implement with Supabase:
 *   INSERT INTO stock_movements (type='request', stock_item_id, quantity_requested)
 *   VALUES ($itemId, $quantityNeeded)
 *   WHERE tenant_id = jwt_tenant()
 */
export async function raiseStockRequest(itemId: string, quantityNeeded: number): Promise<void> {
  // TODO: replace with real Supabase insert
  console.log("[DISPENSE] Raise stock request stub called:", itemId, quantityNeeded);
  await new Promise((r) => setTimeout(r, 500));
}
