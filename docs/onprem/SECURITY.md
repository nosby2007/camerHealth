# CameroHealth On-Premise — Security

## What's already in place

- **Secrets never committed.** `.env` is gitignored; `.env.example` has no
  real values. `generate-secrets.sh` creates strong random values
  (32 bytes, `openssl rand -hex`) for the database password, MinIO
  password, and JWT secret.
- **Internal Docker network.** Only `nginx` publishes ports to the host.
  PostgreSQL, MinIO, the API, and the web container are reachable only
  from other containers on the same Docker network.
- **Non-root containers.** The API container runs as an unprivileged
  `camerohealth` user, not root.
- **Rate limiting.** `express-rate-limit` (already in the app, unchanged)
  applies globally and more strictly on `/api/auth/*`.
- **Audit logging.** Unchanged from the existing app — every clinical
  write and auth event still logs to `AuditLog`.
- **CORS.** Locked to `APP_ORIGIN` from `.env`, not a wildcard.
- **JWT handling.** Unchanged — signed with `JWT_SECRET`, verified on
  every authenticated request.
- **File upload limits.** Nginx `client_max_body_size 25m`; MIME type is
  recorded and used as the stored `Content-Type`, not trusted for
  execution.
- **No debug info in production.** `NODE_ENV=production` throughout the
  compose stack.
- **Health endpoint has no PHI.** `/api/health` reports only status
  strings, never patient/staff/clinical data (see ARCHITECTURE.md).

## What you must do before going live

### 1. Enable HTTPS

The default Nginx config serves plain HTTP so a fresh install works
immediately on a LAN with no certificates. Before this instance is
reachable beyond a trusted local network:

1. Obtain a certificate — either from a public CA if `APP_ORIGIN` has a
   real, internet-resolvable domain (e.g., via Let's Encrypt/certbot), or
   a certificate from the hospital's own internal CA for a LAN-only
   deployment.
2. Place `fullchain.pem` and `privkey.pem` in
   `deploy/onprem/nginx/certs/`.
3. Uncomment the HTTPS `server` block and the HTTP→HTTPS redirect in
   `deploy/onprem/nginx/default.conf`.
4. `docker compose restart nginx`.

### 2. Firewall

Only ports 80/443 need to be reachable from the hospital LAN. Nothing
needs to be reachable from the public internet unless staff need remote
access — if so, put a VPN in front of it rather than exposing the
hospital's patient data system directly to the internet.

### 3. Rotate the defaults

If you ever typed a password into `.env` by hand instead of using
`generate-secrets.sh` (or copied a value from documentation/chat), rotate
it — `./scripts/generate-secrets.sh` won't touch a value that's already
set, so clear the specific line in `.env` first, then re-run it.

### 4. Restrict server access

Whoever has shell access to this server has, in practice, access to
everything on it — the database password, the JWT secret, and (if they
also have database credentials) the patient data itself. Limit SSH access
to the people who actually need it, and use SSH keys, not passwords.

## Data residency guarantee

With `DEPLOYMENT_MODE=onprem`, `DATA_RESIDENCY=LOCAL`,
`CLOUD_PATIENT_SYNC=false` (the on-prem defaults), no route in this
codebase sends patient or clinical data to CameroHealth's own cloud
infrastructure. The two integrations that do talk to the outside world —
MTN Mobile Money and DHIS2 sync — are both opt-in, per-organization
configuration, and neither sends full patient records: mobile money sends
only a phone number and amount to MTN; DHIS2 sync sends aggregated RMA
indicator *counts*, which is the entire point of DHIS2 (national health
reporting) and something the hospital would otherwise type into DHIS2's
own web form anyway.

If a future centralized control plane is built (see the "Control plane
preparation" note in the project's on-prem implementation report), it
must only ever transmit technical metadata (installation ID, version,
health status, disk usage) — never patient data. That constraint should
be enforced by *not routing patient tables through it*, not by a filter
that could be misconfigured.
