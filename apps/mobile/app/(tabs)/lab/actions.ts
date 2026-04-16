"use server";
// Server actions for lab tab.
// All queries and mutations are tenant-scoped — jwt_tenant() enforced by RLS.

import { supabase } from "../../../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export type LabSampleStatus = "pending_collection" | "collected" | "processing" | "resulted";

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

// ── Actions ────────────────────────────────────────────────────────────────

/**
 * Mark a lab sample as collected.
 * Updates lab_samples.collected_at timestamp.
 *
 * TODO: implement with Supabase:
 *   UPDATE lab_samples
 *   SET collected_at = now()
 *   WHERE id = $sampleId AND tenant_id = jwt_tenant()
 *   RETURNING *
 */
export async function markCollected(payload: SampleCollectionPayload): Promise<LabSample> {
  // TODO: replace with real Supabase update
  console.log("[LAB] Mark collected stub called:", payload);

  await new Promise((r) => setTimeout(r, 800));

  return {
    id: payload.sampleId,
    barcode: "LAB-MOCK-001",
    patientId: "p-1",
    patientName: "Patient Name",
    testName: "Test Name",
    ward: "GA-01",
    status: "collected",
    collectedAt: new Date().toISOString(),
  };
}

/**
 * Upload diagnostic results for a lab sample.
 * Inserts into diagnostic_reports table linked to lab_samples.
 *
 * TODO: implement with Supabase:
 *   - INSERT INTO diagnostic_reports (lab_sample_id, code, value, unit, etc.)
 *   - UPDATE lab_samples SET status = 'resulted', resulted_at = now()
 *   - All tenant-scoped by jwt_tenant() via RLS
 */
export async function uploadResult(payload: ResultUploadPayload): Promise<DiagnosticResult[]> {
  // TODO: replace with real Supabase insert
  console.log("[LAB] Upload result stub called:", payload);

  await new Promise((r) => setTimeout(r, 1000));

  return [
    {
      id: `diag-${Date.now()}`,
      sampleId: payload.sampleId,
      testCode: "85025-9",
      value: null,
      unit: null,
      referenceRange: null,
      interpretation: null,
      resultedAt: new Date().toISOString(),
    },
  ];
}

/**
 * Fetch lab samples pending collection for the current technician.
 *
 * TODO: implement with Supabase:
 *   SELECT ls.id, ls.barcode, ls.patient_id, p.full_name,
 *          sr.test_name, a.bed_number, ls.status,
 *          ls.collected_at
 *   FROM lab_samples ls
 *   JOIN service_requests sr ON sr.id = ls.service_request_id
 *   JOIN patients p ON p.id = sr.patient_id
 *   JOIN admissions a ON a.patient_id = p.id AND a.status = 'admitted'
 *   WHERE ls.tenant_id = jwt_tenant()
 *         AND ls.collected_at IS NULL
 *   ORDER BY sr.created_at ASC
 */
export async function fetchLabWorklist(): Promise<LabSample[]> {
  // TODO: replace with real Supabase query
  console.log("[LAB] Fetch lab worklist stub called");
  return [];
}

/**
 * Fetch lab samples with results pending upload (doctor sign-off).
 *
 * TODO: implement with Supabase:
 *   SELECT ls.id, ls.barcode, p.full_name,
 *          sr.test_name, ls.status
 *   FROM lab_samples ls
 *   JOIN service_requests sr ON sr.id = ls.service_request_id
 *   JOIN patients p ON p.id = sr.patient_id
 *   WHERE ls.tenant_id = jwt_tenant()
 *         AND ls.collected_at IS NOT NULL
 *         AND NOT EXISTS (
 *           SELECT 1 FROM diagnostic_reports dr
 *           WHERE dr.lab_sample_id = ls.id
 *         )
 *   ORDER BY ls.created_at ASC
 */
export async function fetchPendingResults(): Promise<LabSample[]> {
  // TODO: replace with real Supabase query
  console.log("[LAB] Fetch pending results stub called");
  return [];
}
