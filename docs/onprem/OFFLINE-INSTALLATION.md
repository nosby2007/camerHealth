# CameroHealth On-Premise — Offline (air-gapped) installation

## Building the bundle

Run on a machine **with** internet access and a working Docker daemon —
the bundle it produces is what needs no internet, not this step:

```bash
cd deploy/onprem/scripts
./make-offline-bundle.sh 1.0.0
```

This builds `camerohealth/api:1.0.0` and `camerohealth/web:1.0.0` from
source, pulls the base images (`postgres`, `minio/minio`, `minio/mc`,
`nginx` — versions read directly from `docker-compose.yml`, so the bundle
can never silently drift from what the compose file actually declares),
saves all six as tars, copies in `deploy/onprem/`, and packages everything
into `camerohealth-onprem-1.0.0.tar.gz` with a `SHA256SUMS` manifest.

**Not yet validated against a running Docker daemon** — this script was
written and reviewed but the development environment it was built in
could not run Docker (see the on-prem implementation report). Run it once
on a real machine and confirm the resulting bundle installs cleanly before
relying on it for a real hospital delivery.

## Bundle layout

```
camerohealth-onprem-1.0.0.tar.gz
│
├── images/
│   ├── api.tar
│   ├── web.tar
│   ├── postgres.tar
│   ├── minio.tar
│   ├── minio-mc.tar
│   └── nginx.tar
│
├── deploy/onprem/        (full deploy directory, minus any local .env)
├── install.sh              (loads all 6 tars, then runs deploy/onprem/scripts/install.sh)
├── VERSION
└── SHA256SUMS
```

## Installing from the bundle (no internet required)

```bash
tar xzf camerohealth-onprem-1.0.0.tar.gz
cd camerohealth-onprem-1.0.0
sha256sum -c SHA256SUMS
sudo ./install.sh
```

`install.sh` here is a thin wrapper: it `docker load`s all six tars, then
hands off to `deploy/onprem/scripts/install.sh`, which proceeds exactly as
an online install does. The `build:` step in `docker-compose.yml` becomes
a no-op the moment the versioned image tag already exists locally — that's
the entire mechanism that makes this work with the same compose files as
an online install, no separate air-gapped code path to maintain.

You still need to `cp .env.example .env` and fill it in (or run
`generate-secrets.sh`) before `install.sh` proceeds — the bundle ships
images, not hospital-specific configuration.
