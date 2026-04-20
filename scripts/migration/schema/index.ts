/**
 * Universal Migration Framework — Schema Index
 *
 * Re-exports all schema-related modules.
 */

export * from "./canonical.js";
export { validateRecord, VALIDATORS } from "./validators.js";
export { loadMappingConfig, applyMapping, applyMappingBatch } from "./mapping.js";
export type { MappingConfig, EntityMapping, ColumnMapping } from "./mapping.js";
