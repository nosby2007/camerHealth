# CameroHealth On-Premise — Configuration reference

All configuration lives in `deploy/onprem/.env`. See `.env.example` for the
full annotated template. Key groups:

## Deployment mode (do not change these three together carelessly)

| Variable | On-prem value | Meaning |
|---|---|---|
| `DEPLOYMENT_MODE` | `onprem` | Switches storage default, enables the single-hospital `/register` guard |
| `DATA_RESIDENCY` | `LOCAL` | Declares that clinical data must not leave this server |
| `CLOUD_PATIENT_SYNC` | `false` | Must stay `false` when `DATA_RESIDENCY=LOCAL` — the API refuses to start otherwise |

## Database

`DB_NAME` / `DB_USER` / `DB_PASSWORD` — the compose file builds
`DATABASE_URL`/`DIRECT_URL` from these automatically (both point at the
same local Postgres — there's no connection pooler to route around here,
unlike the cloud Supabase setup). You never set `DATABASE_URL` directly
for an on-prem install.

## Storage

`STORAGE_PROVIDER=minio` is set automatically by the compose file's `api`
service definition — you don't need to set it in `.env`. `MINIO_USER` /
`MINIO_PASSWORD` / `MINIO_BUCKET` control the local file store.

## Networking

`APP_ORIGIN` — the URL staff type into their browser. Used for CORS and
baked into the frontend bundle at build time (Nuxt SPA mode has no server
to read env vars from at runtime — see ARCHITECTURE.md). **Changing
`APP_ORIGIN` requires rebuilding the `web` image** (`docker compose build
web`), not just restarting.

`HTTP_PORT` / `HTTPS_PORT` — change these only if 80/443 are already used
by something else on the host.

## Backup

`BACKUP_DIR`, `BACKUP_RETENTION_DAILY/WEEKLY/MONTHLY` — see
BACKUP-RESTORE.md for what retention actually does today (simpler than
the variable names suggest — read that doc before relying on it).

## Optional integrations

`MTN_MOMO_*` — leave blank to disable mobile money entirely; the feature
returns a clear "not configured" error rather than crashing. Same
optional-config pattern as the rest of this codebase. DHIS2 sync is
configured per-organization from within the app itself (Super Admin →
DHIS2 Mapping), not via `.env`.

## Changing HOSPITAL_NAME/HOSPITAL_ID after install

These are informational (shown in the health endpoint and install/backup
banners) and safe to edit in `.env` at any time — restart the `api`
service to pick up the change (`docker compose restart api`). They do not
affect the hospital record created via the setup wizard, which lives in
the database.
