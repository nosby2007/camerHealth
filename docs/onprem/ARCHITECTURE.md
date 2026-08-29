# CameroHealth On-Premise — Architecture

## Overview

```
Hospital Network
│
├── Browser / Workstations
│
▼
Nginx (only container publishing ports 80/443)
│
├── CameroHealth Web (static Nuxt SPA bundle, served as plain files)
│
└── CameroHealth API (Express)
       │
       ├── Prisma → PostgreSQL (local container, persistent volume)
       │
       └── StorageService → MinIO (local container, persistent volume)
```

Every container talks to every other container over one internal Docker
network. Nginx is the single entry point from the hospital LAN.

## Why the frontend has no Node process

CameroHealth's Nuxt app already runs `mode: "spa"` (no server-side
rendering) — see `frontend/nuxt.config.js`. `nuxt generate` produces a fully
static bundle, exactly what's deployed to Firebase Hosting today. On-premise
reuses that same build output, served by a plain Nginx container instead of
Firebase Hosting. There is no separate "web server" process to run, patch,
or monitor.

## Storage abstraction

Before this work, `backend/src/lib/supabase.js` was called directly from
3 call sites (imaging upload, wound photo upload, startup bucket check).
`backend/src/lib/storage/` now sits between route code and the actual
provider:

```
Route code
    │
    ▼
storageService (upload / getSignedUrl / remove / ensureReady)
    │
    ├── supabaseProvider.js   (STORAGE_PROVIDER=supabase, cloud default)
    └── minioProvider.js      (STORAGE_PROVIDER=minio, on-prem)
```

Route code never imports a provider directly — only `require('../lib/storage')`.
Switching deployment target is a config change, not a code change.

## Deployment mode

`backend/src/config.js` exposes `DEPLOYMENT_MODE` (`cloud` | `onprem`),
`DATA_RESIDENCY` (`CLOUD` | `LOCAL`), and `CLOUD_PATIENT_SYNC` (boolean).
The app **refuses to start** if `DEPLOYMENT_MODE=onprem` and
`DATA_RESIDENCY=LOCAL` and `CLOUD_PATIENT_SYNC=true` — that combination
claims to be a local-only install while also permitting patient data to
leave the building, which is a contradiction, not a valid configuration.

## Database migrations

This project historically used `prisma db push` exclusively — there was no
migration history. `backend/prisma/migrations/0_init/` is a baseline
generated from the full 48-model schema and marked as already applied on
the existing cloud database (a metadata-only operation — no data was
touched). From this point forward, `prisma migrate deploy` is the only
schema-change mechanism for both cloud and on-prem; `prisma migrate dev`
must never be used against a real database (it can prompt interactively
and is designed for local schema iteration, not production).

## Multi-tenancy

The cloud product is multi-tenant (`Organization` → `OrganizationUnit` →
`Facility`, plus `StaffAssignment` for cross-scope roles). An on-premise
install has no need for this: each hospital gets its own database, so
"multi-tenancy" at the infrastructure level is just "one Postgres per
customer," not a routing concern inside the app. The existing
`/api/auth/register` endpoint (already used for cloud self-serve
onboarding) doubles as the on-prem first-run setup wizard, with a guard
that refuses a second facility once one exists (see CONFIGURATION.md).

## External dependencies review (data residency)

| Integration | Requires internet | Sends clinical data externally? |
|---|---|---|
| PostgreSQL | No (local container) | No |
| MinIO | No (local container) | No |
| JWT auth | No | No |
| MTN Mobile Money | Yes, when used | Payment amount/phone only, not clinical data |
| DHIS2 sync | Yes, when used | Yes — RMA indicator *aggregates*, by design (national reporting) |
| Ministry `/ministry-login` (AWS Amplify/Cognito) | Yes | Separate auth flow, unrelated to the hospital/clinical layer; unused in a single-hospital on-prem install |
| `express-rate-limit` | No (in-memory) | No |

Mobile money and DHIS2 sync are both **optional, config-gated integrations**
(see `backend/src/config.js`) — an on-prem install with no internet access
simply doesn't configure them, and the rest of the application is
unaffected (same "absent config → feature unavailable, not a crash"
pattern used throughout this codebase).

## What was NOT changed

Per the guiding rule of this work ("do not perform a massive rewrite"):
route contracts, business logic, Prisma models, roles/permissions, and
frontend workflows are all untouched. The only application-level changes
are: the storage call sites now go through `storageService`, `config.js`
gained deployment-mode fields, `/api/health` reports more detail, and
`/api/auth/register` has one additional guard clause for on-prem mode.
