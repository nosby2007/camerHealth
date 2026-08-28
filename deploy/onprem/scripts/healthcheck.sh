#!/usr/bin/env bash
# Checks every part of the stack and prints a clear PASS/FAIL summary.
# Exit code is non-zero if anything is unhealthy — safe to wire into cron
# or a monitoring agent.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPT_DIR}/.."
cd "$COMPOSE_DIR"

# shellcheck disable=SC1091
[ -f .env ] && set -a && source .env && set +a

FAILED=0
check() {
  local label="$1"
  local status="$2" # 0 = pass
  if [ "$status" -eq 0 ]; then
    echo "  [PASS] ${label}"
  else
    echo "  [FAIL] ${label}"
    FAILED=1
  fi
}

echo "=== CameroHealth health check ==="

echo "--- Docker container status ---"
for svc in postgres minio api web nginx; do
  cid=$(docker compose ps -q "$svc" 2>/dev/null)
  if [ -z "$cid" ]; then
    check "container: $svc (running)" 1
    continue
  fi
  state=$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo "no-healthcheck")
  if [ "$state" = "healthy" ] || [ "$state" = "no-healthcheck" ]; then
    running=$(docker inspect -f '{{.State.Running}}' "$cid" 2>/dev/null)
    check "container: $svc" "$([ "$running" = "true" ] && echo 0 || echo 1)"
  else
    check "container: $svc (docker health: $state)" 1
  fi
done

echo "--- HTTP endpoints ---"
HOST="127.0.0.1"
PORT="${HTTP_PORT:-80}"
curl -fsS "http://${HOST}:${PORT}/" -o /dev/null; check "web (via nginx)" $?
curl -fsS "http://${HOST}:${PORT}/api/health" -o /dev/null; check "api (via nginx)" $?

echo "--- Database ---"
docker compose exec -T postgres pg_isready -U "${DB_USER:-camerohealth}" -d "${DB_NAME:-camerohealth}" >/dev/null 2>&1
check "postgresql" $?

echo "--- Storage ---"
docker compose exec -T minio curl -fsS "http://127.0.0.1:9000/minio/health/live" -o /dev/null 2>&1
check "minio" $?

echo "--- Disk usage ---"
DISK_USE=$(df -P . | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USE" -lt 85 ]; then
  check "disk usage (${DISK_USE}%)" 0
else
  check "disk usage (${DISK_USE}% — above 85% threshold)" 1
fi

echo "=================================="
if [ "$FAILED" -eq 0 ]; then
  echo "Overall: HEALTHY"
else
  echo "Overall: UNHEALTHY"
fi
exit $FAILED
