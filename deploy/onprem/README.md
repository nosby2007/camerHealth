# CameroHealth On-Premise

Run CameroHealth entirely on a hospital's own server — local PostgreSQL,
local file storage (MinIO), no patient data leaving the building.

## Quick start

```bash
cp .env.example .env
# edit .env — set HOSPITAL_NAME, HOSPITAL_ID, APP_ORIGIN;
# leave DB_PASSWORD / MINIO_PASSWORD / JWT_SECRET blank
sudo ./scripts/install.sh
```

Full documentation: [`../../docs/onprem/`](../../docs/onprem/)

| Doc | What's in it |
|---|---|
| [ARCHITECTURE.md](../../docs/onprem/ARCHITECTURE.md) | How the pieces fit together, what changed in the app to support this |
| [INSTALLATION.md](../../docs/onprem/INSTALLATION.md) | Step-by-step fresh install |
| [CONFIGURATION.md](../../docs/onprem/CONFIGURATION.md) | Every `.env` variable explained |
| [BACKUP-RESTORE.md](../../docs/onprem/BACKUP-RESTORE.md) | `backup.sh` / `restore.sh`, and what retention actually does |
| [UPGRADE.md](../../docs/onprem/UPGRADE.md) | `upgrade.sh`, rollback |
| [SECURITY.md](../../docs/onprem/SECURITY.md) | TLS, firewall, data residency guarantee |
| [OFFLINE-INSTALLATION.md](../../docs/onprem/OFFLINE-INSTALLATION.md) | Air-gapped install (bundle format defined, builder script pending) |
| [TROUBLESHOOTING.md](../../docs/onprem/TROUBLESHOOTING.md) | Common failures and fixes |

## Directory layout

```
deploy/onprem/
├── docker-compose.yml       stack definition (postgres, minio, api, web, nginx)
├── docker-compose.prod.yml  production overlay (log limits, resource limits)
├── .env.example             copy to .env and fill in
├── nginx/default.conf       reverse proxy (fronts api + web on one origin)
└── scripts/
    ├── install.sh           fresh install, 20-ish provisioning steps
    ├── upgrade.sh            version upgrade with backup-first safety
    ├── backup.sh              database + files + checksums
    ├── restore.sh              verified, confirmed restore
    ├── healthcheck.sh          full stack status, non-zero exit if unhealthy
    └── generate-secrets.sh     fills blank secrets in .env
```

## Common commands

```bash
./scripts/healthcheck.sh                 # is everything up?
./scripts/backup.sh                      # back up now
./scripts/upgrade.sh 1.1.0               # upgrade to a specific version
docker compose logs -f api               # tail API logs
docker compose restart nginx             # restart one service
```
