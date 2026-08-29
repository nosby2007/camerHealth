#!/usr/bin/env bash
# Fills in any blank secret in .env with a strong random value. Idempotent —
# never touches a value that's already set, so re-running after a manual
# edit is always safe.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found. Copy .env.example to .env first." >&2
  exit 1
fi

random_value() {
  # 32 bytes of randomness, URL-safe — works for a DB password, a MinIO
  # password, or a JWT signing secret alike.
  openssl rand -hex 32
}

set_if_blank() {
  local key="$1"
  local current
  current=$(grep -E "^${key}=" "$ENV_FILE" | head -n1 | cut -d'=' -f2- || true)
  if [ -n "$current" ]; then
    echo "  ${key}: already set, leaving as-is"
    return
  fi
  local value
  value=$(random_value)
  if grep -qE "^${key}=" "$ENV_FILE"; then
    # Portable in-place edit for both GNU and BSD sed.
    sed -i.bak "s|^${key}=.*|${key}=${value}|" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
  echo "  ${key}: generated"
}

echo "Generating missing secrets in ${ENV_FILE}..."
set_if_blank "DB_PASSWORD"
set_if_blank "MINIO_PASSWORD"
set_if_blank "JWT_SECRET"

# MINIO_USER isn't a secret in the same sense, but must be non-empty for
# MinIO to start — give it a stable, human-readable default if unset.
current_minio_user=$(grep -E "^MINIO_USER=" "$ENV_FILE" | head -n1 | cut -d'=' -f2- || true)
if [ -z "$current_minio_user" ]; then
  sed -i.bak "s|^MINIO_USER=.*|MINIO_USER=camerohealth_storage|" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
  echo "  MINIO_USER: set to default (camerohealth_storage)"
fi

echo "Done. Secrets that were already set were left untouched."
