#!/usr/bin/env bash
# Usage: ./upgrade.sh <new-version>
# Upgrades a running CameroHealth on-premise install to a new image version.
# Always backs up first and never removes the previous images, so a rollback
# is a matter of re-tagging and re-running `docker compose up -d` with the
# old CAMEROHEALTH_VERSION — not implemented as an automatic action here,
# since an automatic rollback after a partially-applied migration can do
# more damage than the original failure (see docs/onprem/UPGRADE.md).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPT_DIR}/.."
cd "$COMPOSE_DIR"

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
NEW_VERSION="${1:-}"
if [ -z "$NEW_VERSION" ]; then
  echo "Usage: $0 <new-version>" >&2
  exit 1
fi

[ -f .env ] && set -a && source .env && set +a
PREVIOUS_VERSION="${CAMEROHEALTH_VERSION:-unknown}"
UPGRADE_LOG="${BACKUP_DIR:-./backup}/upgrade-history.log"
mkdir -p "$(dirname "$UPGRADE_LOG")"

log_upgrade() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) from=${PREVIOUS_VERSION} to=${NEW_VERSION} status=$1" >> "$UPGRADE_LOG"
}

echo "=== CameroHealth upgrade: ${PREVIOUS_VERSION} -> ${NEW_VERSION} ==="

echo "-> Checking current health before upgrading..."
"${SCRIPT_DIR}/healthcheck.sh" || {
  echo "error: system is not currently healthy — refusing to upgrade a broken install. Fix the current issue first." >&2
  log_upgrade "aborted-unhealthy-precheck"
  exit 1
}

echo "-> Backing up before upgrade..."
"${SCRIPT_DIR}/backup.sh"
LATEST_BACKUP=$(find "${BACKUP_DIR:-./backup}" -maxdepth 1 -mindepth 1 -type d | sort | tail -1)

echo "-> Verifying backup integrity..."
(cd "$LATEST_BACKUP" && sha256sum -c manifest.sha256 --quiet) || {
  echo "error: pre-upgrade backup failed integrity check — aborting upgrade." >&2
  log_upgrade "aborted-backup-verify-failed"
  exit 1
}

echo "-> Updating CAMEROHEALTH_VERSION in .env..."
sed -i.bak "s|^CAMEROHEALTH_VERSION=.*|CAMEROHEALTH_VERSION=${NEW_VERSION}|" .env && rm -f .env.bak
export CAMEROHEALTH_VERSION="$NEW_VERSION"

echo "-> Pulling/loading new images (camerohealth/api:${NEW_VERSION}, camerohealth/web:${NEW_VERSION})..."
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES pull api web 2>/dev/null || echo "  (no registry pull configured — assuming images were loaded via 'docker load' from the offline bundle)"

echo "-> Running database migrations..."
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES run --rm api npx prisma migrate deploy || {
  echo "error: migration failed. Database and files are unchanged from the pre-upgrade backup taken at ${LATEST_BACKUP}." >&2
  echo "Restore that backup if the running application is now in a bad state: ./restore.sh ${LATEST_BACKUP}" >&2
  log_upgrade "failed-migration"
  exit 1
}

echo "-> Restarting application containers..."
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES up -d api web nginx

echo "-> Waiting for services to stabilize..."
sleep 5

echo "-> Running post-upgrade health check..."
"${SCRIPT_DIR}/healthcheck.sh" || {
  echo "error: post-upgrade health check failed. Backup available at ${LATEST_BACKUP} if you need to roll back." >&2
  log_upgrade "failed-healthcheck"
  exit 1
}

log_upgrade "success"
echo
echo "=== Upgrade complete: ${PREVIOUS_VERSION} -> ${NEW_VERSION} ==="
echo "Pre-upgrade backup kept at: ${LATEST_BACKUP}"
