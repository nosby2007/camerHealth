# CameroHealth On-Premise — Troubleshooting

## `install.sh` fails at "Building/pulling Docker images"

Check `docker compose -f docker-compose.yml -f docker-compose.prod.yml
build` output directly for the real error — usually a network issue
pulling the base images (`node:22-alpine`, `nginx:1.27-alpine`, etc.) on
a fresh server with no image cache yet.

## `install.sh` fails at "PostgreSQL did not become healthy in time"

```bash
docker compose logs postgres
```

Most common cause: `DB_PASSWORD` in `.env` contains a character that
breaks the connection string (`@`, `:`, `/`, `#`). Re-generate it:

```bash
# Clear the line, then let generate-secrets.sh fill it safely (hex only).
sed -i '/^DB_PASSWORD=/d' .env
echo 'DB_PASSWORD=' >> .env
./scripts/generate-secrets.sh
```

## `install.sh` fails at "Running database migrations"

```bash
docker compose run --rm api npx prisma migrate status
```

If this reports the database already has these tables but no
`_prisma_migrations` tracking row (e.g., you restored from a very old
backup, or pointed at an existing database from a different install path),
you need to baseline it the same way this codebase's own migration
history was baselined:

```bash
docker compose run --rm api npx prisma migrate resolve --applied 0_init
```

This is a metadata-only operation — it does not touch your data.

## Health check reports `storage: unhealthy`

```bash
docker compose logs minio
docker compose exec minio curl -f http://127.0.0.1:9000/minio/health/live
```

Usually `MINIO_USER`/`MINIO_PASSWORD` in `.env` don't match what the
`minio` container was actually started with (e.g., you changed `.env`
after first boot without recreating the container). MinIO's root
credentials are set at first startup and persisted in its data volume —
changing `.env` afterward does not change them:

```bash
docker compose exec minio mc alias set local http://127.0.0.1:9000 <old-user> <old-password>
```

If you've genuinely lost the original credentials, there is no supported
recovery path other than restoring from a backup taken before the loss.

## Can't reach the app from another computer on the LAN

- Confirm the server's firewall allows the port: `sudo ufw status` (if
  using ufw) — `sudo ufw allow 80/tcp` (and 443 once TLS is enabled).
- Confirm `APP_ORIGIN` in `.env` matches how staff are actually reaching
  it (IP vs hostname) — a mismatch causes CORS rejections on login.
- `docker compose ps` — confirm `nginx` shows as running/healthy.

## "Your role does not have access to..." errors after upgrading

Check `docs/onprem/UPGRADE.md` — if a migration changed role-permission
logic, staff sessions issued before the upgrade may carry a stale JWT.
Have them log out and back in.

## Backup/restore checksum failures

`manifest.sha256` verification failing on a backup you didn't manually
edit usually means the backup was copied incompletely (interrupted
`scp`/`rsync`, truncated USB copy). Re-copy the entire backup folder and
retry — don't attempt to restore a backup that fails its checksum.

## General diagnostics

```bash
./scripts/healthcheck.sh          # full stack status
docker compose ps                  # container states
docker compose logs -f <service>   # follow logs for one service
docker compose exec api sh         # shell into the API container
```
