// admin/actions.ts — real Supabase implementation (replaces all stubs)
import { supabase } from "../../../lib/supabase";

export type StaffRole = "su" | "admin" | "doctor" | "nurse" | "pharmacist" | "lab_manager" | "patient" | "staff";
export type MobileRole = "patient" | "doctor" | "admin" | "staff";
export type BedStatus = "vacant" | "occupied" | "reserved" | "maintenance";

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  admissionsToday: number;
  dischargesToday: number;
  bedsOccupied:    number;
  bedsTotal:       number;
  occupancyPct:    number;
  revenueToday:    number;
}

export async function getDashboardKPIs(tenantId: string): Promise<DashboardKPIs> {
  const today = new Date().toISOString().slice(0, 10);

  const [admissionsRes, dischargesRes, bedsRes, revenueRes] = await Promise.all([
    supabase
      .from("admissions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("admitted_at", `${today}T00:00:00`)
      .eq("status", "admitted"),

    supabase
      .from("admissions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("discharged_at", `${today}T00:00:00`)
      .eq("status", "discharged"),

    supabase
      .from("beds")
      .select("id, status")
      .eq("tenant_id", tenantId),

    supabase
      .from("bills")
      .select("total_amount")
      .eq("tenant_id", tenantId)
      .eq("status", "paid")
      .gte("created_at", `${today}T00:00:00`),
  ]);

  const beds = bedsRes.data ?? [];
  const bedsOccupied = beds.filter((b: any) => b.status === "occupied").length;
  const bedsTotal    = beds.length;
  const revenueToday = (revenueRes.data ?? []).reduce((s: number, b: any) => s + (b.total_amount ?? 0), 0);

  return {
    admissionsToday: admissionsRes.count ?? 0,
    dischargesToday: dischargesRes.count ?? 0,
    bedsOccupied,
    bedsTotal,
    occupancyPct:   bedsTotal > 0 ? Math.round((bedsOccupied / bedsTotal) * 100) : 0,
    revenueToday,
  };
}

// ── Ward census ───────────────────────────────────────────────────────────────

export interface WardCensus { ward: string; occupied: number; total: number; }

export async function getWardCensus(tenantId: string): Promise<WardCensus[]> {
  const { data, error } = await supabase
    .from("beds")
    .select("ward, status")
    .eq("tenant_id", tenantId)
    .order("ward");

  if (error) throw new Error(error.message);

  const map: Record<string, { occupied: number; total: number }> = {};
  for (const b of (data ?? []) as { ward: string; status: string }[]) {
    if (!map[b.ward]) map[b.ward] = { occupied: 0, total: 0 };
    map[b.ward].total++;
    if (b.status === "occupied") map[b.ward].occupied++;
  }

  return Object.entries(map).map(([ward, v]) => ({ ward, ...v }));
}

// ── Bed map ───────────────────────────────────────────────────────────────────

export interface BedMapItem {
  id:          string;
  ward:        string;
  label:       string;
  status:      BedStatus;
  patientName: string | null;
  patientId:   string | null;
}

export async function getBedMap(tenantId: string): Promise<BedMapItem[]> {
  const { data, error } = await supabase
    .from("beds")
    .select(`
      id, ward, label, status,
      admissions!left (
        patient_id,
        patients ( full_name )
      )
    `)
    .eq("tenant_id", tenantId)
    .order("ward")
    .order("label");

  if (error) throw new Error(error.message);

  return (data ?? []).map((b: any) => {
    const activeAdmission = (b.admissions ?? []).find((a: any) => a.patient_id);
    return {
      id:          b.id,
      ward:        b.ward,
      label:       b.label,
      status:      b.status as BedStatus,
      patientName: activeAdmission?.patients?.full_name ?? null,
      patientId:   activeAdmission?.patient_id ?? null,
    };
  });
}

export async function changeBedStatus(bedId: string, newStatus: BedStatus): Promise<void> {
  const { error } = await supabase
    .from("beds")
    .update({ status: newStatus })
    .eq("id", bedId);
  if (error) throw new Error(error.message);
}

// ── Billing ───────────────────────────────────────────────────────────────────

export interface TodayCharge {
  id:          string;
  patientName: string;
  amount:      number;
  dueDate:     string;
  status:      string;
  itemCount:   number;
}

export async function getTodayCharges(tenantId: string): Promise<TodayCharge[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("bills")
    .select(`
      id, status, grand_total, created_at, finalized_at,
      patients ( full_name ),
      bill_items ( id )
    `)
    .eq("tenant_id", tenantId)
    .gte("created_at", `${today}T00:00:00`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((b: any) => ({
    id:          b.id,
    patientName: b.patients?.full_name ?? "Unknown",
    amount:      b.grand_total ?? 0,
    dueDate:     b.finalized_at ?? b.created_at,
    status:      b.status,
    itemCount:   (b.bill_items ?? []).length,
  }));
}

export async function recordPayment(billId: string): Promise<void> {
  const { error } = await supabase
    .from("bills")
    .update({ status: "paid", finalized_at: new Date().toISOString() })
    .eq("id", billId);
  if (error) throw new Error(error.message);
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export interface StaffProfile {
  id:     string;
  name:   string;
  role:   StaffRole;
  dept:   string | null;
  status: "on_duty" | "off_duty";
}

export async function getStaffList(tenantId: string, page = 0, pageSize = 40): Promise<StaffProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, department, duty_status")
    .eq("tenant_id", tenantId)
    .neq("role", "patient")
    .order("role")
    .order("full_name")
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id:     r.id,
    name:   r.full_name ?? "Unknown",
    role:   r.role as StaffRole,
    dept:   r.department ?? null,
    status: (r.duty_status as "on_duty" | "off_duty") ?? "on_duty",
  }));
}

export async function updateStaffRole(staffId: string, newRole: StaffRole): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", staffId);
  if (error) throw new Error(error.message);
}

// ── Feature flags (already had real impl — keep intact) ───────────────────────
export interface FeatureFlag {
  id:          string;
  feature_key: string;
  label:       string;
  mobile_role: MobileRole;
  enabled:     boolean;
}

export async function getFeatureFlags(tenantId: string): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from("mobile_feature_flags")
    .select("id, feature_key, label, mobile_role, enabled")
    .eq("tenant_id", tenantId)
    .order("mobile_role")
    .order("label");
  if (error) throw new Error(error.message);
  return (data ?? []) as FeatureFlag[];
}

export async function toggleFeatureFlag(id: string, enabled: boolean): Promise<void> {
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

