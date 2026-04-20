# Ayura OS — Universal Migration Framework

> Migrate **any hospital** from **any HMS** into Ayura OS seamlessly.

## Design Philosophy

1. **Source-agnostic** — Pluggable adapters for any system (Vaidyo, Practo, HIS, Bahmni, OpenMRS, custom software, or even Excel spreadsheets)
2. **Schema-driven** — Hospitals define a simple YAML mapping: "my column" → "Ayura column"
3. **Multi-format** — Supports direct DB connections, CSV/Excel uploads, JSON dumps, REST APIs, and HL7 FHIR bundles
4. **Safe** — Idempotent loads, checksums, dry-run mode, full audit trail
5. **Self-service** — Non-technical hospital staff can use the CSV/Excel path with guided mapping

## Supported Source Types

| Source | Adapter | Input |
|---|---|---|
| **Any SQL Database** | `sql` | Direct DB connection (MySQL, PostgreSQL, MSSQL, Oracle) |
| **CSV / Excel** | `file` | Upload `.csv` or `.xlsx` files per entity |
| **JSON Dump** | `file` | Upload `.json` files per entity |
| **REST API** | `api` | Point at an existing HMS API |
| **FHIR R4 Bundle** | `fhir` | Import standard FHIR bundles (from ABDM, OpenMRS, etc.) |
| **HL7v2 Messages** | `hl7` | Parse HL7v2 ADT/ORU/ORM messages |

## Quick Start

### Path A: Excel / CSV Migration (Easiest)

```bash
# 1. Download empty templates
npx tsx run.ts templates --output ./hospital-data/

# 2. Hospital fills in the templates (patients.csv, visits.csv, etc.)

# 3. Run migration
npx tsx run.ts --source=file --input=./hospital-data/ --tenant-id=<uuid> --dry-run
```

### Path B: Direct Database Migration

```bash
# 1. Configure connections
cp .env.example .env
# Fill in SOURCE_* and SUPABASE_* credentials

# 2. Auto-detect schema & generate mapping
npx tsx run.ts discover --source=sql

# 3. Review & adjust the generated mapping.yaml

# 4. Run migration
npx tsx run.ts --source=sql --mapping=./mapping.yaml --tenant-id=<uuid>
```

### Path C: FHIR Bundle Import

```bash
npx tsx run.ts --source=fhir --input=./fhir-bundle.json --tenant-id=<uuid>
```

## Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    ANY SOURCE SYSTEM                          │
│  SQL DB │ CSV/Excel │ JSON │ REST API │ FHIR │ HL7 Messages  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │ Adapter │  ← Pluggable source adapters
                    └────┬────┘
                         │
              ┌──────────▼──────────┐
              │  Universal Schema   │  ← Common intermediate format
              │  (Canonical IR)     │     aligned with FHIR R4
              └──────────┬──────────┘
                         │
                  ┌──────▼──────┐
                  │  Validator  │  ← Zod schemas, ref checks
                  └──────┬──────┘
                         │
              ┌──────────▼──────────┐
              │   Ayura OS Loader   │  ← Batch upsert to Supabase
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │    Verification     │  ← Counts, checksums, report
              └─────────────────────┘
```

## File Structure

```
scripts/migration/
├── adapters/                    # Source-specific adapters
│   ├── base.ts                  # Abstract adapter interface
│   ├── sql.ts                   # SQL database adapter (MySQL/PG/MSSQL)
│   ├── file.ts                  # CSV / Excel / JSON file adapter
│   ├── fhir.ts                  # FHIR R4 bundle adapter
│   └── api.ts                   # REST API adapter
├── schema/
│   ├── canonical.ts             # Universal intermediate representation
│   ├── validators.ts            # Zod validation for all entities
│   └── mapping.ts               # YAML mapping config parser
├── templates/                   # Empty CSV/Excel templates for hospitals
│   ├── patients.csv
│   ├── visits.csv
│   ├── prescriptions.csv
│   ├── lab_orders.csv
│   ├── inventory.csv
│   ├── invoices.csv
│   └── users.csv
├── loader.ts                    # Universal Supabase loader
├── verifier.ts                  # Post-load verification
├── config.ts                    # Environment config
├── db.ts                        # Database connectors
├── id_map.ts                    # Legacy ↔ Ayura ID mapping
├── logger.ts                    # Structured logging
├── types.ts                     # TypeScript definitions
├── run.ts                       # CLI entry point
└── mapping.example.yaml         # Example mapping config
```
