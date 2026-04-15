#!/usr/bin/env bash
# =============================================================================
# Ayura OS — Nightly PostgreSQL Backup (S-BACKUP-1)
#
# Usage:
#   ./scripts/backup.sh
#
# Required environment variables:
#   SUPABASE_DB_URL      Full postgres:// connection string (from Supabase dashboard
#                        Settings → Database → Connection string → URI)
#   RCLONE_REMOTE        rclone remote name + bucket path, e.g. "s3:ayura-backups"
#
# Optional environment variables:
#   BACKUP_RETAIN_DAYS   How many days of backups to keep in the bucket (default: 90)
#   BACKUP_DIR           Local staging directory (default: /tmp/ayura-backups)
#   SLACK_WEBHOOK_URL    If set, posts a success/failure notification to Slack
# =============================================================================
set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/tmp/ayura-backups}"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-90}"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
DUMP_FILE="${BACKUP_DIR}/ayura_${TIMESTAMP}.dump"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# ── Validation ───────────────────────────────────────────────────────────────
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "ERROR: SUPABASE_DB_URL is not set." >&2
  exit 1
fi

if [[ -z "${RCLONE_REMOTE:-}" ]]; then
  echo "ERROR: RCLONE_REMOTE is not set (e.g. 's3:ayura-backups')." >&2
  exit 1
fi

# ── Helpers ──────────────────────────────────────────────────────────────────
log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "${LOG_FILE}"
}

slack_notify() {
  local status="$1"
  local message="$2"
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    local color
    color=$([[ "$status" == "success" ]] && echo "#0F766E" || echo "#DC2626")
    curl -s -X POST "${SLACK_WEBHOOK_URL}" \
      -H "Content-Type: application/json" \
      -d "{\"attachments\":[{\"color\":\"${color}\",\"text\":\"${message}\"}]}" \
      >/dev/null || true
  fi
}

# ── Setup ────────────────────────────────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"
log "=== Ayura OS nightly backup started ==="
log "Timestamp : ${TIMESTAMP}"
log "Dump file : ${DUMP_FILE}"
log "Remote    : ${RCLONE_REMOTE}"

# ── pg_dump ──────────────────────────────────────────────────────────────────
log "Running pg_dump (custom format, compressed)…"
pg_dump \
  --dbname="${SUPABASE_DB_URL}" \
  --format=custom \
  --compress=9 \
  --no-password \
  --verbose \
  --file="${DUMP_FILE}" \
  2>>"${LOG_FILE}"

DUMP_SIZE=$(du -sh "${DUMP_FILE}" | cut -f1)
log "pg_dump complete. Size: ${DUMP_SIZE}"

# ── Checksum ─────────────────────────────────────────────────────────────────
SHA256=$(sha256sum "${DUMP_FILE}" | awk '{print $1}')
echo "${SHA256}  ayura_${TIMESTAMP}.dump" > "${DUMP_FILE}.sha256"
log "SHA-256: ${SHA256}"

# ── Upload via rclone ─────────────────────────────────────────────────────────
log "Uploading dump to ${RCLONE_REMOTE}/daily/…"
rclone copy \
  "${DUMP_FILE}" \
  "${RCLONE_REMOTE}/daily/" \
  --progress \
  2>>"${LOG_FILE}"

rclone copy \
  "${DUMP_FILE}.sha256" \
  "${RCLONE_REMOTE}/daily/" \
  2>>"${LOG_FILE}"

log "Upload complete."

# ── Upload log ───────────────────────────────────────────────────────────────
rclone copy \
  "${LOG_FILE}" \
  "${RCLONE_REMOTE}/logs/" \
  2>/dev/null || true

# ── Prune old backups ─────────────────────────────────────────────────────────
log "Pruning backups older than ${RETAIN_DAYS} days from ${RCLONE_REMOTE}/daily/…"
rclone delete \
  "${RCLONE_REMOTE}/daily/" \
  --min-age "${RETAIN_DAYS}d" \
  2>>"${LOG_FILE}" || true
log "Prune complete."

# ── Quarterly drill marker ────────────────────────────────────────────────────
# Every backup tagged in the last day of the quarter gets a "quarterly" copy
# so restore-drill.sh can locate the most recent quarterly snapshot easily.
MONTH=$(date -u +"%m")
DAY=$(date -u +"%d")
# Quarters end: Mar-31, Jun-30, Sep-30, Dec-31
if { [[ "$MONTH" == "03" && "$DAY" == "31" ]] || \
     [[ "$MONTH" == "06" && "$DAY" == "30" ]] || \
     [[ "$MONTH" == "09" && "$DAY" == "30" ]] || \
     [[ "$MONTH" == "12" && "$DAY" == "31" ]]; }; then
  log "Quarter-end detected — tagging backup as quarterly snapshot."
  rclone copy \
    "${DUMP_FILE}" \
    "${RCLONE_REMOTE}/quarterly/" \
    --progress \
    2>>"${LOG_FILE}"
  rclone copy \
    "${DUMP_FILE}.sha256" \
    "${RCLONE_REMOTE}/quarterly/" \
    2>>"${LOG_FILE}"
  log "Quarterly snapshot uploaded."
fi

# ── Cleanup local staging ─────────────────────────────────────────────────────
rm -f "${DUMP_FILE}" "${DUMP_FILE}.sha256"
log "Local staging files removed."

# ── Done ─────────────────────────────────────────────────────────────────────
log "=== Backup finished successfully ==="
slack_notify "success" ":white_check_mark: *Ayura OS* nightly backup completed | ${TIMESTAMP} | size: ${DUMP_SIZE} | remote: \`${RCLONE_REMOTE}\`"
