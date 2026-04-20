/**
 * Migration Pipeline — Database Connectors
 *
 * Provides unified read access to the legacy Vaidyo database (MySQL or PG)
 * and write access to the Ayura OS Supabase instance.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import pg from "pg";
import { getConfig, type MigrationConfig } from "./config.js";
import { logger } from "./logger.js";

// ── Legacy DB (read-only) ──────────────────────────────────────

let _legacyPool: pg.Pool | null = null;

/**
 * Get a connection pool to the legacy Vaidyo database.
 * Supports both MySQL (via mysql2) and PostgreSQL (via pg).
 * Currently implements PG — extend with mysql2 adapter if needed.
 */
export async function getLegacyPool(): Promise<pg.Pool> {
  if (_legacyPool) return _legacyPool;

  const cfg = getConfig().vaidyo;

  if (cfg.type === "mysql") {
    // For MySQL sources, we use a PG-compatible interface via a thin adapter.
    // In practice, swap this for mysql2 pool.
    logger.warn(
      "MySQL source detected — ensure mysql2 adapter is configured. " +
        "Falling back to PG connector for now."
    );
  }

  _legacyPool = new pg.Pool({
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    ssl: cfg.ssl ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  // Verify connectivity
  const client = await _legacyPool.connect();
  const res = await client.query("SELECT current_database() AS db");
  logger.info(`Connected to legacy DB: ${res.rows[0].db}`);
  client.release();

  return _legacyPool;
}

/**
 * Stream rows from a legacy table in batches.
 */
export async function* streamLegacyTable<T extends Record<string, unknown>>(
  table: string,
  batchSize: number = 1000,
  orderBy: string = "id"
): AsyncGenerator<T[], void, unknown> {
  const pool = await getLegacyPool();
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { rows } = await pool.query<T>(
      `SELECT * FROM ${table} ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [batchSize, offset]
    );

    if (rows.length === 0) {
      hasMore = false;
    } else {
      yield rows;
      offset += rows.length;
      if (rows.length < batchSize) hasMore = false;
    }
  }
}

/**
 * Get total row count for a legacy table.
 */
export async function getLegacyCount(table: string): Promise<number> {
  const pool = await getLegacyPool();
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return rows[0].count;
}

// ── Supabase (write target) ─────────────────────────────────────

let _supabase: SupabaseClient | null = null;
let _supabasePg: pg.Pool | null = null;

/**
 * Get the Supabase client (uses service_role key to bypass RLS).
 */
export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const cfg = getConfig().supabase;
  _supabase = createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  logger.info(`Supabase client initialized: ${cfg.url}`);
  return _supabase;
}

/**
 * Get a direct PG pool to the Supabase database (for bulk operations).
 */
export async function getSupabasePg(): Promise<pg.Pool> {
  if (_supabasePg) return _supabasePg;

  const cfg = getConfig().supabase;
  _supabasePg = new pg.Pool({
    connectionString: cfg.dbUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  const client = await _supabasePg.connect();
  const res = await client.query("SELECT current_database() AS db");
  logger.info(`Connected to Supabase PG: ${res.rows[0].db}`);
  client.release();

  return _supabasePg;
}

/**
 * Get row count from Supabase target table.
 */
export async function getTargetCount(table: string): Promise<number> {
  const pool = await getSupabasePg();
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM public.${table}`
  );
  return rows[0].count;
}

// ── Cleanup ────────────────────────────────────────────────────

export async function closeAll(): Promise<void> {
  if (_legacyPool) await _legacyPool.end();
  if (_supabasePg) await _supabasePg.end();
  logger.info("All database connections closed");
}
