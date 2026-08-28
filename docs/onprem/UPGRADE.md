# CameroHealth On-Premise — Upgrading

```bash
cd deploy/onprem
./scripts/upgrade.sh 1.4.0
```

## What happens

```
health check (current state) ──fail──> abort, nothing touched
     │ pass
     ▼
backup ──fail──> abort
     │
     ▼
verify backup checksums ──fail──> abort
     │
     ▼
pull/load camerohealth/api:1.4.0, camerohealth/web:1.4.0
     │
     ▼
prisma migrate deploy ──fail──> abort, DB/files unchanged from the
     │                          pre-upgrade backup; restore.sh path printed
     ▼
restart api, web, nginx
     │
     ▼
health check (new state) ──fail──> logged, backup path printed for manual
     │                             recovery decision
     ▼
success — logged to backup/upgrade-history.log
```

## Why there's no automatic rollback

If `prisma migrate deploy` fails partway through a migration that both
adds and alters columns, the database can be left in a state that isn't
exactly "old schema" or "new schema." Automatically reverting containers
to the old image against that half-migrated database could make things
worse, not better. Instead, the script stops, leaves everything as-is,
and tells you exactly which backup to restore if you decide that's the
right call — a human decision, not a scripted guess.

## Rolling back manually

```bash
./scripts/restore.sh backup/<the pre-upgrade backup upgrade.sh printed>
sed -i "s/^CAMEROHEALTH_VERSION=.*/CAMEROHEALTH_VERSION=<old version>/" .env
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

`restore.sh` already restarts the stack, so the manual step above is only
needed if you also want the version label in `.env`/health output to
match the images actually running.

## Offline upgrades

If the new version's images were loaded via `docker load` from an offline
bundle (see OFFLINE-INSTALLATION.md) rather than pulled from a registry,
`upgrade.sh`'s pull step will simply report nothing to pull and continue —
run the `docker load` commands from the bundle *before* running
`upgrade.sh`.
