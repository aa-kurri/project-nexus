"use server";

// ── S-IPD-2: IP Admissions Dashboard — Server Actions ─────────────────────────
// All actions are tenant-scoped via RLS (public.jwt_tenant()).
// Replace TODO stubs with real Supabase server-client calls when ready.

// import { createClient } from "@/utils/supabase/server"; // add server client when available

export interface AdmissionKpi {
  admissionsToday: number;
  dischargesToday: number;
  totalBeds: number;
  occupiedBeds: number;
  avgLosHours: number;
}

/**
 * Fetch aggregated KPI data for the IPD dashboard.
 * TODO: implement aggregation queries against admissions + beds tables.
 */
export async function getAdmissionKpis(): Promise<AdmissionKpi> {
  // TODO: init server supabase client
  // TODO: query admissions count for today via .gte("admitted_at", todayISO)
  // TODO: query discharges count for today via .gte("discharged_at", todayISO)
  // TODO: query beds aggregate for total / occupied counts
  // TODO: compute avgLosHours via public.ipd_avg_los(tenantId)
  throw new Error("getAdmissionKpis: not yet implemented");
}

export interface WardSummary {
  ward: string;
  total: number;
  occupied: number;
  vacant: number;
  cleaning: number;
}

/**
 * Return per-ward bed summary for the breakdown table.
 * TODO: implement group-by-ward query on the beds table.
 */
export async function getWardSummaries(): Promise<WardSummary[]> {
  // TODO: const supabase = await createClient();
  // TODO: select ward, status from beds (tenant isolated via RLS)
  // TODO: group and aggregate in application layer or via DB function
  throw new Error("getWardSummaries: not yet implemented");
}

/**
 * Admit a patient to a specific bed.
 * TODO: implement transactional admission insert + bed status update.
 *
 * @param patientId  - UUID of the patient (references public.patients)
 * @param bedId      - UUID of the target bed (references public.beds)
 * @param encounterId - optional encounter to link
 */
export async function admitPatient(
  patientId: string,
  bedId: string,
  encounterId?: string
): Promise<{ admissionId: string }> {
  // TODO: const supabase = await createClient();
  // TODO: insert into admissions (tenant_id, patient_id, bed_id, encounter_id, status)
  // TODO: update beds set status = 'occupied' where id = bedId
  // TODO: insert audit_log entry
  throw new Error("admitPatient: not yet implemented");
}

/**
 * Discharge a patient from their current admission.
 * TODO: implement discharge update + bed status reset.
 *
 * @param admissionId - UUID of the admission row to close
 */
export async function dischargePatient(
  admissionId: string
): Promise<void> {
  // TODO: const supabase = await createClient();
  // TODO: update admissions set status = 'discharged', discharged_at = now() where id = admissionId
  // TODO: update beds set status = 'cleaning' (or 'vacant') for the linked bed
  // TODO: insert audit_log entry
  throw new Error("dischargePatient: not yet implemented");
}
