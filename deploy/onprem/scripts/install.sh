#!/usr/bin/env bash
# CameroHealth On-Premise installer.
# Usage: sudo ./install.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPT_DIR}/.."
cd "$COMPOSE_DIR"

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
FAILED_STEP=""

fail() {
  FAILED_STEP="$1"
  echo
  echo "========================================"
  echo "CAMEROHEALTH INSTALLATION FAILED"
  echo "Step: ${FAILED_STEP}"
  echo "========================================"
  exit 1
}

step() { echo; echo "==> $1"; }

# ── 1-2. OS detection ────────────────────────────────────────────────────────
step "Checking operating system"
if [ "$(uname -s)" != "Linux" ]; then
  echo "warning: this installer is written for Linux (tested on Ubuntu Server)." \
       "Continuing, but you are on your own for OS-specific quirks." >&2
fi

# ── 3. Docker ────────────────────────────────────────────────────────────────
step "Checking Docker"
command -v docker >/dev/null 2>&1 || fail "Docker is not installed. Install Docker first: https://docs.docker.com/engine/install/"
docker info >/dev/null 2>&1 || fail "Docker is installed but the daemon is not running (or you lack permission — try running as root/with sudo, or add your user to the 'docker' group)."

# ── 4. Docker Compose ────────────────────────────────────────────────────────
step "Checking Docker Compose"
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 plugin not found. Install it: https://docs.docker.com/compose/install/"

# ── 5. RAM ───────────────────────────────────────────────────────────────────
step "Checking available RAM"
TOTAL_MEM_MB=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo 0)
if [ "$TOTAL_MEM_MB" -gt 0 ] && [ "$TOTAL_MEM_MB" -lt 3500 ]; then
  echo "warning: ${TOTAL_MEM_MB}MB RAM detected. 4GB+ is recommended for Postgres + MinIO + API together." >&2
else
  echo "  ${TOTAL_MEM_MB}MB RAM available."
fi

# ── 6. Disk ──────────────────────────────────────────────────────────────────
step "Checking available disk space"
AVAIL_DISK_GB=$(df -BG --output=avail . 2>/dev/null | tail -1 | tr -dc '0-9' || echo 0)
if [ "$AVAIL_DISK_GB" -gt 0 ] && [ "$AVAIL_DISK_GB" -lt 20 ]; then
  echo "warning: only ${AVAIL_DISK_GB}GB free. 20GB+ is recommended (clinical files and backups grow over time)." >&2
else
  echo "  ${AVAIL_DISK_GB}GB free."
fi

# ── 7. Ports ─────────────────────────────────────────────────────────────────
step "Checking required ports are free"
[ -f .env ] && set -a && source .env 2>/dev/null && set +a || true
for port in "${HTTP_PORT:-80}" "${HTTPS_PORT:-443}"; do
  if command -v ss >/dev/null 2>&1 && ss -ltn "sport = :${port}" 2>/dev/null | grep -q ":${port}"; then
    fail "Port ${port} is already in use. Free it or change HTTP_PORT/HTTPS_PORT in .env."
  fi
done
echo "  Ports ${HTTP_PORT:-80} and ${HTTPS_PORT:-443} are free."

# ── 8. Validate .env ─────────────────────────────────────────────────────────
step "Validating .env"
if [ ! -f .env ]; then
  echo "  No .env found — creating one from .env.example."
  cp .env.example .env
fi

# ── 9. Generate missing secrets ──────────────────────────────────────────────
step "Generating missing secrets"
"${SCRIPT_DIR}/generate-secrets.sh"
set -a && source .env && set +a

if [ -z "${HOSPITAL_NAME:-}" ] || [ -z "${HOSPITAL_ID:-}" ]; then
  echo "warning: HOSPITAL_NAME/HOSPITAL_ID are not set in .env — you can set them now" \
       "or complete them in the first-run hospital setup wizard after install." >&2
fi

# ── 10. Required folders ─────────────────────────────────────────────────────
step "Creating required folders"
mkdir -p "${BACKUP_DIR:-./backup}" nginx/certs

# ── 11. Build/pull images ────────────────────────────────────────────────────
step "Building/pulling Docker images"
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES build || fail "Image build failed"

# ── 12-13. Start PostgreSQL, wait for health ─────────────────────────────────
step "Starting PostgreSQL"
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES up -d postgres || fail "PostgreSQL failed to start"
step "Waiting for PostgreSQL to become healthy"
for i in $(seq 1 30); do
  status=$(docker compose ps --format json postgres 2>/dev/null | grep -o '"Health":"[a-z]*"' | cut -d'"' -f4 || echo "")
  [ "$status" = "healthy" ] && break
  sleep 2
done
[ "$status" = "healthy" ] || fail "PostgreSQL did not become healthy in time"

# ── 14. Run Prisma migrations ────────────────────────────────────────────────
step "Running database migrations"
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES run --rm \
  -e DATABASE_URL="postgresql://${DB_USER:-camerohealth}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-camerohealth}" \
  -e DIRECT_URL="postgresql://${DB_USER:-camerohealth}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-camerohealth}" \
  api npx prisma migrate deploy || fail "Database migration failed"

# ── 15-16. Start MinIO, create bucket ────────────────────────────────────────
step "Starting MinIO"
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES up -d minio minio-init || fail "MinIO failed to start"

# ── 17. Start API ────────────────────────────────────────────────────────────
step "Starting API"
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES up -d api || fail "API failed to start"

# ── 18. Start frontend ───────────────────────────────────────────────────────
step "Starting web frontend"
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES up -d web || fail "Web frontend failed to start"

# ── 19. Start Nginx ──────────────────────────────────────────────────────────
step "Starting reverse proxy"
# shellcheck disable=SC2086
docker compose $COMPOSE_FILES up -d nginx || fail "Nginx failed to start"

# ── 20. Health checks ────────────────────────────────────────────────────────
step "Running health checks"
sleep 5
"${SCRIPT_DIR}/healthcheck.sh" || fail "Post-install health check failed — see output above"

# ── 21. Report success ───────────────────────────────────────────────────────
echo
echo "========================================"
echo "CAMEROHEALTH INSTALLATION SUCCESSFUL"
echo "Hospital:"
echo "  ${HOSPITAL_NAME:-<not set — complete in setup wizard>}"
echo "Installation ID:"
echo "  ${HOSPITAL_ID:-<not set>}"
echo "Application URL:"
echo "  ${APP_ORIGIN:-http://localhost}"
echo "API:      HEALTHY"
echo "Database: HEALTHY"
echo "Storage:  HEALTHY"
echo "Backup:   CONFIGURED (${BACKUP_DIR:-./backup}, retention ${BACKUP_RETENTION_DAILY:-7}d)"
echo "Version:  ${CAMEROHEALTH_VERSION:-1.0.0}"
echo "========================================"
echo
echo "Open ${APP_ORIGIN:-http://localhost} to complete the hospital setup wizard."
