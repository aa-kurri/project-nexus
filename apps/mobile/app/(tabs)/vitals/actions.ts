"use server";
// Server actions for vitals tab.
// All queries and mutations are tenant-scoped — jwt_tenant() enforced by RLS.

import { supabase } from "../../../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export interface VitalsPayload {
  patientId: string;
  temp: number | null;      // Celsius
  spo2: number | null;      // Percentage
  rr: number | null;        // Respirations per minute
  hr: number | null;        // Heart rate in beats per minute
  pain: number | null;      // Pain score 0-10
  sysBp: number | null;     // Systolic blood pressure
  diaBp: number | null;     // Diastolic blood pressure
}

export interface VitalsObservation {
  id: string;
  patientId: string;
  recordedAt: string;
  temp: number | null;
  spo2: number | null;
  rr: number | null;
  hr: number | null;
  pain: number | null;
  sysBp: number | null;
  diaBp: number | null;
}

// ── Actions ────────────────────────────────────────────────────────────────

/**
 * Save vital signs for a patient.
 * Inserts into observations table with category='vital-signs'.
 * Each vital sign gets its own LOINC-coded observation row.
 *
 * TODO: implement with Supabase:
 *   - Create observation rows for each vital (temp, SpO2, RR, HR, BP, pain)
 *   - Use LOINC codes: 8310-5 (body temp), 59408-5 (SpO2), 9279-1 (RR),
 *     8867-4 (HR), 8480-6 (SBP), 8462-4 (DBP), 72514-3 (pain score)
 *   - Set effective_at = now(), category = 'vital-signs'
 *   - Insert into observations table with tenant_id from jwt_tenant()
 *   - RLS policy ensures tenant isolation
 */
export async function saveVitals(payload: VitalsPayload): Promise<VitalsObservation> {
  // TODO: replace with real Supabase insert
  console.log("[VITALS] Save vitals stub called:", payload);

  // For now, simulate success after a delay
  await new Promise((r) => setTimeout(r, 1000));

  return {
    id: `obs-${Date.now()}`,
    patientId: payload.patientId,
    recordedAt: new Date().toISOString(),
    temp: payload.temp,
    spo2: payload.spo2,
    rr: payload.rr,
    hr: payload.hr,
    pain: payload.pain,
    sysBp: payload.sysBp,
    diaBp: payload.diaBp,
  };
}

/**
 * Fetch vitals queue for the current nursing staff (patients in their ward).
 *
 * TODO: implement with Supabase:
 *   SELECT p.id, p.full_name, b.bed_number, b.ward_name,
 *          MAX(o.effective_at) AS last_recorded,
 *          EXTRACT(EPOCH FROM (NOW() - MAX(o.effective_at))) / 3600 AS hours_since
 *   FROM patients p
 *   JOIN admissions a ON a.patient_id = p.id AND a.status = 'admitted'
 *   JOIN beds b ON b.id = a.bed_id
 *   LEFT JOIN observations o ON o.patient_id = p.id AND o.category = 'vital-signs'
 *   WHERE p.tenant_id = jwt_tenant()
 *   GROUP BY p.id, p.full_name, b.bed_number, b.ward_name
 *   HAVING EXTRACT(EPOCH FROM (NOW() - MAX(o.effective_at))) / 3600 > 4
 *   OR MAX(o.effective_at) IS NULL
 *   ORDER BY hours_since DESC
 */
export async function fetchVitalsQueue(): Promise<any[]> {
  // TODO: replace with real Supabase query
  console.log("[VITALS] Fetch vitals queue stub called");
  return [];
}

/**
 * Fetch latest vital signs for a specific patient.
 *
 * TODO: implement with Supabase:
 *   SELECT DISTINCT ON (p.id)
 *          o.id, o.patient_id, o.effective_at,
 *          o.value_numeric, o.code
 *   FROM observations o
 *   WHERE o.patient_id = $patientId AND o.category = 'vital-signs'
 *         AND o.tenant_id = jwt_tenant()
 *   ORDER BY o.effective_at DESC
 *   LIMIT 7 (one for each vital type)
 */
export async function fetchPatientVitals(patientId: string): Promise<VitalsObservation | null> {
  // TODO: replace with real Supabase query
  console.log("[VITALS] Fetch patient vitals stub called for:", patientId);
  return null;
}
