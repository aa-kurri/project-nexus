/**
 * File Adapter — CSV, Excel, JSON
 *
 * The simplest migration path: hospitals export their data into
 * CSV/Excel/JSON files using our templates, and this adapter
 * reads them into canonical records.
 *
 * This is the "zero technical skill" path — hospital admin can
 * do this themselves using Excel.
 */

import fs from "fs/promises";
import path from "path";
import { SourceAdapter, type AdapterConfig, type DiscoveredSchema } from "./base.js";
import {
  emptyDataset,
  type CanonicalDataset,
  type CanonicalPatient,
  type CanonicalEncounter,
  type CanonicalMedicationRequest,
  type CanonicalServiceRequest,
  type CanonicalObservation,
  type CanonicalCondition,
  type CanonicalAllergy,
  type CanonicalStockItem,
  type CanonicalStockBatch,
  type CanonicalBill,
  type CanonicalBillItem,
  type CanonicalBed,
  type CanonicalAdmission,
  type CanonicalUser,
} from "../schema/canonical.js";
import { logger } from "../logger.js";

interface FileAdapterOptions {
  /** Directory containing data files */
  inputDir: string;
  /** Source system name */
  sourceSystem?: string;
  /** Whether to use mapping.json if present */
  useMappingFile?: boolean;
  mappingFile?: string;
}

// ── CSV Parser (minimal, no external dep) ───────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── File → Entity mapping (convention-based) ────────────────────
// File names map to entity types by convention:
//   patients.csv → patient, visits.csv → encounter, etc.

const FILE_ENTITY_MAP: Record<string, string> = {
  patients: "patient",
  patient: "patient",
  visits: "encounter",
  visit: "encounter",
  encounters: "encounter",
  encounter: "encounter",
  appointments: "encounter",
  consultations: "encounter",
  prescriptions: "medication_request",
  prescription: "medication_request",
  medications: "medication_request",
  rx: "medication_request",
  lab_orders: "service_request",
  lab_order: "service_request",
  test_orders: "service_request",
  investigations: "service_request",
  lab_results: "observation",
  lab_result: "observation",
  observations: "observation",
  vitals: "observation",
  diagnoses: "condition",
  diagnosis: "condition",
  conditions: "condition",
  allergies: "allergy",
  allergy: "allergy",
  inventory: "stock_item",
  inventory_items: "stock_item",
  stock_items: "stock_item",
  medicines: "stock_item",
  drugs: "stock_item",
  inventory_batches: "stock_batch",
  stock_batches: "stock_batch",
  batches: "stock_batch",
  invoices: "bill",
  invoice: "bill",
  bills: "bill",
  bill: "bill",
  invoice_items: "bill_item",
  bill_items: "bill_item",
  beds: "bed",
  bed: "bed",
  admissions: "admission",
  admission: "admission",
  ipd: "admission",
  users: "user",
  user: "user",
  staff: "user",
  doctors: "user",
  employees: "user",
};

// ── Smart column heuristics ─────────────────────────────────────
// When hospitals use their own column names, we try to auto-detect
// which canonical field they map to.

const COLUMN_HEURISTICS: Record<string, Record<string, string[]>> = {
  patient: {
    fullName: ["name", "full_name", "patient_name", "fullname", "first_name", "patient"],
    phone: ["phone", "mobile", "contact", "phone_number", "mobile_no", "cell"],
    dob: ["dob", "date_of_birth", "birth_date", "birthdate", "birthday"],
    gender: ["gender", "sex"],
    email: ["email", "email_id", "email_address"],
    addressLine: ["address", "address_line", "street", "addr", "address1"],
    city: ["city", "town", "district"],
    state: ["state", "province", "region"],
    pincode: ["pincode", "zip", "zipcode", "postal_code", "pin"],
    mrn: ["mrn", "medical_record_number", "uhid", "patient_id", "reg_no", "registration_no"],
    abhaId: ["abha_id", "abha", "health_id", "abdm_id"],
    bloodGroup: ["blood_group", "bloodgroup", "blood_type"],
    emergencyContact: ["emergency_contact", "kin_phone", "emergency_phone"],
  },
  encounter: {
    patientSourceId: ["patient_id", "patient", "pid", "mrn", "uhid"],
    practitionerSourceId: ["doctor_id", "doctor", "practitioner", "provider_id", "consultant"],
    class: ["visit_type", "type", "class", "encounter_class", "dept", "department"],
    reason: ["chief_complaint", "reason", "complaint", "cc", "presenting_complaint"],
    startedAt: ["visit_date", "date", "started_at", "start_date", "encounter_date", "admission_date"],
    endedAt: ["end_date", "ended_at", "discharge_date"],
    status: ["status", "visit_status"],
  },
  medication_request: {
    patientSourceId: ["patient_id", "patient", "pid", "mrn"],
    encounterSourceId: ["visit_id", "encounter_id", "consultation_id"],
    prescriberSourceId: ["doctor_id", "prescriber", "provider_id"],
    drugName: ["drug_name", "medicine", "drug", "medication", "med_name", "item_name"],
    strength: ["strength", "dose_strength"],
    route: ["route", "admin_route"],
    dosage: ["dosage", "dose", "frequency", "sig", "directions"],
    authoredAt: ["prescribed_at", "date", "created_at", "rx_date"],
    status: ["status"],
  },
  service_request: {
    patientSourceId: ["patient_id", "patient", "pid"],
    encounterSourceId: ["visit_id", "encounter_id"],
    requesterSourceId: ["doctor_id", "ordered_by", "requester"],
    code: ["test_code", "code", "investigation_code", "test_id"],
    display: ["test_name", "name", "display", "investigation", "description"],
    category: ["category", "type", "dept"],
    requestedAt: ["ordered_at", "date", "created_at", "request_date"],
    status: ["status"],
  },
  observation: {
    patientSourceId: ["patient_id", "patient"],
    encounterSourceId: ["visit_id", "encounter_id"],
    code: ["code", "parameter_code", "loinc"],
    display: ["parameter", "name", "display", "test_parameter", "analyte"],
    valueNum: ["value", "result", "numeric_value", "result_value"],
    valueUnit: ["unit", "units", "uom"],
    valueText: ["text_value", "result_text", "interpretation"],
    refLow: ["ref_low", "normal_low", "low", "min"],
    refHigh: ["ref_high", "normal_high", "high", "max"],
    flag: ["flag", "abnormal", "status_flag"],
    effectiveAt: ["resulted_at", "date", "effective_date", "result_date"],
  },
  condition: {
    patientSourceId: ["patient_id", "patient"],
    encounterSourceId: ["visit_id", "encounter_id"],
    code: ["icd_code", "code", "diagnosis_code", "icd10"],
    display: ["diagnosis", "diagnosis_text", "name", "condition", "description"],
    onsetAt: ["onset_date", "diagnosed_date", "date"],
    resolvedAt: ["resolved_date", "end_date"],
  },
  stock_item: {
    name: ["name", "item_name", "drug_name", "medicine_name", "product"],
    generic: ["generic", "generic_name", "salt", "composition"],
    form: ["form", "dosage_form", "type"],
    strength: ["strength", "dose"],
    hsnSac: ["hsn", "hsn_code", "hsn_sac", "sac"],
    gstPct: ["gst", "gst_percent", "gst_pct", "tax_rate"],
    reorderLevel: ["rol", "reorder_level", "min_stock", "reorder"],
  },
  bill: {
    patientSourceId: ["patient_id", "patient"],
    encounterSourceId: ["visit_id", "encounter_id"],
    number: ["invoice_number", "bill_number", "bill_no", "number", "receipt_no"],
    subtotal: ["subtotal", "sub_total", "amount", "net_amount"],
    taxTotal: ["tax", "tax_total", "gst_amount", "tax_amount"],
    grandTotal: ["total", "grand_total", "net_payable", "bill_amount", "gross"],
    finalizedAt: ["finalized_at", "date", "bill_date", "invoice_date"],
    status: ["status", "payment_status"],
  },
  user: {
    fullName: ["name", "full_name", "doctor_name", "staff_name", "employee_name"],
    email: ["email", "email_id"],
    phone: ["phone", "mobile", "contact"],
    role: ["role", "designation", "user_type", "staff_type"],
    department: ["department", "dept", "speciality", "specialty"],
    isActive: ["is_active", "active", "status"],
  },
};

export class FileAdapter extends SourceAdapter {
  private opts: FileAdapterOptions;

  constructor(config: AdapterConfig) {
    super(config);
    this.opts = config.options as FileAdapterOptions;
  }

  get displayName(): string {
    return `File [${this.opts.inputDir}]`;
  }

  async testConnection(): Promise<boolean> {
    try {
      await fs.access(this.opts.inputDir);
      const files = await fs.readdir(this.opts.inputDir);
      logger.success(`Input directory accessible: ${files.length} files found`);
      return true;
    } catch {
      logger.error(`Cannot access input directory: ${this.opts.inputDir}`);
      return false;
    }
  }

  async discoverSchema(): Promise<DiscoveredSchema> {
    const files = await fs.readdir(this.opts.inputDir);
    const result: DiscoveredSchema = { tables: [] };

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (![".csv", ".json"].includes(ext)) continue;

      const filePath = path.join(this.opts.inputDir, file);
      const content = await fs.readFile(filePath, "utf-8");

      let rows: Record<string, unknown>[] = [];
      if (ext === ".csv") {
        rows = parseCSV(content);
      } else if (ext === ".json") {
        const parsed = JSON.parse(content);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      }

      if (rows.length === 0) continue;
      const sample = rows[0];

      result.tables.push({
        name: path.basename(file, ext),
        rowCount: rows.length,
        columns: Object.entries(sample).map(([name, value]) => ({
          name,
          type: typeof value,
          nullable: true,
          sample: value,
        })),
      });
    }

    return result;
  }

  async extract(): Promise<CanonicalDataset> {
    logger.separator(`Extracting from ${this.displayName}`);

    const sourceSystem = this.opts.sourceSystem || this.config.sourceSystem || "file_import";
    const dataset = emptyDataset(sourceSystem);

    const files = await fs.readdir(this.opts.inputDir);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (![".csv", ".json"].includes(ext)) continue;

      const baseName = path.basename(file, ext).toLowerCase();
      const entityType = FILE_ENTITY_MAP[baseName];

      if (!entityType) {
        logger.warn(`Skipping "${file}" — no known entity mapping. ` +
          `Rename to one of: ${Object.keys(FILE_ENTITY_MAP).join(", ")}`);
        continue;
      }

      logger.info(`Processing: ${file} → ${entityType}`);

      const filePath = path.join(this.opts.inputDir, file);
      const content = await fs.readFile(filePath, "utf-8");

      let rows: Record<string, unknown>[] = [];
      if (ext === ".csv") {
        rows = parseCSV(content);
      } else if (ext === ".json") {
        const parsed = JSON.parse(content);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      }

      if (rows.length === 0) {
        logger.warn(`  Empty file: ${file}`);
        continue;
      }

      // Auto-detect column mappings using heuristics
      const heuristics = COLUMN_HEURISTICS[entityType] || {};
      const sourceColumns = Object.keys(rows[0]);

      const canonicalRecords = rows.map((row, idx) => {
        const record: Record<string, unknown> = {
          _entity: entityType,
          _sourceId: String(row.id || row.ID || row.Id || idx + 1),
          _sourceSystem: sourceSystem,
        };

        // Try to map each canonical field
        for (const [canonicalField, possibleNames] of Object.entries(heuristics)) {
          const matchedColumn = sourceColumns.find((col) =>
            possibleNames.includes(col.toLowerCase().trim())
          );
          if (matchedColumn) {
            record[canonicalField] = row[matchedColumn];
          }
        }

        // Also pass through any unmapped columns as extra metadata
        for (const col of sourceColumns) {
          const lowerCol = col.toLowerCase().trim();
          const alreadyMapped = Object.values(heuristics).some((names) =>
            names.includes(lowerCol)
          );
          if (!alreadyMapped && !record[col]) {
            record[col] = row[col];
          }
        }

        return record;
      });

      // Route to correct dataset array
      this.routeToDataset(dataset, entityType, canonicalRecords);
      logger.success(`  ${file}: ${canonicalRecords.length.toLocaleString()} records`);
    }

    dataset.totalRecords = this.countDataset(dataset);
    dataset.extractedAt = new Date().toISOString();

    logger.success(`Total records extracted: ${dataset.totalRecords.toLocaleString()}`);
    return dataset;
  }

  private routeToDataset(dataset: CanonicalDataset, entity: string, records: unknown[]) {
    const map: Record<string, keyof CanonicalDataset> = {
      patient: "patients",
      encounter: "encounters",
      medication_request: "medicationRequests",
      service_request: "serviceRequests",
      observation: "observations",
      condition: "conditions",
      allergy: "allergies",
      diagnostic_report: "diagnosticReports",
      lab_sample: "labSamples",
      stock_item: "stockItems",
      stock_batch: "stockBatches",
      bill: "bills",
      bill_item: "billItems",
      bed: "beds",
      admission: "admissions",
      user: "users",
    };
    const key = map[entity];
    if (key && Array.isArray(dataset[key])) {
      (dataset[key] as unknown[]).push(...records);
    }
  }

  private countDataset(d: CanonicalDataset): number {
    return (
      d.patients.length + d.encounters.length + d.medicationRequests.length +
      d.serviceRequests.length + d.observations.length + d.conditions.length +
      d.allergies.length + d.diagnosticReports.length + d.labSamples.length +
      d.stockItems.length + d.stockBatches.length + d.bills.length +
      d.billItems.length + d.beds.length + d.admissions.length + d.users.length
    );
  }

  async close(): Promise<void> {
    // No connections to close for file adapter
  }
}
