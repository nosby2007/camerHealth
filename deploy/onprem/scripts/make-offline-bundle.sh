#!/usr/bin/env bash
# Builds camerohealth-onprem-<version>.tar.gz — everything a hospital needs
# to install CameroHealth with zero internet access. See
# docs/onprem/OFFLINE-INSTALLATION.md for the bundle layout this produces
# and the resulting install flow.
#
# Usage: ./make-offline-bundle.sh <version>
# Run from a machine WITH internet access and a working Docker daemon —
# the bundle it produces is what needs no internet, not this script itself.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ONPREM_DIR="${SCRIPT_DIR}/.."
REPO_ROOT="${ONPREM_DIR}/../.."

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>  (e.g. $0 1.0.0)" >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || { echo "error: docker is required to build the bundle" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "error: Docker daemon is not running" >&2; exit 1; }

WORK_DIR="$(mktemp -d)"
BUNDLE_DIR="${WORK_DIR}/camerohealth-onprem-${VERSION}"
mkdir -p "${BUNDLE_DIR}/images" "${BUNDLE_DIR}/deploy"

echo "=== Building CameroHealth On-Premise offline bundle: v${VERSION} ==="

# ── Pin the exact base image versions this bundle ships, read straight out
# of the compose file so this script can never silently drift from what
# docker-compose.yml actually declares. ────────────────────────────────────
POSTGRES_IMAGE=$(grep -oP '(?<=image: postgres:)\S+' "${ONPREM_DIR}/docker-compose.yml")
MINIO_IMAGE=$(grep -oP '(?<=image: minio/minio:)\S+' "${ONPREM_DIR}/docker-compose.yml")
MINIO_MC_IMAGE=$(grep -oP '(?<=image: minio/mc:)\S+' "${ONPREM_DIR}/docker-compose.yml")
NGINX_IMAGE=$(grep -oP '(?<=image: nginx:)\S+' "${ONPREM_DIR}/docker-compose.yml")

echo "-> Building camerohealth/api:${VERSION}..."
docker build -t "camerohealth/api:${VERSION}" "${REPO_ROOT}/backend"

echo "-> Building camerohealth/web:${VERSION}..."
docker build -t "camerohealth/web:${VERSION}" "${REPO_ROOT}/frontend" \
  --build-arg API_URL=/api

echo "-> Pulling base images (postgres, minio, minio/mc, nginx)..."
docker pull "postgres:${POSTGRES_IMAGE}"
docker pull "minio/minio:${MINIO_IMAGE}"
docker pull "minio/mc:${MINIO_MC_IMAGE}"
docker pull "nginx:${NGINX_IMAGE}"

echo "-> Saving images to bundle..."
docker save "camerohealth/api:${VERSION}"     -o "${BUNDLE_DIR}/images/api.tar"
docker save "camerohealth/web:${VERSION}"     -o "${BUNDLE_DIR}/images/web.tar"
docker save "postgres:${POSTGRES_IMAGE}"      -o "${BUNDLE_DIR}/images/postgres.tar"
docker save "minio/minio:${MINIO_IMAGE}"      -o "${BUNDLE_DIR}/images/minio.tar"
docker save "minio/mc:${MINIO_MC_IMAGE}"      -o "${BUNDLE_DIR}/images/minio-mc.tar"
docker save "nginx:${NGINX_IMAGE}"            -o "${BUNDLE_DIR}/images/nginx.tar"

echo "-> Copying deploy/onprem..."
cp -r "${ONPREM_DIR}" "${BUNDLE_DIR}/deploy/onprem"
rm -rf "${BUNDLE_DIR}/deploy/onprem/backup"/* 2>/dev/null || true
rm -f "${BUNDLE_DIR}/deploy/onprem/.env" 2>/dev/null || true

echo "-> Writing bundle installer wrapper..."
cat > "${BUNDLE_DIR}/install.sh" <<'INSTALLER'
#!/usr/bin/env bash
# Offline bundle entrypoint: loads the pre-built images, then delegates to
# the normal on-prem installer, which proceeds exactly as an online install
# does — its `build:` step is a no-op once these images already exist.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Loading CameroHealth images (offline) ==="
for tar in "${SCRIPT_DIR}"/images/*.tar; do
  echo "-> docker load < $(basename "$tar")"
  docker load -i "$tar"
done

exec "${SCRIPT_DIR}/deploy/onprem/scripts/install.sh"
INSTALLER
chmod +x "${BUNDLE_DIR}/install.sh"

echo "-> Writing version marker..."
echo "${VERSION}" > "${BUNDLE_DIR}/VERSION"

echo "-> Generating checksums..."
(
  cd "$BUNDLE_DIR"
  find . -type f ! -name "SHA256SUMS" -exec sha256sum {} \; > SHA256SUMS
)

echo "-> Packaging..."
OUTPUT="camerohealth-onprem-${VERSION}.tar.gz"
tar czf "$OUTPUT" -C "$WORK_DIR" "camerohealth-onprem-${VERSION}"
rm -rf "$WORK_DIR"

echo
echo "=== Bundle complete: ${OUTPUT} ==="
du -sh "$OUTPUT"
echo
echo "On the hospital server (no internet required):"
echo "  tar xzf ${OUTPUT}"
echo "  cd camerohealth-onprem-${VERSION}"
echo "  sha256sum -c SHA256SUMS"
echo "  sudo ./install.sh"
