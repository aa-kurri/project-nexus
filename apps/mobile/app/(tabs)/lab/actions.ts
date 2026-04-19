// lab/actions.ts — real Supabase implementation
import { supabase } from "../../../lib/supabase";

export type LabSampleStatus = "planned" | "collected" | "received" | "in-progress" | "resulted" | "rejected";

export interface LabSample {
  id: string;
  barcode: string;
  patientId: string;
  patientName: string;
  testName: string;
  ward: string;
  status: LabSampleStatus;
  collectedAt: string | null;
}

export interface DiagnosticResult {
  id: string;
  sampleId: string;
  testCode: string;
  value: string | number | null;
  unit: string | null;
  referenceRange: string | null;
  interpretation: string | null;
  resultedAt: string;
}

export interface SampleCollectionPayload {
  sampleId: string;
}

export interface ResultUploadPayload {
  sampleId: string;
  results?: Array<{
    testCode: string;
    value: string | number | null;
    unit?: string;
    interpretation?: string;
  }>;
}

/** Fetch lab samples pending collection (collected_at IS NULL). */
export async function fetchLabWorklist(): Promise<LabSample[]> {
  const { data, error } = await supabase
    .from("lab_samples")
    .select(`
      id, barcode, patient_id, status, collected_at,
      patients ( full_name ),
      service_requests ( display )
    `)
    .is("collected_at", null)
    .not("status", "eq", "rejected")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id:           r.id,
    barcode:      r.barcode,
    patientId:    r.patient_id,
    patientName:  r.patients?.full_name ?? "Unknown",
    testName:     r.service_requests?.display ?? "Unknown",
    ward:         "—",
    status:       r.status as LabSampleStatus,
    collectedAt:  r.collected_at,
  }));
}

/** Fetch samples with results pending upload (collected, not yet resulted). */
export async function fetchPendingResults(): Promise<LabSample[]> {
  const { data, error } = await supabase
    .from("lab_samples")
    .select(`
      id, barcode, patient_id, status, collected_at,
      patients ( full_name ),
      service_requests ( display )
    `)
    .not("collected_at", "is", null)
    .not("status", "in", '("resulted","rejected")')
    .order("collected_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id:          r.id,
    barcode:     r.barcode,
    patientId:   r.patient_id,
    patientName: r.patients?.full_name ?? "Unknown",
    testName:    r.service_requests?.display ?? "Unknown",
    ward:        "—",
    status:      r.status as LabSampleStatus,
    collectedAt: r.collected_at,
  }));
}

/** Mark a lab sample as collected — stamps collected_at and moves status. */
export async function markCollected(payload: SampleCollectionPayload): Promise<LabSample> {
  const { data, error } = await supabase
    .from("lab_samples")
    .update({
      collected_at: new Date().toISOString(),
      status:       "collected",
    })
    .eq("id", payload.sampleId)
    .select(`
      id, barcode, patient_id, status, collected_at,
      patients ( full_name ),
      service_requests ( display )
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    id:          data.id,
    barcode:     data.barcode,
    patientId:   data.patient_id,
    patientName: (data as any).patients?.full_name ?? "Unknown",
    testName:    (data as any).service_requests?.display ?? "Unknown",
    ward:        "—",
    status:      data.status as LabSampleStatus,
    collectedAt: data.collected_at,
  };
}

/**
 * Upload diagnostic results for a sample.
 * Marks the sample as "resulted" and inserts diagnostic_report rows.
 */
export async function uploadResult(payload: ResultUploadPayload): Promise<DiagnosticResult[]> {
  // Fetch the sample to get patient_id + service_request_id
  const { data: sample, error: sErr } = await supabase
    .from("lab_samples")
    .select("patient_id, service_request_id")
    .eq("id", payload.sampleId)
    .single();

  if (sErr || !sample) throw new Error(sErr?.message ?? "Sample not found");

  // Update sample status
  await supabase
    .from("lab_samples")
    .update({ status: "resulted" })
    .eq("id", payload.sampleId);

  // Insert one diagnostic_report per result line
  const results = payload.results?.length
    ? payload.results
    : [{ testCode: "85025-9", value: null }]; // placeholder CBC panel code

  const rows = results.map((r) => ({
    patient_id:         sample.patient_id,
    service_request_id: sample.service_request_id,
    code:               r.testCode,
    display:            r.testCode,
    status:             "final",
    issued_at:          new Date().toISOString(),
  }));

  const { data: inserted, error: iErr } = await supabase
    .from("diagnostic_reports")
    .insert(rows)
    .select("id, code, issued_at");

  if (iErr) throw new Error(iErr.message);

  return (inserted ?? []).map((r: any) => ({
    id:             r.id,
    sampleId:       payload.sampleId,
    testCode:       r.code,
    value:          null,
    unit:           null,
    referenceRange: null,
    interpretation: null,
    resultedAt:     r.issued_at,
  }));
}
