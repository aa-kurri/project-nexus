/**
 * Migration Pipeline — Configuration
 *
 * Reads .env and provides typed config for all pipeline stages.
 */

import { config as loadEnv } from "dotenv";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, ".env") });

// ── Schema ──────────────────────────────────────────────────────

const ConfigSchema = z.object({
  // Source DB
  vaidyo: z.object({
    type: z.enum(["mysql", "postgres"]).default("mysql"),
    host: z.string().default("localhost"),
    port: z.coerce.number().default(3306),
    database: z.string(),
    user: z.string(),
    password: z.string(),
    ssl: z
      .string()
      .transform((v) => v === "true")
      .default("false"),
  }),

  // Target (Supabase)
  supabase: z.object({
    url: z.string().url(),
    serviceRoleKey: z.string().min(1),
    dbUrl: z.string().startsWith("postgresql://"),
  }),

  // Migration settings
  migration: z.object({
    tenantId: z.string().uuid().optional(),
    batchSize: z.coerce.number().min(1).max(10_000).default(1000),
    dryRun: z
      .string()
      .transform((v) => v === "true")
      .default("true"),
    stagingDir: z.string().default("./staging"),
    errorsDir: z.string().default("./errors"),
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  }),

  // Attachments
  attachments: z.object({
    sourcePath: z.string().optional(),
    storageBucket: z.string().default("clinical-documents"),
  }),
});

// ── Parse ───────────────────────────────────────────────────────

function parseConfig() {
  return ConfigSchema.parse({
    vaidyo: {
      type: process.env.VAIDYO_DB_TYPE,
      host: process.env.VAIDYO_DB_HOST,
      port: process.env.VAIDYO_DB_PORT,
      database: process.env.VAIDYO_DB_NAME,
      user: process.env.VAIDYO_DB_USER,
      password: process.env.VAIDYO_DB_PASSWORD,
      ssl: process.env.VAIDYO_DB_SSL,
    },
    supabase: {
      url: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      dbUrl: process.env.SUPABASE_DB_URL,
    },
    migration: {
      tenantId: process.env.MIGRATION_TENANT_ID || undefined,
      batchSize: process.env.MIGRATION_BATCH_SIZE,
      dryRun: process.env.MIGRATION_DRY_RUN,
      stagingDir: process.env.MIGRATION_STAGING_DIR,
      errorsDir: process.env.MIGRATION_ERRORS_DIR,
      logLevel: process.env.MIGRATION_LOG_LEVEL,
    },
    attachments: {
      sourcePath: process.env.VAIDYO_ATTACHMENTS_PATH || undefined,
      storageBucket: process.env.SUPABASE_STORAGE_BUCKET,
    },
  });
}

export type MigrationConfig = z.infer<typeof ConfigSchema>;

let _config: MigrationConfig | null = null;

export function getConfig(): MigrationConfig {
  if (!_config) {
    _config = parseConfig();
  }
  return _config;
}

/**
 * Override config values (used by CLI args like --dry-run, --tenant-id, --batch-size).
 */
export function applyOverrides(overrides: {
  dryRun?: boolean;
  tenantId?: string;
  batchSize?: number;
}): void {
  const cfg = getConfig();
  if (overrides.dryRun !== undefined)
    cfg.migration.dryRun = overrides.dryRun;
  if (overrides.tenantId)
    cfg.migration.tenantId = overrides.tenantId;
  if (overrides.batchSize)
    cfg.migration.batchSize = overrides.batchSize;
}
