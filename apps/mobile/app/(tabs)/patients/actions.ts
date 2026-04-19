// patients/actions.ts — real Supabase implementation
import { supabase } from "../../../lib/supabase";

export interface PatientSummary {
  id:         string;
  mrn:        string;
  full_name:  string;
  dob:        string | null;
  gender:     string;
  phone:      string;
  primary_dx: string | null;
}

export interface EncounterRow {
  id:           string;
  class:        string;
  status:       string;
  reason:       string | null;
  started_at:   string;
  ended_at:     string | null;
  practitioner: { full_name: string } | null;
}

export interface MedicationRow {
  id:          string;
  drug_name:   string;
  strength:    string | null;
  route:       string | null;
  dosage:      string | null;
  status:      string;
  authored_at: string;
}

export interface AllergyRow {
  id:        string;
  substance: string;
  reaction:  string | null;
  severity:  string | null;
}

export interface PatientChart extends PatientSummary {
  encounters:  EncounterRow[];
  medications: MedicationRow[];
  allergies:   AllergyRow[];
}

/**
 * Fetch full patient chart — last 3 encounters, active meds, all allergies.
 * All filtered by tenant via RLS.
 */
export async function fetchPatientChart(patientId: string): Promise<PatientChart> {
  const [patientRes, encountersRes, medicationsRes, allergiesRes] = await Promise.all([
    supabase
      .from("patients")
      .select("id, mrn, full_name, dob, gender, phone")
      .eq("id", patientId)
      .single(),

    supabase
      .from("encounters")
      .select("id, class, status, reason, started_at, ended_at, practitioner:profiles(full_name)")
      .eq("patient_id", patientId)
      .order("started_at", { ascending: false })
      .limit(3),

    supabase
      .from("medication_requests")
      .select("id, drug_name, strength, route, dosage, status, authored_at")
      .eq("patient_id", patientId)
      .eq("status", "active"),

    supabase
      .from("allergies")
      .select("id, substance, reaction, severity")
      .eq("patient_id", patientId),
  ]);

  if (patientRes.error) throw new Error(patientRes.error.message);
  const p = patientRes.data;

  return {
    id:         p.id,
    mrn:        p.mrn,
    full_name:  p.full_name,
    dob:        p.dob,
    gender:     p.gender,
    phone:      p.phone,
    primary_dx: null,
    encounters: (encountersRes.data ?? []).map((e: any) => ({
      id:           e.id,
      class:        e.class,
      status:       e.status,
      reason:       e.reason,
      started_at:   e.started_at,
      ended_at:     e.ended_at,
      practitioner: e.practitioner ?? null,
    })),
    medications: (medicationsRes.data ?? []).map((m: any) => ({
      id:          m.id,
      drug_name:   m.drug_name,
      strength:    m.strength,
      route:       m.route,
      dosage:      m.dosage,
      status:      m.status,
      authored_at: m.authored_at,
    })),
    allergies: (allergiesRes.data ?? []).map((a: any) => ({
      id:        a.id,
      substance: a.substance,
      reaction:  a.reaction,
      severity:  a.severity,
    })),
  };
}

/**
 * Fetch the doctor's patient list — patients who had an encounter
 * with the current practitioner in the last 90 days.
 */
export async function fetchMyPatients(query?: string): Promise<PatientSummary[]> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return [];

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Get patient IDs from encounters where this doctor was practitioner
  const { data: encounterRows } = await supabase
    .from("encounters")
    .select("patient_id")
    .eq("practitioner_id", userId)
    .gte("started_at", ninetyDaysAgo);

  const patientIds = [...new Set((encounterRows ?? []).map((e: any) => e.patient_id))];
  if (patientIds.length === 0) return [];

  let q = supabase
    .from("patients")
    .select("id, mrn, full_name, dob, gender, phone")
    .in("id", patientIds)
    .order("full_name");

  if (query?.trim()) {
    q = q.ilike("full_name", `%${query.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data ?? []).map((p: any) => ({
    id:         p.id,
    mrn:        p.mrn,
    full_name:  p.full_name,
    dob:        p.dob,
    gender:     p.gender,
    phone:      p.phone,
    primary_dx: null,
  }));
}
