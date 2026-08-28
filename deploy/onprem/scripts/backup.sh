#!/usr/bin/env bash
# Backs up the database, clinical file storage, and deployment metadata into
# a single timestamped, checksummed folder. Safe to run while the stack is
# up — pg_dump takes a consistent snapshot without blocking writers.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPT_DIR}/.."
cd "$COMPOSE_DIR"

# shellcheck disable=SC1091
[ -f .env ] && set -a && source .env && set +a

BACKUP_ROOT="${BACKUP_DIR:-./backup}"
TIMESTAMP="$(date -u +%Y-%m-%d_%H%M%S)"
BACKUP_PATH="${BACKUP_ROOT}/${TIMESTAMP}"
mkdir -p "$BACKUP_PATH"

echo "=== CameroHealth backup: ${TIMESTAMP} ==="

echo "-> Dumping database..."
docker compose exec -T postgres pg_dump -U "${DB_USER:-camerohealth}" "${DB_NAME:-camerohealth}" \
  | gzip > "${BACKUP_PATH}/database.sql.gz"

echo "-> Copying clinical file storage..."
mkdir -p "${BACKUP_PATH}/minio"
docker run --rm \
  -v camerohealth_minio_data:/data:ro \
  -v "$(cd "$BACKUP_PATH" && pwd)/minio:/backup" \
  alpine sh -c "cp -a /data/. /backup/ 2>/dev/null || true"

echo "-> Writing metadata..."
cat > "${BACKUP_PATH}/metadata.json" <<EOF
{
  "hospitalId": "${HOSPITAL_ID:-unknown}",
  "hospitalName": "${HOSPITAL_NAME:-unknown}",
  "version": "${CAMEROHEALTH_VERSION:-unknown}",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": "postgresql",
  "storage": "minio"
}
EOF

echo "-> Generating checksums..."
(
  cd "$BACKUP_PATH"
  find . -type f ! -name "manifest.sha256" -exec sha256sum {} \; > manifest.sha256
)

echo "-> Applying retention (keeping last ${BACKUP_RETENTION_DAILY:-7} days)..."
# Simple time-based retention: anything older than BACKUP_RETENTION_DAILY
# days is pruned. This is not full daily/weekly/monthly tiering (that needs
# a manifest tracking which backups were promoted to "weekly"/"monthly") —
# documented as a known simplification in docs/onprem/BACKUP-RESTORE.md.
find "$BACKUP_ROOT" -maxdepth 1 -mindepth 1 -type d -mtime "+${BACKUP_RETENTION_DAILY:-7}" -exec rm -rf {} \;

echo "=== Backup complete: ${BACKUP_PATH} ==="
du -sh "$BACKUP_PATH"
