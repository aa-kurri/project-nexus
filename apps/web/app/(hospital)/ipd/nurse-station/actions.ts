"use server";

// ── S-IPD-NURSE: Nurse Station — Server Actions ────────────────────────────────
// All actions are tenant-scoped via RLS (public.jwt_tenant()).
// import { createClient } from "@/utils/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdmittedPatient {
  admissionId: string;
  patientId: string;
  displayName: string;
  bedNumber: string;
  ward: string;
}

export interface VitalsPayload {
  admissionId: string;
  patientId: string;
  encounterId?: string;
  systolicBp: number;
  diastolicBp: number;
  hr: number;
  spo2: number;
  tempC: number;
  pain: number;
}

export interface NursingTask {
  id: string;
  admissionId: string;
  title: string;
  status: "pending" | "in-progress" | "done";
  assignedTo?: string | null;
  dueAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Fetch all currently admitted patients for the patient selector dropdown.
 * TODO: const supabase = await createClient();
 * TODO: query admissions joined with patients and beds where status = 'admitted'
 * TODO: return AdmittedPatient[]
 */
export async function getAdmittedPatients(): Promise<AdmittedPatient[]> {
  // TODO: const supabase = await createClient();
  // TODO: const { data } = await supabase
  //   .from("admissions")
  //   .select(`
  //     id,
  //     patient_id,
  //     patients ( given_name, family_name ),
  //     beds ( bed_number, ward )
  //   `)
  //   .eq("status", "admitted")
  //   .order("admitted_at", { ascending: false });
  // TODO: map data to AdmittedPatient[]
  throw new Error("getAdmittedPatients: not yet implemented");
}

/**
 * Save vitals for a patient — inserts one observation row per LOINC code.
 * LOINC codes:
 *   85354-9  Blood pressure panel (systolic + diastolic, stored as text "120/80")
 *   8867-4   Heart rate (bpm)
 *   59408-5  Oxygen saturation (%)
 *   8310-5   Body temperature (°C)
 *   38208-5  Pain severity (0–10 scale)
 * TODO: const supabase = await createClient();
 * TODO: bulk insert observations rows
 */
export async function saveVitals(payload: VitalsPayload): Promise<void> {
  // TODO: const supabase = await createClient();
  // TODO: const tenantId = ... (derive from JWT or session)
  // TODO: const rows = [
  //   { tenant_id: tenantId, patient_id: payload.patientId, encounter_id: payload.encounterId,
  //     code: "85354-9", display: "Blood pressure panel", value_text: `${payload.systolicBp}/${payload.diastolicBp}`, value_unit: "mmHg" },
  //   { ..., code: "8867-4",  display: "Heart rate",         value_num: payload.hr,         value_unit: "bpm" },
  //   { ..., code: "59408-5", display: "Oxygen saturation",  value_num: payload.spo2,       value_unit: "%" },
  //   { ..., code: "8310-5",  display: "Body temperature",   value_num: payload.tempC,      value_unit: "°C" },
  //   { ..., code: "38208-5", display: "Pain severity",      value_num: payload.pain,       value_unit: "score" },
  // ];
  // TODO: await supabase.from("observations").insert(rows);
  throw new Error("saveVitals: not yet implemented");
}

/**
 * Fetch nursing tasks for a specific admission.
 * TODO: const supabase = await createClient();
 * TODO: query nursing_tasks where admission_id = admissionId, ordered by due_at asc
 */
export async function getNursingTasks(admissionId: string): Promise<NursingTask[]> {
  // TODO: const supabase = await createClient();
  // TODO: const { data } = await supabase
  //   .from("nursing_tasks")
  //   .select("*")
  //   .eq("admission_id", admissionId)
  //   .order("due_at", { ascending: true, nullsFirst: false });
  // TODO: return data as NursingTask[];
  throw new Error("getNursingTasks: not yet implemented");
}

/**
 * Advance a nursing task's status: pending → in-progress → done.
 * TODO: const supabase = await createClient();
 * TODO: update nursing_tasks set status = newStatus, updated_at = now() where id = taskId
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: NursingTask["status"]
): Promise<void> {
  // TODO: const supabase = await createClient();
  // TODO: await supabase
  //   .from("nursing_tasks")
  //   .update({ status: newStatus })
  //   .eq("id", taskId);
  throw new Error("updateTaskStatus: not yet implemented");
}

/**
 * Create a new nursing task for an admission.
 * TODO: const supabase = await createClient();
 * TODO: derive tenant_id from JWT
 * TODO: insert into nursing_tasks
 */
export async function createNursingTask(
  admissionId: string,
  title: string,
  dueAt?: string
): Promise<void> {
  // TODO: const supabase = await createClient();
  // TODO: const tenantId = ...
  // TODO: await supabase.from("nursing_tasks").insert({
  //   tenant_id: tenantId,
  //   admission_id: admissionId,
  //   title,
  //   due_at: dueAt ?? null,
  //   status: "pending",
  // });
  throw new Error("createNursingTask: not yet implemented");
}
