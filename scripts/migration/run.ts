/**
 * Universal Migration Framework — CLI Entry Point
 *
 * Usage:
 *   npx tsx run.ts --source=file --input=./hospital-data/ --tenant-id=<uuid>
 *   npx tsx run.ts --source=sql --mapping=./mapping.json --tenant-id=<uuid>
 *   npx tsx run.ts --source=fhir --input=./bundle.json --tenant-id=<uuid>
 *   npx tsx run.ts discover --source=sql
 *   npx tsx run.ts templates --output=./templates/
 *   npx tsx run.ts --dry-run
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getConfig, applyOverrides } from "./config.js";
import { logger } from "./logger.js";
import { closeAll } from "./db.js";
import { getIdMap } from "./id_map.js";
import { loadDataset } from "./loader.js";
import { verifyMigration } from "./verifier.js";

// Adapters
import { SqlAdapter } from "./adapters/sql.js";
import { FileAdapter } from "./adapters/file.js";
import { FhirAdapter } from "./adapters/fhir.js";
import type { SourceAdapter } from "./adapters/base.js";
import type { CanonicalDataset } from "./schema/canonical.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CLI Argument Parser ─────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const positional: string[] = [];

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--")) {
      const [key, ...rest] = arg.slice(2).split("=");
      args[key] = rest.join("=") || "true";
    } else {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    args._command = positional[0];
  }

  return args;
}

// ── Adapter Factory ─────────────────────────────────────────────

function createAdapter(sourceType: string, args: Record<string, string>): SourceAdapter {
  const cfg = getConfig();

  switch (sourceType) {
    case "sql":
      return new SqlAdapter({
        type: "sql",
        sourceSystem: args["source-system"] || "legacy_hms",
        options: {
          host: cfg.vaidyo.host,
          port: cfg.vaidyo.port,
          database: cfg.vaidyo.database,
          user: cfg.vaidyo.user,
          password: cfg.vaidyo.password,
          ssl: cfg.vaidyo.ssl,
          mappingFile: args.mapping,
          batchSize: cfg.migration.batchSize,
        },
      });

    case "file":
      return new FileAdapter({
        type: "file",
        sourceSystem: args["source-system"] || "file_import",
        options: {
          inputDir: args.input || "./hospital-data",
          sourceSystem: args["source-system"] || "file_import",
        },
      });

    case "fhir":
      return new FhirAdapter({
        type: "fhir",
        sourceSystem: args["source-system"] || "fhir",
        options: {
          inputPath: args.input || "./fhir-bundle.json",
          serverUrl: args["fhir-server"],
          authToken: args["fhir-token"],
        },
      });

    default:
      throw new Error(
        `Unknown source type: "${sourceType}". Supported: sql, file, fhir`
      );
  }
}

// ── Template Generator ──────────────────────────────────────────

async function generateTemplates(outputDir: string) {
  logger.separator("Generating CSV Templates");

  await fs.mkdir(outputDir, { recursive: true });

  const templates: Record<string, string> = {
    "patients.csv": [
      "id,name,phone,email,dob,gender,address,city,state,pincode,blood_group,emergency_contact",
      '1,Rajesh Kumar,+919876543210,rajesh@example.com,1985-03-15,male,"123 Main St",Hyderabad,Telangana,500001,B+,+919876543211',
      '2,Priya Sharma,+919876543212,priya@example.com,1990-07-22,female,"456 Park Ave",Mumbai,Maharashtra,400001,A-,+919876543213',
    ].join("\n"),

    "visits.csv": [
      "id,patient_id,doctor_id,visit_type,chief_complaint,visit_date,status",
      "1,1,10,opd,Fever and body ache,2026-04-01T09:30:00Z,finished",
      "2,2,11,opd,Routine checkup,2026-04-02T10:00:00Z,finished",
    ].join("\n"),

    "prescriptions.csv": [
      "id,patient_id,visit_id,doctor_id,drug_name,strength,route,dosage,prescribed_at,status",
      "1,1,1,10,Paracetamol,500mg,oral,1 tab TID for 5 days,2026-04-01T10:00:00Z,completed",
      "2,1,1,10,Azithromycin,500mg,oral,1 tab OD for 3 days,2026-04-01T10:00:00Z,completed",
    ].join("\n"),

    "lab_orders.csv": [
      "id,patient_id,visit_id,doctor_id,test_code,test_name,ordered_at,status",
      "1,1,1,10,CBC,Complete Blood Count,2026-04-01T10:30:00Z,completed",
      "2,2,2,11,LFT,Liver Function Test,2026-04-02T11:00:00Z,completed",
    ].join("\n"),

    "lab_results.csv": [
      "id,order_id,patient_id,code,parameter,value,unit,ref_low,ref_high,flag,resulted_at",
      "1,1,1,718-7,Hemoglobin,13.5,g/dL,12.0,16.0,normal,2026-04-01T14:00:00Z",
      "2,1,1,6690-2,WBC Count,8500,cells/uL,4000,11000,normal,2026-04-01T14:00:00Z",
    ].join("\n"),

    "diagnoses.csv": [
      "id,patient_id,visit_id,icd_code,diagnosis,onset_date",
      "1,1,1,J06.9,Acute upper respiratory infection,2026-04-01",
    ].join("\n"),

    "inventory.csv": [
      "id,name,generic_name,form,strength,hsn_code,gst_percent,reorder_level",
      "1,Dolo 650,Paracetamol,tab,650mg,3004,12,100",
      "2,Azee 500,Azithromycin,tab,500mg,3004,12,50",
    ].join("\n"),

    "invoices.csv": [
      "id,patient_id,visit_id,invoice_number,subtotal,tax,total,status,date",
      "1,1,1,INV-2026-0001,500.00,60.00,560.00,paid,2026-04-01T12:00:00Z",
    ].join("\n"),

    "users.csv": [
      "id,name,email,phone,role,department,is_active",
      "10,Dr. Vikram Patel,vikram@hospital.com,+919876543220,doctor,General Medicine,true",
      "11,Dr. Meera Singh,meera@hospital.com,+919876543221,doctor,Pediatrics,true",
      "20,Nurse Anita Roy,anita@hospital.com,+919876543230,nurse,Ward 1,true",
    ].join("\n"),

    "allergies.csv": [
      "id,patient_id,substance,reaction,severity",
      "1,1,Penicillin,Rash,moderate",
    ].join("\n"),

    "beds.csv": [
      "id,ward,label,status",
      "1,W1,W1-01,vacant",
      "2,W1,W1-02,vacant",
      "3,ICU,ICU-01,vacant",
    ].join("\n"),
  };

  for (const [fileName, content] of Object.entries(templates)) {
    const filePath = path.join(outputDir, fileName);
    await fs.writeFile(filePath, content);
    logger.success(`Created: ${filePath}`);
  }

  logger.separator();
  logger.success(`Templates generated in: ${outputDir}`);
  logger.info("Instructions:");
  logger.info("  1. Open each CSV in Excel/Google Sheets");
  logger.info("  2. Replace the sample rows with your hospital's data");
  logger.info("  3. Keep the header row exactly as-is");
  logger.info("  4. Save as CSV (not .xlsx)");
  logger.info("  5. Run: npx tsx run.ts --source=file --input=<folder> --tenant-id=<uuid>");
}

// ── Schema Discovery ────────────────────────────────────────────

async function discoverSchema(adapter: SourceAdapter) {
  logger.separator("Schema Discovery");

  const connected = await adapter.testConnection();
  if (!connected) {
    logger.error("Cannot connect to source — check credentials");
    process.exit(1);
  }

  const schema = await adapter.discoverSchema();

  console.log("\n📊 Discovered Schema:\n");
  for (const table of schema.tables) {
    console.log(`\n  📋 ${table.name} (${table.rowCount.toLocaleString()} rows)`);
    for (const col of table.columns) {
      const sampleStr = col.sample !== undefined ? ` → sample: ${JSON.stringify(col.sample)}` : "";
      console.log(`     ${col.nullable ? "◻" : "◼"} ${col.name} (${col.type})${sampleStr}`);
    }
  }

  // Generate a starter mapping config
  logger.info("\nTo generate a mapping config, create a JSON file with this structure:");
  logger.info("  See mapping.example.json for reference");
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  // Apply CLI overrides
  try {
    applyOverrides({
      dryRun: args["dry-run"] === "true" || args["dry-run"] === undefined ? undefined : args["dry-run"] === "true",
      tenantId: args["tenant-id"],
      batchSize: args["batch-size"] ? parseInt(args["batch-size"]) : undefined,
    });
  } catch {
    // Config may not be loadable for template generation
  }

  const cfg = (() => { try { return getConfig(); } catch { return null; } })();

  logger.separator("Ayura OS — Universal Migration Framework");

  // Handle special commands
  if (args._command === "templates") {
    await generateTemplates(args.output || "./hospital-data");
    return;
  }

  if (!cfg) {
    logger.error("Configuration error — ensure .env is set up (see .env.example)");
    process.exit(1);
  }

  logger.configure(cfg.migration.logLevel as any);

  if (args["dry-run"] !== undefined) {
    applyOverrides({ dryRun: args["dry-run"] !== "false" });
  }

  const sourceType = args.source || "file";

  if (args._command === "discover") {
    const adapter = createAdapter(sourceType, args);
    await discoverSchema(adapter);
    await adapter.close();
    return;
  }

  // ── Full Migration Pipeline ───────────────────────────────────

  logger.info(`Source: ${sourceType}`);
  logger.info(`Tenant: ${cfg.migration.tenantId || "NOT SET"}`);
  logger.info(`Dry Run: ${cfg.migration.dryRun}`);
  logger.info(`Batch Size: ${cfg.migration.batchSize}`);

  if (!cfg.migration.tenantId) {
    logger.error("MIGRATION_TENANT_ID is required. Set it in .env or pass --tenant-id=<uuid>");
    process.exit(1);
  }

  // Step 1: Extract
  const adapter = createAdapter(sourceType, args);
  const connected = await adapter.testConnection();
  if (!connected) {
    logger.error("Cannot connect to source — aborting");
    process.exit(1);
  }

  const dataset: CanonicalDataset = await adapter.extract();

  // Save extracted dataset for audit
  const stagingDir = cfg.migration.stagingDir;
  await fs.mkdir(stagingDir, { recursive: true });
  await fs.writeFile(
    path.join(stagingDir, "canonical_dataset.json"),
    JSON.stringify(dataset, null, 2)
  );
  logger.info(`Dataset saved to ${stagingDir}/canonical_dataset.json`);

  // Step 2: Load
  const idMap = getIdMap();
  await idMap.load();
  const { results, errors } = await loadDataset(dataset);

  // Save errors
  if (errors.length > 0) {
    const errDir = cfg.migration.errorsDir;
    await fs.mkdir(errDir, { recursive: true });
    await fs.writeFile(
      path.join(errDir, "migration_errors.json"),
      JSON.stringify(errors, null, 2)
    );
    logger.warn(`${errors.length} errors saved to ${errDir}/migration_errors.json`);
  }

  // Step 3: Verify
  if (!cfg.migration.dryRun) {
    await verifyMigration(dataset);
  } else {
    logger.info("Skipping verification in dry-run mode");
  }

  // Save results
  await fs.writeFile(
    path.join(stagingDir, "migration_report.json"),
    JSON.stringify({ results, errors, timestamp: new Date().toISOString() }, null, 2)
  );

  // Cleanup
  await adapter.close();
  await closeAll();

  logger.separator("Migration Complete");
  logger.info(`Results: ${stagingDir}/migration_report.json`);

  if (errors.length > 0) {
    logger.warn(`⚠ ${errors.length} errors — review before going live`);
  } else {
    logger.success("✔ Zero errors — ready for parallel run");
  }
}

main().catch((err) => {
  logger.error("Fatal error", { error: String(err), stack: (err as Error).stack });
  process.exit(1);
});
