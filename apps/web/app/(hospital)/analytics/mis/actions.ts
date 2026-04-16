"use server";

// ── S-REPORT-MIS: MIS Reports — Server Actions ────────────────────────────────
// All actions are tenant-scoped via RLS (public.jwt_tenant()).
// import { createClient } from "@/utils/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MISMetrics {
  newAdmissions: number;
  discharges: number;
  opdVisits: number;
  labTests: number;
  totalRevenue: number;
}

export interface DepartmentRow {
  department: string;
  newAdmissions: number;
  discharges: number;
  opdVisits: number;
  labTests: number;
  revenue: number;
}

export interface MISReportData {
  metrics: MISMetrics;
  departments: DepartmentRow[];
}

export type DateRange = {
  from: string; // ISO date string YYYY-MM-DD
  to: string;   // ISO date string YYYY-MM-DD
};

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Fetch summary metrics for the given date range.
 *
 * TODO: const supabase = await createClient();
 *
 * TODO: newAdmissions — count admissions where created_at between range.from and range.to
 *   const { count: newAdmissions } = await supabase
 *     .from("admissions")
 *     .select("*", { count: "exact", head: true })
 *     .gte("created_at", range.from)
 *     .lte("created_at", range.to + "T23:59:59Z");
 *
 * TODO: discharges — count admissions where status = 'discharged' and discharged_at in range
 *   const { count: discharges } = await supabase
 *     .from("admissions")
 *     .select("*", { count: "exact", head: true })
 *     .eq("status", "discharged")
 *     .gte("discharged_at", range.from)
 *     .lte("discharged_at", range.to + "T23:59:59Z");
 *
 * TODO: opdVisits — count encounters where class = 'opd' and created_at in range
 *   const { count: opdVisits } = await supabase
 *     .from("encounters")
 *     .select("*", { count: "exact", head: true })
 *     .eq("class", "opd")
 *     .gte("created_at", range.from)
 *     .lte("created_at", range.to + "T23:59:59Z");
 *
 * TODO: labTests — count lab_samples where created_at in range
 *   const { count: labTests } = await supabase
 *     .from("lab_samples")
 *     .select("*", { count: "exact", head: true })
 *     .gte("created_at", range.from)
 *     .lte("created_at", range.to + "T23:59:59Z");
 *
 * TODO: totalRevenue — sum bills.total_amount where created_at in range
 *   const { data: revData } = await supabase
 *     .from("bills")
 *     .select("total_amount")
 *     .gte("created_at", range.from)
 *     .lte("created_at", range.to + "T23:59:59Z");
 *   const totalRevenue = revData?.reduce((acc, r) => acc + (r.total_amount ?? 0), 0) ?? 0;
 */
export async function getMISMetrics(range: DateRange): Promise<MISMetrics> {
  // TODO: replace stubs with real Supabase queries above
  void range;
  return {
    newAdmissions: 0,
    discharges: 0,
    opdVisits: 0,
    labTests: 0,
    totalRevenue: 0,
  };
}

/**
 * Fetch per-department breakdown for the given date range.
 *
 * TODO: const supabase = await createClient();
 *
 * Department is derived from encounters.department (or admissions.department).
 * For each metric, group by department and aggregate.
 *
 * TODO: admissions breakdown — query admissions joined with encounters
 *   grouped by department, counted in range:
 *   SELECT e.department,
 *          COUNT(*) FILTER (WHERE a.created_at BETWEEN $from AND $to)  AS new_admissions,
 *          COUNT(*) FILTER (WHERE a.status='discharged' AND a.discharged_at BETWEEN $from AND $to) AS discharges
 *   FROM admissions a
 *   JOIN encounters e ON e.id = a.encounter_id
 *   WHERE a.tenant_id = jwt_tenant()
 *   GROUP BY e.department;
 *
 * TODO: opd visits per department — query encounters where class='opd' grouped by department
 * TODO: lab tests per department — query lab_samples joined to encounters grouped by department
 * TODO: revenue per department — query bills joined to encounters grouped by department
 *
 * Use supabase.rpc("mis_department_breakdown", { from_date: range.from, to_date: range.to })
 * after creating the corresponding SQL function in a migration.
 */
export async function getDepartmentBreakdown(range: DateRange): Promise<DepartmentRow[]> {
  // TODO: replace with real Supabase RPC or joined query above
  void range;
  return [];
}

/**
 * Fetch both metrics and department breakdown in a single call.
 * Convenience wrapper used by the page component.
 */
export async function getMISReport(range: DateRange): Promise<MISReportData> {
  const [metrics, departments] = await Promise.all([
    getMISMetrics(range),
    getDepartmentBreakdown(range),
  ]);
  return { metrics, departments };
}
