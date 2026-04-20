/**
 * Universal Migration Framework — Canonical Schema
 *
 * This is the **intermediate representation** (IR) that ALL source
 * adapters produce. It is source-agnostic and aligned with FHIR R4.
 *
 * Flow: Any Source → Adapter → CanonicalRecord[] → Validator → Loader → Supabase
 *
 * A hospital can come from Vaidyo, Practo, Bahmni, OpenMRS, a custom
 * Java app, or even paper records typed into Excel — the canonical schema
 * is the same.
 */

// ── Entity Types ─────────────────────────────────────────────────

export type CanonicalEntityType =
  | "patient"
  | "encounter"
  | "medication_request"
  | "service_request"
  | "observation"
  | "condition"
  | "allergy"
  | "diagnostic_report"
  | "lab_sample"
  | "stock_item"
  | "stock_batch"
  | "stock_movement"
  | "bill"
  | "bill_item"
  | "bed"
  | "admission"
  | "user";

// ── Canonical Records ───────────────────────────────────────────
// Each type below represents the universal shape. Source adapters
// map their proprietary schemas into these shapes.

export interface CanonicalPatient {
  _entity: "patient";
  _sourceId: string;            // Original ID from the source system
  _sourceSystem: string;        // e.g. "vaidyo", "practo", "bahmni", "excel"
  mrn?: string;                 // Medical Record Number (source system's)
  abhaId?: string;              // ABDM Health ID (14-digit) — if available
  abhaAddress?: string;
  phone: string;                // Required — will be normalized to E.164
  fullName: string;
  dob?: string;                 // ISO date: YYYY-MM-DD
  gender?: "male" | "female" | "other" | "unknown";
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  [key: string]: unknown;       // Catch-all for extra source fields → metadata
}

export interface CanonicalEncounter {
  _entity: "encounter";
  _sourceId: string;
  _sourceSystem: string;
  patientSourceId: string;      // FK → patient._sourceId
  practitionerSourceId?: string; // FK → user._sourceId
  class: "opd" | "ipd" | "emergency" | "tele" | "home";
  status?: "planned" | "arrived" | "in-progress" | "finished" | "cancelled";
  reason?: string;
  startedAt: string;            // ISO datetime
  endedAt?: string;
  [key: string]: unknown;
}

export interface CanonicalMedicationRequest {
  _entity: "medication_request";
  _sourceId: string;
  _sourceSystem: string;
  patientSourceId: string;
  encounterSourceId?: string;
  prescriberSourceId?: string;
  drugName: string;
  strength?: string;
  route?: string;
  dosage?: string;              // e.g. "1 tab BID for 5 days"
  status?: "draft" | "active" | "completed" | "stopped" | "cancelled";
  authoredAt: string;
  [key: string]: unknown;
}

export interface CanonicalServiceRequest {
  _entity: "service_request";
  _sourceId: string;
  _sourceSystem: string;
  patientSourceId: string;
  encounterSourceId?: string;
  requesterSourceId?: string;
  code: string;                 // Test code: "CBC", "LFT", etc.
  display: string;              // Human-readable name
  category?: string;            // "lab" | "radiology" | "procedure"
  status?: "draft" | "active" | "completed" | "revoked";
  requestedAt: string;
  [key: string]: unknown;
}

export interface CanonicalObservation {
  _entity: "observation";
  _sourceId: string;
  _sourceSystem: string;
  patientSourceId: string;
  encounterSourceId?: string;
  code: string;                 // LOINC / SNOMED / local code
  codeSystem?: string;          // e.g. "http://loinc.org"
  display: string;              // e.g. "Hemoglobin"
  valueNum?: number;
  valueUnit?: string;
  valueText?: string;
  refLow?: number;
  refHigh?: number;
  flag?: "normal" | "low" | "high" | "critical";
  status?: "registered" | "preliminary" | "final" | "amended" | "cancelled";
  effectiveAt: string;
  [key: string]: unknown;
}

export interface CanonicalCondition {
  _entity: "condition";
  _sourceId: string;
  _sourceSystem: string;
  patientSourceId: string;
  encounterSourceId?: string;
  code: string;                 // ICD-10 or free text
  display: string;
  onsetAt?: string;
  resolvedAt?: string;
  [key: string]: unknown;
}

export interface CanonicalAllergy {
  _entity: "allergy";
  _sourceId: string;
  _sourceSystem: string;
  patientSourceId: string;
  substance: string;
  reaction?: string;
  severity?: string;
  [key: string]: unknown;
}

export interface CanonicalDiagnosticReport {
  _entity: "diagnostic_report";
  _sourceId: string;
  _sourceSystem: string;
  patientSourceId: string;
  encounterSourceId?: string;
  serviceRequestSourceId?: string;
  code: string;
  display: string;
  status?: "registered" | "partial" | "final" | "amended";
  issuedAt?: string;
  storagePath?: string;         // Path to PDF/image if available
  [key: string]: unknown;
}

export interface CanonicalLabSample {
  _entity: "lab_sample";
  _sourceId: string;
  _sourceSystem: string;
  serviceRequestSourceId: string;
  patientSourceId: string;
  barcode: string;
  container?: string;
  status?: "planned" | "collected" | "received" | "in-progress" | "resulted" | "rejected";
  collectedAt?: string;
  receivedAt?: string;
  [key: string]: unknown;
}

export interface CanonicalStockItem {
  _entity: "stock_item";
  _sourceId: string;
  _sourceSystem: string;
  name: string;
  generic?: string;
  form?: string;               // tab | cap | syp | inj
  strength?: string;
  hsnSac?: string;
  gstPct?: number;
  reorderLevel?: number;
  preferredSupplier?: string;
  [key: string]: unknown;
}

export interface CanonicalStockBatch {
  _entity: "stock_batch";
  _sourceId: string;
  _sourceSystem: string;
  itemSourceId: string;
  storeName: string;            // Will be resolved to store_id
  batchNo: string;
  expiry: string;               // ISO date
  mrp?: number;
  quantity: number;
  [key: string]: unknown;
}

export interface CanonicalBill {
  _entity: "bill";
  _sourceId: string;
  _sourceSystem: string;
  patientSourceId: string;
  encounterSourceId?: string;
  number: string;
  status?: "draft" | "finalized" | "partially-paid" | "paid" | "void";
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  finalizedAt?: string;
  [key: string]: unknown;
}

export interface CanonicalBillItem {
  _entity: "bill_item";
  _sourceId: string;
  _sourceSystem: string;
  billSourceId: string;
  source: string;               // "opd" | "ipd" | "lab" | "pharmacy"
  description: string;
  qty: number;
  unitPrice: number;
  gstPct?: number;
  lineTotal: number;
  [key: string]: unknown;
}

export interface CanonicalBed {
  _entity: "bed";
  _sourceId: string;
  _sourceSystem: string;
  ward: string;
  label: string;
  status?: "vacant" | "occupied" | "cleaning" | "blocked";
  [key: string]: unknown;
}

export interface CanonicalAdmission {
  _entity: "admission";
  _sourceId: string;
  _sourceSystem: string;
  patientSourceId: string;
  bedSourceId?: string;
  encounterSourceId?: string;
  status?: "pending" | "admitted" | "discharged" | "transferred";
  admittedAt: string;
  dischargedAt?: string;
  [key: string]: unknown;
}

export interface CanonicalUser {
  _entity: "user";
  _sourceId: string;
  _sourceSystem: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;                 // admin | doctor | nurse | lab_tech | pharmacist | billing | front_desk
  department?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

// ── Union Type ──────────────────────────────────────────────────

export type CanonicalRecord =
  | CanonicalPatient
  | CanonicalEncounter
  | CanonicalMedicationRequest
  | CanonicalServiceRequest
  | CanonicalObservation
  | CanonicalCondition
  | CanonicalAllergy
  | CanonicalDiagnosticReport
  | CanonicalLabSample
  | CanonicalStockItem
  | CanonicalStockBatch
  | CanonicalBill
  | CanonicalBillItem
  | CanonicalBed
  | CanonicalAdmission
  | CanonicalUser;

// ── Dataset: all canonical records grouped by entity ────────────

export interface CanonicalDataset {
  patients: CanonicalPatient[];
  encounters: CanonicalEncounter[];
  medicationRequests: CanonicalMedicationRequest[];
  serviceRequests: CanonicalServiceRequest[];
  observations: CanonicalObservation[];
  conditions: CanonicalCondition[];
  allergies: CanonicalAllergy[];
  diagnosticReports: CanonicalDiagnosticReport[];
  labSamples: CanonicalLabSample[];
  stockItems: CanonicalStockItem[];
  stockBatches: CanonicalStockBatch[];
  bills: CanonicalBill[];
  billItems: CanonicalBillItem[];
  beds: CanonicalBed[];
  admissions: CanonicalAdmission[];
  users: CanonicalUser[];
  /** Source system identifier */
  sourceSystem: string;
  /** Metadata about the extraction */
  extractedAt: string;
  /** Total record count across all entities */
  totalRecords: number;
}

/**
 * Create an empty dataset.
 */
export function emptyDataset(sourceSystem: string): CanonicalDataset {
  return {
    patients: [],
    encounters: [],
    medicationRequests: [],
    serviceRequests: [],
    observations: [],
    conditions: [],
    allergies: [],
    diagnosticReports: [],
    labSamples: [],
    stockItems: [],
    stockBatches: [],
    bills: [],
    billItems: [],
    beds: [],
    admissions: [],
    users: [],
    sourceSystem,
    extractedAt: new Date().toISOString(),
    totalRecords: 0,
  };
}
