/**
 * Universal Migration Framework — Base Adapter
 *
 * All source adapters implement this interface.
 * This is the contract that makes the framework source-agnostic.
 */

import type { CanonicalDataset } from "../schema/canonical.js";

export interface AdapterConfig {
  /** Adapter type identifier */
  type: "sql" | "file" | "fhir" | "api" | "hl7";
  /** Source system name (e.g. "vaidyo", "practo", "bahmni") */
  sourceSystem: string;
  /** Additional adapter-specific options */
  options: Record<string, unknown>;
}

export interface DiscoveredSchema {
  tables: {
    name: string;
    rowCount: number;
    columns: {
      name: string;
      type: string;
      nullable: boolean;
      sample?: unknown;
    }[];
  }[];
}

/**
 * Abstract base class for source adapters.
 *
 * Implement this to add support for a new source system.
 */
export abstract class SourceAdapter {
  readonly config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  /** Human-readable name for logs */
  abstract get displayName(): string;

  /**
   * Test connectivity to the source system.
   * Returns true if connection is successful.
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Discover the source schema — list all tables/files and their columns.
   * Used to auto-generate mapping configs.
   */
  abstract discoverSchema(): Promise<DiscoveredSchema>;

  /**
   * Extract all data from the source system and return it
   * as a CanonicalDataset (the universal intermediate format).
   *
   * This is the main method that each adapter implements.
   * The adapter is responsible for reading the source data AND
   * transforming it into canonical records.
   */
  abstract extract(): Promise<CanonicalDataset>;

  /**
   * Close any open connections.
   */
  abstract close(): Promise<void>;
}
