// vitals/actions.ts — real Supabase implementation
import { supabase } from "../../../lib/supabase";

export interface VitalsPayload {
  patientId:   string;
  encounterId?: string;
  temp?:   number;
  spo2?:   number;
  rr?:     number;
  hr?:     number;
  pain?:   number;
  sysBp?:  number;
  diaBp?:  number;
}

interface ObsRow {
  patient_id:   string;
  encounter_id?: string;
  code:          string;
  display:       string;
  value_num:     number;
  value_unit:    string;
  effective_at:  string;
  status:        string;
}

const LOINC = [
  { key: "temp",  code: "8310-5",  display: "Body temperature",       unit: "°C"    },
  { key: "spo2",  code: "59408-5", display: "Oxygen saturation",       unit: "%"     },
  { key: "rr",    code: "9279-1",  display: "Respiratory rate",        unit: "/min"  },
  { key: "hr",    code: "8867-4",  display: "Heart rate",              unit: "bpm"   },
  { key: "pain",  code: "72514-3", display: "Pain severity (NRS)",     unit: "score" },
  { key: "sysBp", code: "8480-6",  display: "Systolic blood pressure", unit: "mmHg"  },
  { key: "diaBp", code: "8462-4",  display: "Diastolic blood pressure",unit: "mmHg"  },
] as const;

/** Insert one FHIR Observation row per vital sign provided */
export async function saveVitals(payload: VitalsPayload): Promise<void> {
  const now = new Date().toISOString();
  const rows: ObsRow[] = [];

  for (const col of LOINC) {
    const val = (payload as any)[col.key];
    if (val == null || isNaN(val)) continue;
    rows.push({
      patient_id:   payload.patientId,
      encounter_id: payload.encounterId,
      code:         col.code,
      display:      col.display,
      value_num:    val,
      value_unit:   col.unit,
      effective_at: now,
      status:       "final",
    });
  }

  if (rows.length === 0) throw new Error("At least one vital value is required");

  const { error } = await supabase.from("observations").insert(rows);
  if (error) throw new Error(error.message);
}

export interface VitalsQueueItem {
  patient_id:    string;
  patient_name:  string;
  bed_label:     string;
  last_recorded: string | null;
  overdue:       boolean;
}

/**
 * Fetch admitted patients whose vitals haven't been recorded in >4 hours.
 * Uses a Postgres view if present, otherwise two-step query.
 */
export async function fetchVitalsQueue(tenantId: string): Promise<VitalsQueueItem[]> {
  // Get all admitted patients with their beds
  const { data: admitted, error: e1 } = await supabase
    .from("admissions")
    .select(`
      patient_id,
      patients ( full_name ),
      beds ( label )
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "admitted");

  if (e1) throw new Error(e1.message);
  if (!admitted || admitted.length === 0) return [];

  const patientIds = admitted.map((a: any) => a.patient_id);

  // Get last vitals time for each patient
  const { data: lastObs } = await supabase
    .from("observations")
    .select("patient_id, effective_at")
    .eq("tenant_id", tenantId)
    .eq("code", "8867-4") // HR as proxy for "vitals recorded"
    .in("patient_id", patientIds)
    .order("effective_at", { ascending: false });

  const lastMap: Record<string, string> = {};
  for (const obs of (lastObs ?? [])) {
    if (!lastMap[(obs as any).patient_id]) {
      lastMap[(obs as any).patient_id] = (obs as any).effective_at;
    }
  }

  const now = Date.now();
  return admitted.map((row: any) => {
    const last = lastMap[row.patient_id] ?? null;
    const hoursAgo = last ? (now - new Date(last).getTime()) / 3600000 : Infinity;
    return {
      patient_id:    row.patient_id,
      patient_name:  row.patients?.full_name ?? "Unknown",
      bed_label:     row.beds?.label ?? "—",
      last_recorded: last,
      overdue:       hoursAgo > 4,
    };
  });
}
