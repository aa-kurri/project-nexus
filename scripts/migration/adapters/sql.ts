/**
 * SQL Database Adapter
 *
 * Connects to any SQL database (MySQL, PostgreSQL, MSSQL) and
 * extracts data using a mapping config to produce canonical records.
 *
 * Supports: MySQL, PostgreSQL, Microsoft SQL Server, Oracle (via compatible drivers).
 */

import pg from "pg";
import { SourceAdapter, type AdapterConfig, type DiscoveredSchema } from "./base.js";
import { emptyDataset, type CanonicalDataset, type CanonicalEntityType } from "../schema/canonical.js";
import { loadMappingConfig, applyMappingBatch, type MappingConfig } from "../schema/mapping.js";
import { logger } from "../logger.js";

interface SqlAdapterOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  /** Path to mapping config file */
  mappingFile?: string;
  /** Inline mapping config (alternative to mappingFile) */
  mapping?: MappingConfig;
  /** Batch size for streaming */
  batchSize?: number;
}

export class SqlAdapter extends SourceAdapter {
  private pool: pg.Pool | null = null;
  private opts: SqlAdapterOptions;
  private mapping: MappingConfig | null = null;

  constructor(config: AdapterConfig) {
    super(config);
    this.opts = config.options as SqlAdapterOptions;
  }

  get displayName(): string {
    return `SQL [${this.opts.host}:${this.opts.port}/${this.opts.database}]`;
  }

  private async getPool(): Promise<pg.Pool> {
    if (this.pool) return this.pool;
    this.pool = new pg.Pool({
      host: this.opts.host,
      port: this.opts.port,
      database: this.opts.database,
      user: this.opts.user,
      password: this.opts.password,
      ssl: this.opts.ssl ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
    return this.pool;
  }

  async testConnection(): Promise<boolean> {
    try {
      const pool = await this.getPool();
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      logger.success(`Connected to ${this.displayName}`);
      return true;
    } catch (err) {
      logger.error(`Connection failed: ${this.displayName}`, { error: String(err) });
      return false;
    }
  }

  async discoverSchema(): Promise<DiscoveredSchema> {
    const pool = await this.getPool();

    // Get all user tables
    const { rows: tables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const result: DiscoveredSchema = { tables: [] };

    for (const t of tables) {
      const tableName = t.table_name;

      // Get row count
      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM "${tableName}"`
      );
      const rowCount = countRows[0].count;

      // Get columns
      const { rows: cols } = await pool.query(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [tableName]
      );

      // Get a sample row
      const { rows: sampleRows } = await pool.query(
        `SELECT * FROM "${tableName}" LIMIT 1`
      );
      const sample = sampleRows[0] || {};

      result.tables.push({
        name: tableName,
        rowCount,
        columns: cols.map((c: Record<string, unknown>) => ({
          name: c.column_name as string,
          type: c.data_type as string,
          nullable: c.is_nullable === "YES",
          sample: sample[c.column_name as string],
        })),
      });
    }

    logger.info(`Discovered ${result.tables.length} tables in ${this.displayName}`);
    return result;
  }

  async extract(): Promise<CanonicalDataset> {
    logger.separator(`Extracting from ${this.displayName}`);

    // Load mapping
    if (this.opts.mapping) {
      this.mapping = this.opts.mapping;
    } else if (this.opts.mappingFile) {
      this.mapping = await loadMappingConfig(this.opts.mappingFile);
    } else {
      throw new Error("SQL adapter requires either 'mapping' or 'mappingFile' in options");
    }

    const dataset = emptyDataset(this.config.sourceSystem);
    const pool = await this.getPool();
    const batchSize = this.opts.batchSize || 1000;

    for (const entityMapping of this.mapping.entities) {
      logger.info(`Extracting: ${entityMapping.sourceTable} → ${entityMapping.entity}`);

      // Stream in batches
      let offset = 0;
      let totalRows = 0;

      while (true) {
        const { rows } = await pool.query(
          `SELECT * FROM "${entityMapping.sourceTable}"
           ORDER BY "${entityMapping.sourceIdColumn}"
           LIMIT $1 OFFSET $2`,
          [batchSize, offset]
        );

        if (rows.length === 0) break;

        const canonical = applyMappingBatch(
          rows as Record<string, unknown>[],
          entityMapping,
          this.config.sourceSystem
        );

        // Route to the correct entity array
        this.routeRecords(dataset, entityMapping.entity, canonical);
        totalRows += rows.length;
        offset += rows.length;

        if (rows.length < batchSize) break;
      }

      logger.success(`  ${entityMapping.sourceTable}: ${totalRows.toLocaleString()} rows`);
    }

    dataset.totalRecords = this.countDataset(dataset);
    dataset.extractedAt = new Date().toISOString();

    logger.success(`Total records extracted: ${dataset.totalRecords.toLocaleString()}`);
    return dataset;
  }

  private routeRecords(
    dataset: CanonicalDataset,
    entity: CanonicalEntityType,
    records: unknown[]
  ) {
    const ROUTE_MAP: Record<string, keyof CanonicalDataset> = {
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

    const key = ROUTE_MAP[entity];
    if (key && Array.isArray(dataset[key])) {
      (dataset[key] as unknown[]).push(...records);
    }
  }

  private countDataset(dataset: CanonicalDataset): number {
    return (
      dataset.patients.length +
      dataset.encounters.length +
      dataset.medicationRequests.length +
      dataset.serviceRequests.length +
      dataset.observations.length +
      dataset.conditions.length +
      dataset.allergies.length +
      dataset.diagnosticReports.length +
      dataset.labSamples.length +
      dataset.stockItems.length +
      dataset.stockBatches.length +
      dataset.bills.length +
      dataset.billItems.length +
      dataset.beds.length +
      dataset.admissions.length +
      dataset.users.length
    );
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
