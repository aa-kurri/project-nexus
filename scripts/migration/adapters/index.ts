/**
 * Universal Migration Framework — Adapter Registry
 *
 * Exports all available adapters for use by the CLI runner.
 * To add a new source system, create a new adapter class
 * extending SourceAdapter and register it here.
 */

export { SourceAdapter } from "./base.js";
export type { AdapterConfig, DiscoveredSchema } from "./base.js";

export { SqlAdapter } from "./sql.js";
export { FileAdapter } from "./file.js";
export { FhirAdapter } from "./fhir.js";

// ── Adapter Registry ────────────────────────────────────────────
// Add new adapters here as they are built.
//
// Planned adapters:
//   - ApiAdapter    → REST API connector for live HMS systems
//   - Hl7Adapter    → HL7v2 message parser (ADT/ORU/ORM)
//   - ExcelAdapter  → Native .xlsx reader (via SheetJS)
//   - BahmniAdapter → Pre-built mapping for Bahmni/OpenMRS
//   - PractoAdapter → Pre-built mapping for Practo
