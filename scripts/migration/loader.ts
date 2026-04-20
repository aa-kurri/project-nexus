/**
 * Universal Migration Framework — Supabase Loader
 *
 * Takes a CanonicalDataset and loads it into Ayura OS Supabase tables.
 * Source-agnostic: works the same regardless of which adapter produced the data.
 *
 * Features:
 *   - Deterministic UUID generation (idempotent)
 *   - FK resolution via ID map
 *   - Batch upserts with conflict resolution
 *   - Dry-run mode
 *   - Full audit trail
 */

import crypto from "crypto";
import { getConfig } from "./config.js";
import { getSupabasePg } from "./db.js";
import { getIdMap } from "./id_map.js";
import { logger } from "./logger.js";
import { validateRecord } from "./schema/validators.js";
import type { CanonicalDataset, CanonicalRecord } from "./schema/canonical.js";
import type { MigrationResult, MigrationError } from "./types.js";

// ── UUID Generator ──────────────────────────────────────────────

function deterministicUuid(tenantId: string, entity: string, sourceId: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${tenantId}:${entity}:${sourceId}`)
    .digest("hex")
    .slice(0, 32);
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

// ── Phone normalizer ────────────────────────────────────────────

function normalizePhone(raw: string): string {
  let digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  if (!digits.startsWith("+")) digits = `+${digits}`;
  return digits;
}

// ── Gender normalizer ───────────────────────────────────────────

function normalizeGender(raw?: string): "male" | "female" | "other" | "unknown" {
  if (!raw) return "unknown";
  const s = raw.toLowerCase().trim();
  if (["m", "male"].includes(s)) return "male";
  if (["f", "female"].includes(s)) return "female";
  if (["o", "other"].includes(s)) return "other";
  return "unknown";
}

// ── Loader ──────────────────────────────────────────────────────

export async function loadDataset(
  dataset: CanonicalDataset
): Promise<{ results: MigrationResult[]; errors: MigrationError[] }> {
  logger.separator("Loading to Ayura OS");
  logger.setStage("loader");

  const cfg = getConfig();
  const tenantId = cfg.migration.tenantId;
  if (!tenantId) throw new Error("MIGRATION_TENANT_ID is required");

  const dryRun = cfg.migration.dryRun;
  const idMap = getIdMap();
  await idMap.load();

  const results: MigrationResult[] = [];
  const errors: MigrationError[] = [];

  if (dryRun) {
    logger.warn("DRY RUN MODE — no data will be written to Supabase");
  }

  // Load order matters for FK resolution
  const stages = [
    { name: "users", data: dataset.users, loader: loadUsers },
    { name: "patients", data: dataset.patients, loader: loadPatients },
    { name: "beds", data: dataset.beds, loader: loadBeds },
    { name: "encounters", data: dataset.encounters, loader: loadEncounters },
    { name: "conditions", data: dataset.conditions, loader: loadConditions },
    { name: "allergies", data: dataset.allergies, loader: loadAllergies },
    { name: "medication_requests", data: dataset.medicationRequests, loader: loadMedicationRequests },
    { name: "service_requests", data: dataset.serviceRequests, loader: loadServiceRequests },
    { name: "observations", data: dataset.observations, loader: loadObservations },
    { name: "diagnostic_reports", data: dataset.diagnosticReports, loader: loadDiagnosticReports },
    { name: "lab_samples", data: dataset.labSamples, loader: loadLabSamples },
    { name: "stock_items", data: dataset.stockItems, loader: loadStockItems },
    { name: "stock_batches", data: dataset.stockBatches, loader: loadStockBatches },
    { name: "admissions", data: dataset.admissions, loader: loadAdmissions },
    { name: "bills", data: dataset.bills, loader: loadBills },
    { name: "bill_items", data: dataset.billItems, loader: loadBillItems },
  ] as const;

  for (const stage of stages) {
    if (stage.data.length === 0) {
      logger.debug(`Skipping ${stage.name}: no records`);
      continue;
    }

    const start = Date.now();
    logger.info(`Loading ${stage.name}: ${stage.data.length.toLocaleString()} records`);

    // Validate
    let validCount = 0;
    let errorCount = 0;

    for (const record of stage.data as CanonicalRecord[]) {
      const validation = validateRecord(record as any);
      if (!validation.success) {
        errorCount++;
        errors.push({
          stage: `validate:${stage.name}`,
          table: stage.name,
          legacyId: (record as any)._sourceId || "unknown",
          error: JSON.stringify(validation.errors),
          row: record,
          timestamp: new Date().toISOString(),
        });
      } else {
        validCount++;
      }
    }

    if (errorCount > 0) {
      logger.warn(`  ${errorCount} validation errors (see error log)`);
    }

    // Load
    if (!dryRun) {
      try {
        await (stage.loader as Function)(stage.data, tenantId, idMap);
      } catch (err) {
        logger.error(`  Load failed for ${stage.name}`, { error: String(err) });
        errors.push({
          stage: `load:${stage.name}`,
          table: stage.name,
          legacyId: "batch",
          error: String(err),
          timestamp: new Date().toISOString(),
        });
      }
    }

    results.push({
      stage: stage.name,
      table: stage.name,
      sourceCount: stage.data.length,
      targetCount: validCount,
      errorCount,
      duration_ms: Date.now() - start,
    });

    logger.success(`  ${stage.name}: ${validCount} valid, ${errorCount} errors`);
  }

  await idMap.save();
  logger.separator();
  logger.success(`Load complete: ${results.reduce((s, r) => s + r.targetCount, 0)} records loaded`);

  return { results, errors };
}

// ── Entity-specific loaders ─────────────────────────────────────

async function loadPatients(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  const batchSize = getConfig().migration.batchSize;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const values: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    for (const r of batch) {
      const uuid = deterministicUuid(tenantId, "patient", r._sourceId);
      idMap.set("patients", r._sourceId, "patients", uuid);

      values.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, ` +
        `$${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, ` +
        `$${paramIdx++}, $${paramIdx++})`
      );
      params.push(
        uuid, tenantId,
        r.mrn || `M-${r._sourceId}`,
        normalizePhone(r.phone || ""),
        r.fullName || "Unknown",
        r.dob || null,
        normalizeGender(r.gender),
        r.addressLine || null,
        r.city || null,
        r.state || null,
        r.pincode || null,
        JSON.stringify({ legacy_id: r._sourceId, legacy_source: r._sourceSystem })
      );
    }

    await pool.query(
      `INSERT INTO public.patients
        (id, tenant_id, mrn, phone, full_name, dob, gender, address_line, city, state, pincode, metadata)
       VALUES ${values.join(", ")}
       ON CONFLICT (tenant_id, mrn) DO UPDATE SET
        phone = EXCLUDED.phone, full_name = EXCLUDED.full_name,
        dob = EXCLUDED.dob, gender = EXCLUDED.gender,
        address_line = EXCLUDED.address_line, city = EXCLUDED.city,
        state = EXCLUDED.state, pincode = EXCLUDED.pincode,
        metadata = EXCLUDED.metadata, updated_at = now()`,
      params
    );
  }
}

async function loadEncounters(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  const batchSize = getConfig().migration.batchSize;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const values: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    for (const r of batch) {
      const uuid = deterministicUuid(tenantId, "encounter", r._sourceId);
      const patientId = idMap.resolve("patients", r.patientSourceId);
      if (!patientId) continue;

      const practId = r.practitionerSourceId
        ? idMap.resolve("users", r.practitionerSourceId)
        : null;

      idMap.set("encounters", r._sourceId, "encounters", uuid);

      values.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, ` +
        `$${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
      );
      params.push(
        uuid, tenantId, patientId, practId,
        r.class || "opd",
        r.status || "finished",
        r.reason || null,
        r.startedAt || new Date().toISOString()
      );
    }

    if (values.length === 0) continue;

    await pool.query(
      `INSERT INTO public.encounters
        (id, tenant_id, patient_id, practitioner_id, class, status, reason, started_at)
       VALUES ${values.join(", ")}
       ON CONFLICT (id) DO NOTHING`,
      params
    );
  }
}

// Simplified loaders for remaining entities follow the same pattern:
// deterministic UUID → FK resolution via idMap → batch INSERT ON CONFLICT

async function loadUsers(records: any[], tenantId: string, idMap: any) {
  // Users are loaded into profiles (Supabase Auth users created separately)
  logger.debug(`User records queued: ${records.length} (auth account creation requires separate step)`);
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "user", r._sourceId);
    idMap.set("users", r._sourceId, "profiles", uuid);
  }
}

async function loadBeds(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "bed", r._sourceId);
    idMap.set("beds", r._sourceId, "beds", uuid);
    await pool.query(
      `INSERT INTO public.beds (id, tenant_id, ward, label, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, label) DO NOTHING`,
      [uuid, tenantId, r.ward || "General", r.label || `BED-${r._sourceId}`, r.status || "vacant"]
    );
  }
}

async function loadConditions(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  const batchSize = getConfig().migration.batchSize;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    for (const r of batch) {
      const uuid = deterministicUuid(tenantId, "condition", r._sourceId);
      const patientId = idMap.resolve("patients", r.patientSourceId);
      if (!patientId) continue;
      const encId = r.encounterSourceId ? idMap.resolve("encounters", r.encounterSourceId) : null;
      await pool.query(
        `INSERT INTO public.conditions (id, tenant_id, patient_id, encounter_id, code, display, onset_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [uuid, tenantId, patientId, encId, r.code || "unknown", r.display || "Unknown", r.onsetAt || null]
      );
    }
  }
}

async function loadAllergies(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "allergy", r._sourceId);
    const patientId = idMap.resolve("patients", r.patientSourceId);
    if (!patientId) continue;
    await pool.query(
      `INSERT INTO public.allergies (id, tenant_id, patient_id, substance, reaction, severity)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [uuid, tenantId, patientId, r.substance, r.reaction || null, r.severity || null]
    );
  }
}

async function loadMedicationRequests(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  const batchSize = getConfig().migration.batchSize;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    for (const r of batch) {
      const uuid = deterministicUuid(tenantId, "medication_request", r._sourceId);
      const patientId = idMap.resolve("patients", r.patientSourceId);
      if (!patientId) continue;
      const encId = r.encounterSourceId ? idMap.resolve("encounters", r.encounterSourceId) : null;
      const prescId = r.prescriberSourceId ? idMap.resolve("users", r.prescriberSourceId) : null;
      await pool.query(
        `INSERT INTO public.medication_requests
          (id, tenant_id, patient_id, encounter_id, prescriber_id, drug_name, strength, route, dosage, status, authored_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
        [uuid, tenantId, patientId, encId, prescId, r.drugName, r.strength || null, r.route || null, r.dosage || null, r.status || "completed", r.authoredAt]
      );
    }
  }
}

async function loadServiceRequests(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "service_request", r._sourceId);
    const patientId = idMap.resolve("patients", r.patientSourceId);
    if (!patientId) continue;
    const encId = r.encounterSourceId ? idMap.resolve("encounters", r.encounterSourceId) : null;
    idMap.set("service_requests", r._sourceId, "service_requests", uuid);
    await pool.query(
      `INSERT INTO public.service_requests
        (id, tenant_id, patient_id, encounter_id, code, display, category, status, requested_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [uuid, tenantId, patientId, encId, r.code, r.display, r.category || "lab", r.status || "completed", r.requestedAt]
    );
  }
}

async function loadObservations(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  const batchSize = getConfig().migration.batchSize;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    for (const r of batch) {
      const uuid = deterministicUuid(tenantId, "observation", r._sourceId);
      const patientId = idMap.resolve("patients", r.patientSourceId);
      if (!patientId) continue;
      const encId = r.encounterSourceId ? idMap.resolve("encounters", r.encounterSourceId) : null;
      await pool.query(
        `INSERT INTO public.observations
          (id, tenant_id, patient_id, encounter_id, code, code_system, display,
           value_num, value_unit, value_text, ref_low, ref_high, flag, status, effective_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO NOTHING`,
        [uuid, tenantId, patientId, encId, r.code, r.codeSystem || "http://loinc.org", r.display,
         r.valueNum ?? null, r.valueUnit || null, r.valueText || null,
         r.refLow ?? null, r.refHigh ?? null, r.flag || null, r.status || "final", r.effectiveAt]
      );
    }
  }
}

async function loadDiagnosticReports(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "diagnostic_report", r._sourceId);
    const patientId = idMap.resolve("patients", r.patientSourceId);
    if (!patientId) continue;
    await pool.query(
      `INSERT INTO public.diagnostic_reports
        (id, tenant_id, patient_id, code, display, status, issued_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [uuid, tenantId, patientId, r.code, r.display, r.status || "final", r.issuedAt || null]
    );
  }
}

async function loadLabSamples(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "lab_sample", r._sourceId);
    const patientId = idMap.resolve("patients", r.patientSourceId);
    const srId = idMap.resolve("service_requests", r.serviceRequestSourceId);
    if (!patientId || !srId) continue;
    await pool.query(
      `INSERT INTO public.lab_samples
        (id, tenant_id, service_request_id, patient_id, barcode, container, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (tenant_id, barcode) DO NOTHING`,
      [uuid, tenantId, srId, patientId, r.barcode, r.container || null, r.status || "resulted"]
    );
  }
}

async function loadStockItems(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "stock_item", r._sourceId);
    idMap.set("stock_items", r._sourceId, "stock_items", uuid);
    await pool.query(
      `INSERT INTO public.stock_items
        (id, tenant_id, name, generic, form, strength, hsn_sac, gst_pct, rol)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (tenant_id, name, strength) DO NOTHING`,
      [uuid, tenantId, r.name, r.generic || null, r.form || null, r.strength || null,
       r.hsnSac || null, r.gstPct ?? 12, r.reorderLevel ?? 0]
    );
  }
}

async function loadStockBatches(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "stock_batch", r._sourceId);
    const itemId = idMap.resolve("stock_items", r.itemSourceId);
    if (!itemId) continue;
    // Resolve store by name or create default
    await pool.query(
      `INSERT INTO public.stock_stores (id, tenant_id, name, kind)
       VALUES ($1, $2, $3, 'main')
       ON CONFLICT (tenant_id, name) DO NOTHING`,
      [deterministicUuid(tenantId, "store", r.storeName || "Main"), tenantId, r.storeName || "Main Store"]
    );
    const storeId = deterministicUuid(tenantId, "store", r.storeName || "Main");
    await pool.query(
      `INSERT INTO public.stock_batches
        (id, tenant_id, item_id, store_id, batch_no, expiry, mrp, quantity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (tenant_id, item_id, store_id, batch_no) DO NOTHING`,
      [uuid, tenantId, itemId, storeId, r.batchNo, r.expiry, r.mrp ?? null, r.quantity ?? 0]
    );
  }
}

async function loadAdmissions(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "admission", r._sourceId);
    const patientId = idMap.resolve("patients", r.patientSourceId);
    if (!patientId) continue;
    const bedId = r.bedSourceId ? idMap.resolve("beds", r.bedSourceId) : null;
    const encId = r.encounterSourceId ? idMap.resolve("encounters", r.encounterSourceId) : null;
    await pool.query(
      `INSERT INTO public.admissions
        (id, tenant_id, patient_id, bed_id, encounter_id, status, admitted_at, discharged_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [uuid, tenantId, patientId, bedId, encId, r.status || "discharged", r.admittedAt, r.dischargedAt || null]
    );
  }
}

async function loadBills(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "bill", r._sourceId);
    const patientId = idMap.resolve("patients", r.patientSourceId);
    if (!patientId) continue;
    const encId = r.encounterSourceId ? idMap.resolve("encounters", r.encounterSourceId) : null;
    idMap.set("bills", r._sourceId, "bills", uuid);
    await pool.query(
      `INSERT INTO public.bills
        (id, tenant_id, patient_id, encounter_id, number, status, subtotal, tax_total, grand_total, finalized_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (tenant_id, number) DO NOTHING`,
      [uuid, tenantId, patientId, encId, r.number, r.status || "paid",
       r.subtotal ?? 0, r.taxTotal ?? 0, r.grandTotal ?? 0, r.finalizedAt || null]
    );
  }
}

async function loadBillItems(records: any[], tenantId: string, idMap: any) {
  const pool = await getSupabasePg();
  for (const r of records) {
    const uuid = deterministicUuid(tenantId, "bill_item", r._sourceId);
    const billId = idMap.resolve("bills", r.billSourceId);
    if (!billId) continue;
    await pool.query(
      `INSERT INTO public.bill_items
        (id, tenant_id, bill_id, source, description, qty, unit_price, gst_pct, line_total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [uuid, tenantId, billId, r.source || "opd", r.description, r.qty ?? 1, r.unitPrice ?? 0, r.gstPct ?? 0, r.lineTotal ?? 0]
    );
  }
}
