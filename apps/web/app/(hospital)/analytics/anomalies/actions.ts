"use server";

import { createClient } from "@/utils/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnomalyAlert {
  id:           string;
  metric:       string;
  value:        number;
  baseline:     number;
  z_score:      number;
  severity:     "info" | "warning" | "critical";
  acknowledged: boolean;
  created_at:   string;
}

interface DailyMetric { date: string; value: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

function mean(arr: number[]) {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}
function stddev(arr: number[], mu: number) {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((s, v) => s + (v - mu) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function severity(z: number): "info" | "warning" | "critical" {
  if (Math.abs(z) >= 3) return "critical";
  if (Math.abs(z) >= 2) return "warning";
  return "info";
}

// ── Core detection ────────────────────────────────────────────────────────────

/**
 * detectAnomalies
 *
 * Computes a 7-day rolling baseline for four metrics and flags today's values
 * that deviate by ≥ 2σ. Results are upserted into anomaly_alerts.
 *
 * Metrics:
 *   opd_visits      – encounters where class = 'opd'
 *   ipd_admissions  – encounters where class = 'ipd'
 *   lab_tests       – lab_samples (joined via encounter_id → encounters)
 *   revenue         – bills.total_amount (joined via encounter_id → encounters)
 */
export async function detectAnomalies(): Promise<AnomalyAlert[]> {
  const supabase = await createClient();

  const today = new Date();
  const todayStr = isoDate(today);

  // Pull 8 days of encounters (7-day baseline + today)
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - 7);
  const windowStartStr = isoDate(windowStart);

  const { data: encounters } = await supabase
    .from("encounters")
    .select("id, class, started_at")
    .gte("started_at", `${windowStartStr}T00:00:00.000Z`)
    .lte("started_at", `${todayStr}T23:59:59.999Z`);

  const enc = encounters ?? [];
  const encIds = enc.map((e) => e.id as string);

  // Group encounter IDs by date
  const encByDate: Record<string, string[]> = {};
  for (const e of enc) {
    const d = (e.started_at as string).slice(0, 10);
    if (!encByDate[d]) encByDate[d] = [];
    encByDate[d].push(e.id as string);
  }

  // Fetch bills linked to encounters in window
  const billsByEncId: Record<string, number> = {};
  if (encIds.length > 0) {
    const { data: bills } = await supabase
      .from("bills")
      .select("encounter_id, total_amount")
      .in("encounter_id", encIds);
    for (const b of bills ?? []) {
      billsByEncId[b.encounter_id as string] = (b.total_amount as number) ?? 0;
    }
  }

  // Fetch lab_samples linked to encounters in window
  const labEncIds = new Set<string>();
  if (encIds.length > 0) {
    const { data: labs } = await supabase
      .from("lab_samples")
      .select("encounter_id")
      .in("encounter_id", encIds);
    for (const l of labs ?? []) labEncIds.add(l.encounter_id as string);
  }

  // Build daily series for each metric
  function dailySeries(
    fn: (dateEncIds: string[]) => number
  ): DailyMetric[] {
    return Object.entries(encByDate).map(([date, ids]) => ({
      date,
      value: fn(ids),
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  const opdSeries = dailySeries((ids) =>
    enc.filter((e) => ids.includes(e.id as string) && e.class === "opd").length
  );
  const ipdSeries = dailySeries((ids) =>
    enc.filter((e) => ids.includes(e.id as string) && e.class === "ipd").length
  );
  const labSeries = dailySeries((ids) =>
    ids.filter((id) => labEncIds.has(id)).length
  );
  const revSeries = dailySeries((ids) =>
    ids.reduce((s, id) => s + (billsByEncId[id] ?? 0), 0)
  );

  const metrics: { key: string; label: string; series: DailyMetric[] }[] = [
    { key: "opd_visits",     label: "OPD Visits",     series: opdSeries },
    { key: "ipd_admissions", label: "IPD Admissions",  series: ipdSeries },
    { key: "lab_tests",      label: "Lab Tests",       series: labSeries },
    { key: "revenue",        label: "Revenue (₹)",    series: revSeries },
  ];

  // Detect anomalies
  const detected: Omit<AnomalyAlert, "id" | "created_at">[] = [];

  for (const { key, series } of metrics) {
    if (series.length < 3) continue; // not enough data

    const todayEntry = series.find((s) => s.date === todayStr);
    if (!todayEntry) continue;

    const baseline7 = series.filter((s) => s.date < todayStr).map((s) => s.value);
    if (baseline7.length < 2) continue;

    const mu = mean(baseline7);
    const sd = stddev(baseline7, mu);
    if (sd === 0) continue; // no variance

    const z = (todayEntry.value - mu) / sd;
    if (Math.abs(z) < 2) continue; // within normal range

    detected.push({
      metric:       key,
      value:        todayEntry.value,
      baseline:     Math.round(mu * 100) / 100,
      z_score:      Math.round(z * 100) / 100,
      severity:     severity(z),
      acknowledged: false,
    });
  }

  // Upsert into DB (skip if identical metric already alerted today)
  if (detected.length > 0) {
    // Get tenant_id from current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.tenant_id) {
        // Delete today's unacknowledged alerts for these metrics then re-insert
        const metricKeys = detected.map((d) => d.metric);
        await supabase
          .from("anomaly_alerts")
          .delete()
          .in("metric", metricKeys)
          .eq("acknowledged", false)
          .gte("created_at", `${todayStr}T00:00:00.000Z`);

        await supabase.from("anomaly_alerts").insert(
          detected.map((d) => ({ ...d, tenant_id: profile.tenant_id }))
        );
      }
    }
  }

  // Return all active (unacknowledged) alerts for this tenant
  return getActiveAlerts();
}

/** Fetch all unacknowledged anomaly alerts for the current tenant. */
export async function getActiveAlerts(): Promise<AnomalyAlert[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("anomaly_alerts")
    .select("id, metric, value, baseline, z_score, severity, acknowledged, created_at")
    .eq("acknowledged", false)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as AnomalyAlert[];
}

/** Acknowledge a single alert by ID. */
export async function acknowledgeAlert(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("anomaly_alerts")
    .update({ acknowledged: true })
    .eq("id", id);
}

/** Fetch alert history (last 30 days, including acknowledged). */
export async function getAlertHistory(): Promise<AnomalyAlert[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data } = await supabase
    .from("anomaly_alerts")
    .select("id, metric, value, baseline, z_score, severity, acknowledged, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as AnomalyAlert[];
}
