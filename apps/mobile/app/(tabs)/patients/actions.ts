"use server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatientSummary {
  id: string;
  mrn: string;
  full_name: string;
  dob: string | null;
  gender: string;
  phone: string;
  primary_dx: string | null;
}

export interface EncounterRow {
  id: string;
  class: string;
  status: string;
  reason: string | null;
  started_at: string;
  ended_at: string | null;
  practitioner: { full_name: string } | null;
}

export interface MedicationRow {
  id: string;
  drug_name: string;
  strength: string | null;
  route: string | null;
  dosage: string | null;
  status: string;
  authored_at: string;
}

export interface AllergyRow {
  id: string;
  substance: string;
  reaction: string | null;
  severity: string | null;
}

export interface PatientChart extends PatientSummary {
  encounters: EncounterRow[];
  medications: MedicationRow[];
  allergies: AllergyRow[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Fetch full patient chart for the doctor view.
 * Returns last 3 encounters, active medications, and all allergies.
 *
 * TODO: implement with Supabase:
 *   const [patient, encounters, medications, allergies] = await Promise.all([
 *     supabase.from("patients")
 *       .select("id, mrn, full_name, dob, gender, phone")
 *       .eq("id", patientId).eq("tenant_id", jwtTenant()).single(),
 *
 *     supabase.from("encounters")
 *       .select("id, class, status, reason, started_at, ended_at, practitioner:profiles(full_name)")
 *       .eq("patient_id", patientId).eq("tenant_id", jwtTenant())
 *       .order("started_at", { ascending: false }).limit(3),
 *
 *     supabase.from("medication_requests")
 *       .select("id, drug_name, strength, route, dosage, status, authored_at")
 *       .eq("patient_id", patientId).eq("tenant_id", jwtTenant())
 *       .eq("status", "active"),
 *
 *     supabase.from("allergies")
 *       .select("id, substance, reaction, severity")
 *       .eq("patient_id", patientId).eq("tenant_id", jwtTenant()),
 *   ]);
 */
export async function fetchPatientChart(patientId: string): Promise<PatientChart> {
  // TODO: replace with real Supabase queries
  throw new Error("fetchPatientChart: not yet implemented");
}

/**
 * Fetch the doctor's patient list (patients who have had an encounter
 * with auth.uid() practitioner_id in the last 90 days).
 *
 * TODO: implement with Supabase:
 *   supabase.from("patients")
 *     .select("id, mrn, full_name, dob, gender, phone, conditions(display)")
 *     .eq("tenant_id", jwtTenant())
 *     .in("id",
 *       supabase.from("encounters")
 *         .select("patient_id")
 *         .eq("practitioner_id", auth.uid())
 *         .gte("started_at", ninetyDaysAgo)
 *     )
 *     .order("full_name")
 */
export async function fetchMyPatients(query?: string): Promise<PatientSummary[]> {
  // TODO: replace with real Supabase query
  throw new Error("fetchMyPatients: not yet implemented");
}
