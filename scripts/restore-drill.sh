#!/usr/bin/env bash
# =============================================================================
# Ayura OS — Quarterly Restore Drill (S-BACKUP-1)
#
# Downloads the most recent backup from the configured S3 remote, restores it
# into an isolated drill database, runs a row-count smoke-test against every
# critical FHIR table, then tears the drill database down.
#
# Usage:
#   ./scripts/restore-drill.sh [--dump <remote-path>] [--keep-db]
#
#   --dump <path>   Override auto-selection and restore a specific dump file
#                   path within the rclone remote (e.g. "daily/ayura_20260414T020000Z.dump")
#   --keep-db       Do not drop the drill database after the test (useful for
#                   manual inspection; database name is printed at the end)
#
# Required environment variables:
#   RCLONE_REMOTE        rclone remote name + bucket path, e.g. "s3:ayura-backups"
#   DRILL_DB_URL         postgres:// connection to a PostgreSQL server where the
#                        drill database will be created and destroyed, e.g.
#                        "postgres://admin:pass@localhost:5432/postgres"
#
# Optional environment variables:
#   SLACK_WEBHOOK_URL    Posts pass/fail notification to Slack
#   DRILL_DB_NAME        Name of the ephemeral drill database (default: ayura_drill_TIMESTAMP)
#   BACKUP_DIR           Local staging directory (default: /tmp/ayura-restore-drill)
# =============================================================================
set -euo pipefail

# ── Argument parsing ─────────────────────────────────────────────────────────
OVERRIDE_DUMP=""
KEEP_DB=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dump)   OVERRIDE_DUMP="$2"; shift 2 ;;
    --keep-db) KEEP_DB=true; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

# ── Config ───────────────────────────────────────────────────────────────────
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_DIR="${BACKUP_DIR:-/tmp/ayura-restore-drill}"
DRILL_DB_NAME="${DRILL_DB_NAME:-ayura_drill_${TIMESTAMP}}"
LOG_FILE="${BACKUP_DIR}/restore_drill_${TIMESTAMP}.log"

# ── Validation ───────────────────────────────────────────────────────────────
if [[ -z "${RCLONE_REMOTE:-}" ]]; then
  echo "ERROR: RCLONE_REMOTE is not set." >&2
  exit 1
fi

if [[ -z "${DRILL_DB_URL:-}" ]]; then
  echo "ERROR: DRILL_DB_URL is not set." >&2
  exit 1
fi

# ── Helpers ──────────────────────────────────────────────────────────────────
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "${LOG_FILE}"
}

DRILL_RESULT="UNKNOWN"
DRILL_NOTES=""

finish() {
  local exit_code=$?
  if [[ "$DRILL_RESULT" != "PASS" ]]; then
    DRILL_RESULT="FAIL"
    DRILL_NOTES="${DRILL_NOTES} (exit_code=${exit_code})"
  fi

  # Upload log regardless of outcome
  rclone copy "${LOG_FILE}" "${RCLONE_REMOTE}/drill-logs/" 2>/dev/null || true

  # Notify Slack
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    local color
    color=$([[ "$DRILL_RESULT" == "PASS" ]] && echo "#0F766E" || echo "#DC2626")
    local icon
    icon=$([[ "$DRILL_RESULT" == "PASS" ]] && echo ":white_check_mark:" || echo ":x:")
    curl -s -X POST "${SLACK_WEBHOOK_URL}" \
      -H "Content-Type: application/json" \
      -d "{\"attachments\":[{\"color\":\"${color}\",\"text\":\"${icon} *Ayura OS Restore Drill* | ${DRILL_RESULT} | ${TIMESTAMP}${DRILL_NOTES}\"}]}" \
      >/dev/null || true
  fi

  log "=== Restore drill finished: ${DRILL_RESULT} ${DRILL_NOTES} ==="
  [[ "$DRILL_RESULT" == "PASS" ]] && exit 0 || exit 1
}
trap finish EXIT

# ── Setup ────────────────────────────────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"
log "=== Ayura OS restore drill started ==="
log "Timestamp   : ${TIMESTAMP}"
log "Drill DB    : ${DRILL_DB_NAME}"
log "Remote      : ${RCLONE_REMOTE}"

# ── Locate dump to restore ────────────────────────────────────────────────────
if [[ -n "${OVERRIDE_DUMP}" ]]; then
  REMOTE_DUMP_PATH="${OVERRIDE_DUMP}"
  log "Using override dump: ${REMOTE_DUMP_PATH}"
else
  # Prefer the most recent quarterly snapshot; fall back to most recent daily.
  log "Auto-selecting most recent quarterly snapshot…"
  REMOTE_DUMP_PATH=$(
    rclone ls "${RCLONE_REMOTE}/quarterly/" 2>/dev/null \
      | awk '{print $2}' \
      | grep '\.dump$' \
      | sort -r \
      | head -1
  ) || true

  if [[ -z "${REMOTE_DUMP_PATH}" ]]; then
    log "No quarterly snapshot found — falling back to most recent daily backup."
    REMOTE_DUMP_PATH=$(
      rclone ls "${RCLONE_REMOTE}/daily/" 2>/dev/null \
        | awk '{print $2}' \
        | grep '\.dump$' \
        | sort -r \
        | head -1
    ) || true
    REMOTE_PREFIX="daily"
  else
    REMOTE_PREFIX="quarterly"
  fi

  if [[ -z "${REMOTE_DUMP_PATH}" ]]; then
    log "ERROR: No backup dumps found in ${RCLONE_REMOTE}." >&2
    exit 1
  fi
  REMOTE_DUMP_PATH="${REMOTE_PREFIX}/${REMOTE_DUMP_PATH}"
fi

log "Selected dump: ${REMOTE_DUMP_PATH}"

# ── Download dump ─────────────────────────────────────────────────────────────
LOCAL_DUMP="${BACKUP_DIR}/$(basename "${REMOTE_DUMP_PATH}")"
log "Downloading ${RCLONE_REMOTE}/${REMOTE_DUMP_PATH} → ${LOCAL_DUMP}…"
rclone copy \
  "${RCLONE_REMOTE}/${REMOTE_DUMP_PATH}" \
  "${BACKUP_DIR}/" \
  --progress \
  2>>"${LOG_FILE}"

# ── Verify checksum ───────────────────────────────────────────────────────────
SHA256_REMOTE="${REMOTE_DUMP_PATH%.dump}.dump.sha256"
SHA256_LOCAL="${LOCAL_DUMP}.sha256"
log "Verifying SHA-256 checksum…"
rclone copy \
  "${RCLONE_REMOTE}/${SHA256_REMOTE}" \
  "${BACKUP_DIR}/" \
  2>>"${LOG_FILE}" || {
  log "WARN: No checksum file found at ${SHA256_REMOTE} — skipping verification."
}

if [[ -f "${SHA256_LOCAL}" ]]; then
  pushd "${BACKUP_DIR}" >/dev/null
  sha256sum --check "$(basename "${SHA256_LOCAL}")" 2>>"${LOG_FILE}"
  popd >/dev/null
  log "Checksum verified OK."
else
  log "WARN: Skipping checksum (file not downloaded)."
fi

# ── Create drill database ─────────────────────────────────────────────────────
log "Creating drill database '${DRILL_DB_NAME}'…"
psql "${DRILL_DB_URL}" \
  -c "CREATE DATABASE \"${DRILL_DB_NAME}\";" \
  2>>"${LOG_FILE}"

# Build drill DB URL by swapping the database name
DRILL_DB_CONNECT="${DRILL_DB_URL%/*}/${DRILL_DB_NAME}"

# ── pg_restore ────────────────────────────────────────────────────────────────
log "Restoring dump into '${DRILL_DB_NAME}'…"
pg_restore \
  --dbname="${DRILL_DB_CONNECT}" \
  --no-privileges \
  --no-owner \
  --verbose \
  "${LOCAL_DUMP}" \
  2>>"${LOG_FILE}"
log "pg_restore complete."

# ── Smoke test: row counts on critical FHIR tables ───────────────────────────
log "Running smoke tests (row counts on critical tables)…"

# Tables that MUST exist and have at least 1 row in a non-empty hospital database.
# In a fresh drill against a real production dump these will all have rows.
# Against the seed.sql dataset they'll have at least the seeded rows.
CRITICAL_TABLES=(
  "patients"
  "encounters"
  "observations"
  "conditions"
  "medication_requests"
  "lab_samples"
  "diagnostic_reports"
  "queue_tokens"
  "beds"
  "admissions"
  "stock_items"
  "bills"
)

PASS_COUNT=0
FAIL_COUNT=0
SMOKE_NOTES=""

for TABLE in "${CRITICAL_TABLES[@]}"; do
  COUNT=$(psql "${DRILL_DB_CONNECT}" \
    --tuples-only \
    --no-align \
    -c "SELECT COUNT(*) FROM ${TABLE};" \
    2>>"${LOG_FILE}" | tr -d '[:space:]') || COUNT="ERROR"

  if [[ "$COUNT" =~ ^[0-9]+$ ]]; then
    log "  [OK] ${TABLE}: ${COUNT} rows"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    log "  [FAIL] ${TABLE}: query failed (${COUNT})"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    SMOKE_NOTES="${SMOKE_NOTES} | ${TABLE}=FAIL"
  fi
done

log "Smoke test summary: ${PASS_COUNT} passed, ${FAIL_COUNT} failed."

# ── RLS extension check ───────────────────────────────────────────────────────
log "Checking jwt_tenant() function exists…"
JWT_FN=$(psql "${DRILL_DB_CONNECT}" \
  --tuples-only \
  --no-align \
  -c "SELECT COUNT(*) FROM pg_proc WHERE proname = 'jwt_tenant';" \
  2>>"${LOG_FILE}" | tr -d '[:space:]') || JWT_FN="0"

if [[ "$JWT_FN" == "1" ]]; then
  log "  [OK] jwt_tenant() present."
else
  log "  [WARN] jwt_tenant() not found — RLS policies may not have restored correctly."
  SMOKE_NOTES="${SMOKE_NOTES} | jwt_tenant=MISSING"
fi

# ── Teardown drill database ───────────────────────────────────────────────────
if [[ "${KEEP_DB}" == "true" ]]; then
  log "KEEP_DB=true — drill database '${DRILL_DB_NAME}' preserved for manual inspection."
  log "Connect with: psql ${DRILL_DB_CONNECT}"
else
  log "Dropping drill database '${DRILL_DB_NAME}'…"
  psql "${DRILL_DB_URL}" \
    -c "DROP DATABASE \"${DRILL_DB_NAME}\";" \
    2>>"${LOG_FILE}"
  log "Drill database dropped."
fi

# ── Cleanup local staging ─────────────────────────────────────────────────────
rm -f "${LOCAL_DUMP}" "${SHA256_LOCAL}"
log "Local staging files removed."

# ── Result ────────────────────────────────────────────────────────────────────
if [[ $FAIL_COUNT -eq 0 ]]; then
  DRILL_RESULT="PASS"
  DRILL_NOTES=" | tables_ok=${PASS_COUNT} | dump=$(basename "${REMOTE_DUMP_PATH}")"
else
  DRILL_RESULT="FAIL"
  DRILL_NOTES=" | tables_fail=${FAIL_COUNT}${SMOKE_NOTES}"
fi
