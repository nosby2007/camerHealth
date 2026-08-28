# CameroHealth On-Premise — Offline (air-gapped) installation

## Status: architecture ready, bundle-builder not yet implemented

The compose files are already structured so this works without any
further code change: `docker-compose.prod.yml` never redefines `build:`,
so if the versioned images are already present in the local Docker image
cache (via `docker load`), `docker compose up` uses them as-is and never
tries to reach a registry or a package repository. What's described below
is the intended packaging process; the bundle-builder script itself
(`make-offline-bundle.sh`) is the next piece of work — see the final
implementation report's "Next recommended phase."

## Intended bundle layout

```
camerohealth-onprem-1.0.0.tar.gz
│
├── images/
│   ├── api.tar          (docker save camerohealth/api:1.0.0)
│   ├── web.tar           (docker save camerohealth/web:1.0.0)
│   ├── postgres.tar       (docker save postgres:16-alpine)
│   ├── minio.tar          (docker save minio/minio:RELEASE...)
│   ├── minio-mc.tar        (docker save minio/mc:RELEASE...)
│   └── nginx.tar           (docker save nginx:1.27-alpine)
│
├── deploy/onprem/        (this directory, as committed to the repo)
├── install.sh              (thin wrapper: docker load images/*.tar, then
│                             calls deploy/onprem/scripts/install.sh)
└── SHA256SUMS
```

## Intended install flow (no internet required)

```bash
tar xzf camerohealth-onprem-1.0.0.tar.gz
cd camerohealth-onprem-1.0.0
sha256sum -c SHA256SUMS
sudo ./install.sh
```

`install.sh` in the bundle would `docker load < images/api.tar` (and the
other 5 tars) before delegating to
`deploy/onprem/scripts/install.sh`, which then proceeds exactly as an
online install does — the `build:` step in `docker-compose.yml` is a
no-op when the image tag already exists locally.

## Building the bundle (manual process today)

```bash
docker compose -f deploy/onprem/docker-compose.yml build
mkdir -p bundle/images
docker save camerohealth/api:1.0.0 -o bundle/images/api.tar
docker save camerohealth/web:1.0.0 -o bundle/images/web.tar
docker save postgres:16-alpine -o bundle/images/postgres.tar
docker save minio/minio:RELEASE.2024-11-07T00-52-20Z -o bundle/images/minio.tar
docker save minio/mc:RELEASE.2024-11-05T11-29-45Z -o bundle/images/minio-mc.tar
docker save nginx:1.27-alpine -o bundle/images/nginx.tar
cp -r deploy/onprem bundle/deploy/onprem
sha256sum bundle/images/*.tar > bundle/SHA256SUMS
tar czf camerohealth-onprem-1.0.0.tar.gz -C bundle .
```

This is the exact sequence `make-offline-bundle.sh` should automate.
