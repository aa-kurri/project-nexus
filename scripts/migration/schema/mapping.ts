/**
 * Universal Migration Framework — YAML Mapping Config Parser
 *
 * Hospitals provide a simple YAML file that describes:
 *   "My column X in table Y" → "Ayura canonical field Z"
 *
 * This module parses that config and produces a mapping function
 * that transforms arbitrary source rows into canonical records.
 */

import fs from "fs/promises";
import { logger } from "../logger.js";
import type {
  CanonicalEntityType,
  CanonicalRecord,
} from "./canonical.js";

// ── Mapping Config Shape ─────────────────────────────────────────

export interface ColumnMapping {
  /** Source column name (from the legacy system) */
  from: string;
  /** Target canonical field name */
  to: string;
  /** Optional transform: "trim" | "lowercase" | "uppercase" | "int" | "float" | "date" | "datetime" | "boolean" | "phone_e164" | "gender" */
  transform?: string;
  /** Optional default value if source column is null/empty */
  default?: string | number | boolean;
}

export interface EntityMapping {
  /** The Ayura canonical entity type this maps to */
  entity: CanonicalEntityType;
  /** Source table or file name */
  sourceTable: string;
  /** How to identify unique rows (source column name) */
  sourceIdColumn: string;
  /** Column-to-column mappings */
  columns: ColumnMapping[];
}

export interface MappingConfig {
  /** Human-readable name of the source system */
  sourceSystem: string;
  /** Entity mappings */
  entities: EntityMapping[];
}

// ── Built-in transforms ─────────────────────────────────────────

const TRANSFORMS: Record<string, (value: unknown) => unknown> = {
  trim: (v) => (typeof v === "string" ? v.trim() : v),
  lowercase: (v) => (typeof v === "string" ? v.toLowerCase() : v),
  uppercase: (v) => (typeof v === "string" ? v.toUpperCase() : v),
  int: (v) => {
    const n = parseInt(String(v), 10);
    return isNaN(n) ? null : n;
  },
  float: (v) => {
    const n = parseFloat(String(v));
    return isNaN(n) ? null : n;
  },
  date: (v) => {
    if (!v) return null;
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  },
  datetime: (v) => {
    if (!v) return null;
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? null : d.toISOString();
  },
  boolean: (v) => {
    if (typeof v === "boolean") return v;
    const s = String(v).toLowerCase().trim();
    return ["true", "1", "yes", "y", "active"].includes(s);
  },
  phone_e164: (v) => {
    if (!v) return "";
    let digits = String(v).replace(/\D/g, "");
    if (digits.length === 10) digits = `91${digits}`;
    return `+${digits}`;
  },
  gender: (v) => {
    if (!v) return "unknown";
    const s = String(v).toLowerCase().trim();
    if (["m", "male"].includes(s)) return "male";
    if (["f", "female"].includes(s)) return "female";
    if (["o", "other"].includes(s)) return "other";
    return "unknown";
  },
};

// ── Parse mapping YAML ──────────────────────────────────────────

/**
 * Parse a mapping config from a YAML/JSON file.
 * We accept JSON since YAML requires an extra dep — but structure is YAML-friendly.
 */
export async function loadMappingConfig(filePath: string): Promise<MappingConfig> {
  const raw = await fs.readFile(filePath, "utf-8");

  // Support both JSON and simplified YAML (JSON superset for now)
  let config: MappingConfig;
  try {
    config = JSON.parse(raw) as MappingConfig;
  } catch {
    // If not valid JSON, attempt rudimentary YAML-like parse
    // For full YAML support, add `yaml` package
    throw new Error(
      `Failed to parse mapping config at ${filePath}. ` +
        `Ensure the file is valid JSON. For YAML support, install the 'yaml' package.`
    );
  }

  logger.info(`Loaded mapping config: ${config.sourceSystem} — ${config.entities.length} entity mappings`);
  return config;
}

// ── Apply mapping to a row ──────────────────────────────────────

/**
 * Transform a raw source row into a canonical record using the configured mapping.
 */
export function applyMapping(
  row: Record<string, unknown>,
  entityMapping: EntityMapping,
  sourceSystem: string
): CanonicalRecord {
  const result: Record<string, unknown> = {
    _entity: entityMapping.entity,
    _sourceId: String(row[entityMapping.sourceIdColumn] ?? ""),
    _sourceSystem: sourceSystem,
  };

  for (const col of entityMapping.columns) {
    let value = row[col.from];

    // Apply default if null/undefined/empty
    if (value === null || value === undefined || value === "") {
      if (col.default !== undefined) {
        value = col.default;
      }
    }

    // Apply transform
    if (col.transform && value !== null && value !== undefined) {
      const transformFn = TRANSFORMS[col.transform];
      if (transformFn) {
        value = transformFn(value);
      } else {
        logger.warn(`Unknown transform "${col.transform}" for column "${col.from}"`);
      }
    }

    result[col.to] = value;
  }

  return result as unknown as CanonicalRecord;
}

/**
 * Transform an entire batch of rows using the entity mapping.
 */
export function applyMappingBatch(
  rows: Record<string, unknown>[],
  entityMapping: EntityMapping,
  sourceSystem: string
): CanonicalRecord[] {
  return rows.map((row) => applyMapping(row, entityMapping, sourceSystem));
}
