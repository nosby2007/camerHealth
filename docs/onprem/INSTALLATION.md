# CameroHealth On-Premise — Installation (fresh Ubuntu Server)

## Prerequisites

- Ubuntu Server 22.04 LTS or 24.04 LTS (other Linux distributions likely
  work but are untested)
- Docker Engine + Docker Compose v2 plugin installed
  (`docker --version` and `docker compose version` both succeed)
- 4 GB RAM minimum (8 GB recommended)
- 20 GB free disk minimum (more if you expect a large volume of wound
  photos/documents — clinical files live on this server now)
- Ports 80 and 443 free (or reassign via `.env`, see CONFIGURATION.md)

## Steps

```bash
git clone <this repository> camerohealth
cd camerohealth/deploy/onprem
cp .env.example .env
```

Edit `.env` and set at minimum:
- `HOSPITAL_NAME` and `HOSPITAL_ID`
- `APP_ORIGIN` (the URL staff will actually type — e.g.
  `https://camerohealth.mon-hopital.cm`, or `http://192.168.1.50` for a
  pure-LAN install with no domain)

Leave `DB_PASSWORD`, `MINIO_PASSWORD`, and `JWT_SECRET` blank — the
installer generates strong random values for you.

```bash
sudo ./scripts/install.sh
```

The installer checks your system, generates secrets, builds the images,
starts PostgreSQL, runs migrations, starts MinIO and creates its bucket,
starts the API and web frontend, starts Nginx, and runs a full health
check. It prints a summary banner when done:

```
========================================
CAMEROHEALTH INSTALLATION SUCCESSFUL
Hospital:
  <Hospital Name>
...
========================================
```

Open `APP_ORIGIN` in a browser. Since no facility exists yet, you'll land
on the hospital setup wizard (`/register`) — fill in the hospital's
details and create the first administrator account. After that, use
`/login` as normal.

## Verifying the install

```bash
./scripts/healthcheck.sh
```

Should report `Overall: HEALTHY`.

## What to do next

- Read SECURITY.md before exposing this beyond the hospital LAN (TLS
  certificates, firewall).
- Set up a scheduled `backup.sh` run (cron) — see BACKUP-RESTORE.md.
- Keep `.env` somewhere safe outside the server too (a password manager,
  not just the disk) — it's the only copy of your secrets.
