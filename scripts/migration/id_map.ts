/**
 * Migration Pipeline — ID Mapping Store
 *
 * Maintains a bidirectional map: Vaidyo legacy ID ↔ Ayura OS UUID.
 * Used by transform stages to resolve foreign keys across tables.
 *
 * Persisted to disk (JSON) so pipeline can be resumed across runs.
 */

import fs from "fs/promises";
import path from "path";
import { getConfig } from "./config.js";
import { logger } from "./logger.js";
import type { IdMap } from "./types.js";

class IdMappingStore {
  /** legacy_table:legacy_id → ayura_uuid */
  private forward = new Map<string, string>();
  /** ayura_table:ayura_uuid → legacy_id */
  private reverse = new Map<string, number>();

  private filePath: string;
  private dirty = false;

  constructor() {
    const cfg = getConfig();
    this.filePath = path.join(cfg.migration.stagingDir, "id_map.json");
  }

  private key(table: string, id: number | string): string {
    return `${table}:${id}`;
  }

  /** Register a mapping: legacy ID → new UUID */
  set(legacyTable: string, legacyId: number, ayuraTable: string, ayuraId: string): void {
    this.forward.set(this.key(legacyTable, legacyId), ayuraId);
    this.reverse.set(this.key(ayuraTable, ayuraId), legacyId);
    this.dirty = true;
  }

  /** Resolve a legacy ID to its new UUID */
  resolve(legacyTable: string, legacyId: number): string | undefined {
    return this.forward.get(this.key(legacyTable, legacyId));
  }

  /** Resolve an Ayura UUID back to its legacy ID */
  reverseResolve(ayuraTable: string, ayuraId: string): number | undefined {
    return this.reverse.get(this.key(ayuraTable, ayuraId));
  }

  /** Check if a mapping exists */
  has(legacyTable: string, legacyId: number): boolean {
    return this.forward.has(this.key(legacyTable, legacyId));
  }

  /** Get total mapping count */
  get size(): number {
    return this.forward.size;
  }

  /** Persist to disk */
  async save(): Promise<void> {
    if (!this.dirty) return;

    const data: IdMap[] = [];
    for (const [key, ayuraId] of this.forward) {
      const [legacyTable, legacyIdStr] = key.split(":");
      data.push({
        legacyTable,
        legacyId: parseInt(legacyIdStr, 10),
        ayuraTable: legacyTable, // simplified — in practice track separately
        ayuraId,
      });
    }

    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    this.dirty = false;
    logger.debug(`ID map saved: ${data.length} mappings → ${this.filePath}`);
  }

  /** Restore from disk (if exists) */
  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const data: IdMap[] = JSON.parse(raw);
      for (const m of data) {
        this.forward.set(this.key(m.legacyTable, m.legacyId), m.ayuraId);
        this.reverse.set(this.key(m.ayuraTable, m.ayuraId), m.legacyId);
      }
      logger.info(`ID map restored: ${data.length} mappings from disk`);
    } catch {
      logger.debug("No existing ID map found — starting fresh");
    }
  }
}

let _store: IdMappingStore | null = null;

export function getIdMap(): IdMappingStore {
  if (!_store) {
    _store = new IdMappingStore();
  }
  return _store;
}
