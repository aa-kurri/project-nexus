"use server";
// Server actions for admin tab screens.
// All queries and mutations are tenant-scoped — jwt_tenant() enforced by RLS.

import { supabase } from "../../../lib/supabase";

// ── Shared types ──────────────────────────────────────────────────────────────
export type MobileRole = "patient" | "doctor" | "admin" | "staff";
export type StaffRole  = "doctor" | "nurse" | "pharmacist" | "lab_manager" | "admin" | "staff";
export type BedStatus  = "occupied" | "vacant" | "reserved" | "maintenance";
export type BillStatus = "pending" | "partial" | "paid" | "overdue";

// ── Feature flags ─────────────────────────────────────────────────────────────
export interface FeatureFlag {
  id:          string;
  feature_key: string;
  label:       string;
  mobile_role: MobileRole;
  enabled:     boolean;
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  // TODO: call from feature-flags screen on mount
  const { data, error } = await supabase
    .from("mobile_feature_flags")
    .select("id, feature_key, label, mobile_role, enabled")
    .order("mobile_role")
    .order("label");

  if (error) throw new Error(error.message);
  return (data ?? []) as FeatureFlag[];
}

export async function toggleFeatureFlag(id: string, enabled: boolean): Promise<void> {
  // TODO: add optimistic update on the client before calling this
  const { error } = await supabase
    .from("mobile_feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function bulkSetRoleFlags(
  mobile_role: MobileRole,
  enabled: boolean,
  tenantId: string,
): Promise<void> {
  const { error } = await supabase
    .from("mobile_feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("mobile_role", mobile_role)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  admissionsToday: number;
  dischargesToday: number;
  bedsOccupied:    number;
  bedsTotal:       number;
  occupancyPct:    number;
  revenueToday:    number; // rupees
}

/**
 * Fetch KPI aggregates for the admin dashboard.
 *
 * TODO: implement — fan out to:
 *   admissions WHERE DATE(admitted_at) = CURRENT_DATE AND status = 'admitted'  → admissionsToday
 *   admissions WHERE DATE(discharged_at) = CURRENT_DATE AND status = 'discharged' → dischargesToday
 *   beds WHERE status = 'occupied' / COUNT(*) → bedsOccupied, bedsTotal
 *   bills WHERE DATE(created_at) = CURRENT_DATE AND status = 'paid' → revenueToday
 * All filtered by tenant_id = jwt_tenant() (enforced by RLS).
 */
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  // TODO: replace stubs with real Supabase queries
  return {
    admissionsToday: 0,
    dischargesToday: 0,
    bedsOccupied:    0,
    bedsTotal:       0,
    occupancyPct:    0,
    revenueToday:    0,
  };
}

// ── Ward census ───────────────────────────────────────────────────────────────

export interface WardCensus {
  ward:     string;
  occupied: number;
  total:    number;
}

/**
 * Aggregate active admissions grouped by ward.
 *
 * TODO: SELECT b.ward, COUNT(*) FILTER (WHERE b.status = 'occupied') AS occupied,
 *              COUNT(*) AS total
 *       FROM beds b
 *       WHERE b.tenant_id = jwt_tenant()
 *       GROUP BY b.ward
 *       ORDER BY b.ward
 */
export async function getWardCensus(): Promise<WardCensus[]> {
  // TODO: implement
  return [];
}

// ── Bed map ───────────────────────────────────────────────────────────────────

export interface BedMapItem {
  id:         string;
  ward:       string;
  bed_number: string;
  status:     BedStatus;
  patientName: string | null;
}

/**
 * Load all beds with their current occupant for the admin bed-management screen.
 *
 * TODO: SELECT b.id, b.ward, b.bed_number, b.status,
 *              p.full_name AS patient_name
 *       FROM beds b
 *       LEFT JOIN admissions a
 *         ON a.bed_id = b.id AND a.status = 'admitted'
 *       LEFT JOIN patients p ON p.id = a.patient_id
 *       WHERE b.tenant_id = jwt_tenant()
 *       ORDER BY b.ward, b.bed_number
 */
export async function getBedMap(): Promise<BedMapItem[]> {
  // TODO: implement
  return [];
}

/**
 * Change a bed's status (vacant → reserved, occupied → discharged, etc.).
 *
 * TODO: UPDATE beds SET status = $newStatus WHERE id = $bedId AND tenant_id = jwt_tenant()
 *       If newStatus = 'vacant', also UPDATE admissions SET status = 'discharged',
 *       discharged_at = now() WHERE bed_id = $bedId AND status = 'admitted'
 */
export async function changeBedStatus(bedId: string, newStatus: BedStatus): Promise<void> {
  // TODO: implement
}

// ── Billing ───────────────────────────────────────────────────────────────────

export interface TodayCharge {
  id:         string;
  patientName: string;
  amount:     number;
  dueDate:    string;
  status:     BillStatus;
  itemCount:  number;
}

/**
 * Fetch today's bills with totals for the billing screen.
 *
 * TODO: SELECT b.id, p.full_name, b.status, b.due_date,
 *              SUM(bi.unit_price * bi.qty) AS amount,
 *              COUNT(bi.id) AS item_count
 *       FROM bills b
 *       JOIN patients p ON p.id = b.patient_id
 *       JOIN bill_items bi ON bi.bill_id = b.id
 *       WHERE b.tenant_id = jwt_tenant()
 *         AND DATE(b.created_at) = CURRENT_DATE
 *       GROUP BY b.id, p.full_name, b.status, b.due_date
 *       ORDER BY b.due_date ASC
 */
export async function getTodayCharges(): Promise<TodayCharge[]> {
  // TODO: implement
  return [];
}

/**
 * Mark a bill as paid.
 *
 * TODO: UPDATE bills
 *       SET status = 'paid', paid_at = now()
 *       WHERE id = $billId AND tenant_id = jwt_tenant()
 */
export async function recordPayment(billId: string): Promise<void> {
  // TODO: implement
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export interface StaffProfile {
  id:     string;
  name:   string;
  role:   StaffRole;
  dept:   string | null;
  status: "on_duty" | "off_duty";
}

/**
 * Paginated staff list for the current tenant.
 *
 * TODO: SELECT id, full_name, role, department, duty_status
 *       FROM profiles
 *       WHERE tenant_id = jwt_tenant() AND role != 'patient'
 *       ORDER BY role, full_name
 *       LIMIT $pageSize OFFSET $page * $pageSize
 */
export async function getStaffList(page = 0, pageSize = 25): Promise<StaffProfile[]> {
  // TODO: implement — add department + duty_status columns to profiles if absent
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id:     r.id,
    name:   r.full_name ?? "Unknown",
    role:   r.role as StaffRole,
    dept:   null,
    status: "on_duty" as const,
  }));
}

/**
 * Update a staff member's role via the admin.
 *
 * TODO: UPDATE profiles
 *       SET role = $newRole, updated_at = now()
 *       WHERE id = $staffId AND tenant_id = jwt_tenant()
 * RLS: only profiles with role IN ('admin', 'su') may update other rows.
 */
export async function updateStaffRole(staffId: string, newRole: StaffRole): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", staffId);

  if (error) throw new Error(error.message);
}
