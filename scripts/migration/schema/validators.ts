/**
 * Universal Migration Framework — Zod Validators
 *
 * Validates canonical records before they hit Supabase.
 * Catches data quality issues early and produces actionable error messages.
 */

import { z } from "zod";

// ── Shared ────────────────────────────────────────────────────

const sourceMetaSchema = z.object({
  _sourceId: z.string().min(1, "Source ID is required"),
  _sourceSystem: z.string().min(1, "Source system is required"),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected ISO date: YYYY-MM-DD").optional();
const isoDatetime = z.string().min(1, "Datetime is required");
const optionalDatetime = z.string().optional();
const phone = z.string().min(1, "Phone is required");

// ── Entity Validators ───────────────────────────────────────────

export const PatientSchema = sourceMetaSchema.extend({
  _entity: z.literal("patient"),
  phone,
  fullName: z.string().min(1, "Name is required"),
  dob: isoDate,
  gender: z.enum(["male", "female", "other", "unknown"]).default("unknown"),
  mrn: z.string().optional(),
  abhaId: z.string().optional(),
  abhaAddress: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const EncounterSchema = sourceMetaSchema.extend({
  _entity: z.literal("encounter"),
  patientSourceId: z.string().min(1),
  practitionerSourceId: z.string().optional(),
  class: z.enum(["opd", "ipd", "emergency", "tele", "home"]),
  status: z.enum(["planned", "arrived", "in-progress", "finished", "cancelled"]).default("finished"),
  reason: z.string().optional(),
  startedAt: isoDatetime,
  endedAt: optionalDatetime,
});

export const MedicationRequestSchema = sourceMetaSchema.extend({
  _entity: z.literal("medication_request"),
  patientSourceId: z.string().min(1),
  encounterSourceId: z.string().optional(),
  prescriberSourceId: z.string().optional(),
  drugName: z.string().min(1, "Drug name is required"),
  strength: z.string().optional(),
  route: z.string().optional(),
  dosage: z.string().optional(),
  status: z.enum(["draft", "active", "completed", "stopped", "cancelled"]).default("completed"),
  authoredAt: isoDatetime,
});

export const ServiceRequestSchema = sourceMetaSchema.extend({
  _entity: z.literal("service_request"),
  patientSourceId: z.string().min(1),
  encounterSourceId: z.string().optional(),
  requesterSourceId: z.string().optional(),
  code: z.string().min(1),
  display: z.string().min(1),
  category: z.string().default("lab"),
  status: z.enum(["draft", "active", "completed", "revoked"]).default("completed"),
  requestedAt: isoDatetime,
});

export const ObservationSchema = sourceMetaSchema.extend({
  _entity: z.literal("observation"),
  patientSourceId: z.string().min(1),
  encounterSourceId: z.string().optional(),
  code: z.string().min(1),
  codeSystem: z.string().default("http://loinc.org"),
  display: z.string().min(1),
  valueNum: z.number().optional(),
  valueUnit: z.string().optional(),
  valueText: z.string().optional(),
  refLow: z.number().optional(),
  refHigh: z.number().optional(),
  flag: z.enum(["normal", "low", "high", "critical"]).optional(),
  status: z.enum(["registered", "preliminary", "final", "amended", "cancelled"]).default("final"),
  effectiveAt: isoDatetime,
});

export const ConditionSchema = sourceMetaSchema.extend({
  _entity: z.literal("condition"),
  patientSourceId: z.string().min(1),
  encounterSourceId: z.string().optional(),
  code: z.string().min(1),
  display: z.string().min(1),
  onsetAt: optionalDatetime,
  resolvedAt: optionalDatetime,
});

export const AllergySchema = sourceMetaSchema.extend({
  _entity: z.literal("allergy"),
  patientSourceId: z.string().min(1),
  substance: z.string().min(1),
  reaction: z.string().optional(),
  severity: z.string().optional(),
});

export const StockItemSchema = sourceMetaSchema.extend({
  _entity: z.literal("stock_item"),
  name: z.string().min(1),
  generic: z.string().optional(),
  form: z.string().optional(),
  strength: z.string().optional(),
  hsnSac: z.string().optional(),
  gstPct: z.number().min(0).max(100).default(12),
  reorderLevel: z.number().min(0).default(0),
  preferredSupplier: z.string().optional(),
});

export const StockBatchSchema = sourceMetaSchema.extend({
  _entity: z.literal("stock_batch"),
  itemSourceId: z.string().min(1),
  storeName: z.string().min(1),
  batchNo: z.string().min(1),
  expiry: z.string().min(1),
  mrp: z.number().optional(),
  quantity: z.number().min(0),
});

export const BillSchema = sourceMetaSchema.extend({
  _entity: z.literal("bill"),
  patientSourceId: z.string().min(1),
  encounterSourceId: z.string().optional(),
  number: z.string().min(1),
  status: z.enum(["draft", "finalized", "partially-paid", "paid", "void"]).default("paid"),
  subtotal: z.number(),
  taxTotal: z.number(),
  grandTotal: z.number(),
  finalizedAt: optionalDatetime,
});

export const BillItemSchema = sourceMetaSchema.extend({
  _entity: z.literal("bill_item"),
  billSourceId: z.string().min(1),
  source: z.string().min(1),
  description: z.string().min(1),
  qty: z.number().min(0),
  unitPrice: z.number(),
  gstPct: z.number().min(0).max(100).default(0),
  lineTotal: z.number(),
});

export const BedSchema = sourceMetaSchema.extend({
  _entity: z.literal("bed"),
  ward: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["vacant", "occupied", "cleaning", "blocked"]).default("vacant"),
});

export const AdmissionSchema = sourceMetaSchema.extend({
  _entity: z.literal("admission"),
  patientSourceId: z.string().min(1),
  bedSourceId: z.string().optional(),
  encounterSourceId: z.string().optional(),
  status: z.enum(["pending", "admitted", "discharged", "transferred"]).default("discharged"),
  admittedAt: isoDatetime,
  dischargedAt: optionalDatetime,
});

export const UserSchema = sourceMetaSchema.extend({
  _entity: z.literal("user"),
  fullName: z.string().min(1),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  role: z.string().min(1),
  department: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ── Validator Map ────────────────────────────────────────────────

export const VALIDATORS: Record<string, z.ZodType> = {
  patient: PatientSchema,
  encounter: EncounterSchema,
  medication_request: MedicationRequestSchema,
  service_request: ServiceRequestSchema,
  observation: ObservationSchema,
  condition: ConditionSchema,
  allergy: AllergySchema,
  stock_item: StockItemSchema,
  stock_batch: StockBatchSchema,
  bill: BillSchema,
  bill_item: BillItemSchema,
  bed: BedSchema,
  admission: AdmissionSchema,
  user: UserSchema,
};

/**
 * Validate a single canonical record. Returns { success, data, errors }.
 */
export function validateRecord(record: { _entity: string; [key: string]: unknown }): {
  success: boolean;
  data?: unknown;
  errors?: z.ZodIssue[];
} {
  const validator = VALIDATORS[record._entity];
  if (!validator) {
    return {
      success: false,
      errors: [
        {
          code: "custom",
          path: ["_entity"],
          message: `Unknown entity type: ${record._entity}`,
        },
      ],
    };
  }

  const result = validator.safeParse(record);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}
