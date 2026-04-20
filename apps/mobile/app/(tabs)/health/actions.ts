import { supabase } from "../../../lib/supabase";

export interface TrendPoint {
  label: string;
  value: number;
  timestamp: string;
}

export type MetricKind = "steps" | "hr" | "spo2";

const LOINC: Record<MetricKind, string> = {
  hr:    "8867-4",
  spo2:  "59408-5",
  steps: "55423-8",
};

/**
 * Fetch last 7 days of observation data for a specific metric.
 * Aggregates by day or shows last N points.
 */
export async function fetchMetricTrend(
  patientId: string,
  kind: MetricKind,
  limit = 20
): Promise<TrendPoint[]> {
  const { data, error } = await supabase
    .from("observations")
    .select("effective_at, value_num")
    .eq("patient_id", patientId)
    .eq("code", LOINC[kind])
    .order("effective_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((obs: any) => ({
      label: new Date(obs.effective_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: obs.value_num ?? 0,
      timestamp: obs.effective_at,
    }))
    .reverse(); // Chronological for chart
}

export async function syncToHospital(metrics: any[]) {
  const { error } = await supabase.from("observations").insert(metrics);
  if (error) throw new Error(error.message);
}
