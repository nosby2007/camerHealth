# CameroHealth On-Premise — Backup and Restore

## Backup

```bash
cd deploy/onprem
./scripts/backup.sh
```

Creates `backup/<UTC timestamp>/` containing:
- `database.sql.gz` — full `pg_dump` of PostgreSQL
- `minio/` — a copy of every file in the MinIO data volume (clinical
  photos, documents, scans)
- `metadata.json` — hospital ID, app version, timestamp
- `manifest.sha256` — checksum of every file above, checked before any
  restore

Safe to run while the stack is up — `pg_dump` takes a consistent snapshot
without blocking other writers.

### Scheduling it

Add to root's crontab for a nightly backup at 2 AM:

```
0 2 * * * cd /opt/camerohealth/deploy/onprem && ./scripts/backup.sh >> /var/log/camerohealth-backup.log 2>&1
```

### Retention — read this before relying on it

`BACKUP_RETENTION_DAILY` (default 7) deletes any backup folder older than
that many days. **This is a single time window, not the full
daily/weekly/monthly tiering the variable names imply** —
`BACKUP_RETENTION_WEEKLY` and `BACKUP_RETENTION_MONTHLY` are reserved in
`.env` for a future version that promotes specific backups to longer-lived
tiers, but that promotion logic isn't built yet. Today: back up nightly,
keep 7 days locally, and **copy backups off this server periodically**
(a second drive, another machine, cloud cold storage) if you need
longer-term retention — `backup.sh` does not do that for you.

## Restore

```bash
./scripts/restore.sh backup/2026-08-28_020000
```

1. Verifies every file's SHA-256 against `manifest.sha256` — refuses to
   proceed if anything is corrupt or has been tampered with.
2. Requires you to type `RESTORE` to confirm — this is destructive.
3. Stops the API (no writes can happen mid-restore).
4. Restores the database and MinIO files.
5. Restarts everything and runs a health check.

Nothing is deleted before step 1's verification passes.

## Testing your backups

A backup you've never restored is a hope, not a backup. Periodically:

```bash
# On a throwaway copy of this stack, or a spare server —
# never test-restore onto your live hospital instance.
./scripts/restore.sh backup/<some-recent-backup>
./scripts/healthcheck.sh
```
