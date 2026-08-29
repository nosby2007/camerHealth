#!/usr/bin/env bash
# Restores a backup created by backup.sh. Destructive — requires typing
# the exact confirmation phrase. Never deletes the current installation
# before the backup's integrity has been verified.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPT_DIR}/.."
cd "$COMPOSE_DIR"

# shellcheck disable=SC1091
[ -f .env ] && set -a && source .env && set +a

BACKUP_PATH="${1:-}"
if [ -z "$BACKUP_PATH" ] || [ ! -d "$BACKUP_PATH" ]; then
  echo "Usage: $0 <path-to-backup-folder>" >&2
  echo "Available backups:" >&2
  ls -1 "${BACKUP_DIR:-./backup}" 2>/dev/null >&2 || true
  exit 1
fi

echo "=== CameroHealth restore ==="
echo "Backup: ${BACKUP_PATH}"
[ -f "${BACKUP_PATH}/metadata.json" ] && cat "${BACKUP_PATH}/metadata.json"

echo
echo "-> Verifying backup integrity (SHA-256)..."
if [ ! -f "${BACKUP_PATH}/manifest.sha256" ]; then
  echo "error: manifest.sha256 not found — refusing to restore an unverifiable backup." >&2
  exit 1
fi
(
  cd "$BACKUP_PATH"
  sha256sum -c manifest.sha256 --quiet
) || { echo "error: checksum verification FAILED — backup is corrupt or tampered. Aborting." >&2; exit 1; }
echo "   Integrity verified."

echo
echo "THIS WILL REPLACE THE CURRENT DATABASE AND FILE STORAGE."
echo "Current data will not be deleted until the restore completes successfully."
read -rp "Type RESTORE to continue: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted — confirmation did not match."
  exit 1
fi

echo "-> Stopping write traffic (api)..."
docker compose stop api

echo "-> Restoring database..."
gunzip -c "${BACKUP_PATH}/database.sql.gz" | docker compose exec -T postgres psql -U "${DB_USER:-camerohealth}" -d "${DB_NAME:-camerohealth}"

echo "-> Restoring file storage..."
if [ -d "${BACKUP_PATH}/minio" ]; then
  docker run --rm \
    -v camerohealth_minio_data:/data \
    -v "$(cd "${BACKUP_PATH}/minio" && pwd):/backup:ro" \
    alpine sh -c "cp -a /backup/. /data/"
fi

echo "-> Restarting services..."
docker compose up -d

echo "-> Waiting for services to become healthy..."
sleep 5
"${SCRIPT_DIR}/healthcheck.sh" || {
  echo "warning: post-restore health check reported issues — inspect logs with 'docker compose logs'." >&2
  exit 1
}

echo "=== Restore complete ==="
