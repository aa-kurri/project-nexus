"use server";

import { createClient } from "@/utils/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MISMetrics {
  newAdmissions: number;
  discharges:    number;
  opdVisits:     number;
  labTests:      number;
  totalRevenue:  number;
}

export interface DepartmentRow {
  department:    string;
  newAdmissions: number;
  discharges:    number;
  opdVisits:     number;
  labTests:      number;
  revenue:       number;
}

export interface MISReportData {
  metrics:     MISMetrics;
  departments: DepartmentRow[];
}

export type DateRange = {
  from: string; // YYYY-MM-DD
  to:   string; // YYYY-MM-DD
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function rangeTs(range: DateRange) {
  return {
    start: `${range.from}T00:00:00.000Z`,
    end:   `${range.to}T23:59:59.999Z`,
  };
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Fetch summary metrics for the given date range.
 *
 * Schema used:
 *   encounters  – id, class, status, started_at   (RLS: jwt_tenant())
 *   lab_samples – encounter_id                    (RLS: jwt_tenant())
 *   bills       – encounter_id, total_amount       (RLS: jwt_tenant())
 */
export async function getMISMetrics(range: DateRange): Promise<MISMetrics> {
  const supabase = await createClient();
  const { start, end } = rangeTs(range);

  // 1. All encounters in range → derive OPD visits, admissions, discharges
  const { data: encounters } = await supabase
    .from("encounters")
    .select("id, class, status")
    .gte("started_at", start)
    .lte("started_at", end);

  const enc = encounters ?? [];
  const encIds = enc.map((e) => e.id as string);

  const opdVisits     = enc.filter((e) => e.class === "opd").length;
  const newAdmissions = enc.filter((e) => e.class === "ipd").length;
  const discharges    = enc.filter((e) => e.class === "ipd" && e.status === "finished").length;

  // 2. Lab samples linked to encounters in range
  let labTests = 0;
  if (encIds.length > 0) {
    const { count } = await supabase
      .from("lab_samples")
      .select("*", { count: "exact", head: true })
      .in("encounter_id", encIds);
    labTests = count ?? 0;
  }

  // 3. Bills linked to encounters in range
  let totalRevenue = 0;
  if (encIds.length > 0) {
    const { data: bills } = await supabase
      .from("bills")
      .select("total_amount")
      .in("encounter_id", encIds);
    totalRevenue = (bills ?? []).reduce((s, b) => s + (b.total_amount ?? 0), 0);
  }

  return { newAdmissions, discharges, opdVisits, labTests, totalRevenue };
}

/**
 * Fetch per-class (department) breakdown for the given date range.
 * Groups encounters by their `class` field (opd / ipd / emergency / …).
 */
export async function getDepartmentBreakdown(range: DateRange): Promise<DepartmentRow[]> {
  const supabase = await createClient();
  const { start, end } = rangeTs(range);

  const { data: encounters } = await supabase
    .from("encounters")
    .select("id, class, status")
    .gte("started_at", start)
    .lte("started_at", end);

  const enc = encounters ?? [];

  // Group encounter IDs by class
  const classMap: Record<string, { ids: string[]; discharges: number }> = {};
  for (const e of enc) {
    const cls = (e.class as string) || "other";
    if (!classMap[cls]) classMap[cls] = { ids: [], discharges: 0 };
    classMap[cls].ids.push(e.id as string);
    if (e.status === "finished") classMap[cls].discharges += 1;
  }

  const classes = Object.keys(classMap);
  if (classes.length === 0) return [];

  // Fetch lab counts and revenue per class in parallel
  const rows = await Promise.all(
    classes.map(async (cls) => {
      const { ids, discharges } = classMap[cls];

      const [labRes, billRes] = await Promise.all([
        supabase
          .from("lab_samples")
          .select("*", { count: "exact", head: true })
          .in("encounter_id", ids),
        supabase
          .from("bills")
          .select("total_amount")
          .in("encounter_id", ids),
      ]);

      const labTests = labRes.count ?? 0;
      const revenue  = (billRes.data ?? []).reduce((s, b) => s + (b.total_amount ?? 0), 0);

      return {
        department:    cls,
        newAdmissions: cls === "ipd" ? ids.length : 0,
        discharges:    cls === "ipd" ? discharges  : 0,
        opdVisits:     cls === "opd" ? ids.length  : 0,
        labTests,
        revenue,
      } satisfies DepartmentRow;
    })
  );

  return rows.sort((a, b) => b.revenue - a.revenue);
}

/** Convenience wrapper: returns both metrics and breakdown in one call. */
export async function getMISReport(range: DateRange): Promise<MISReportData> {
  const [metrics, departments] = await Promise.all([
    getMISMetrics(range),
    getDepartmentBreakdown(range),
  ]);
  return { metrics, departments };
}
