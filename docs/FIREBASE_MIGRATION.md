# Firebase migration environments

CameroHealth uses three isolated Firebase projects:

| Alias | Project ID | Intended use |
| --- | --- | --- |
| `dev` | `camerohealth-dev` | Development and integration testing |
| `staging` | `camerohealth-staging` | Pre-production validation |
| `pro` | `camerohealth-pro` | Production only |

The default alias is deliberately `dev` to reduce the risk of an accidental production deployment.

## Current migration boundary

Firebase Hosting serves the generated Nuxt SPA. The Express API is packaged as the second-generation Firebase Function `api` in `europe-west1`, and Hosting forwards `/api/**` to that function. PostgreSQL/Supabase remains the clinical system of record during this migration step.

Authentication, database, and Storage must not be replaced without a separate tenant-isolation and security-rules review. The Firebase Function reads the existing backend configuration from Secret Manager; no backend credential is included in the function bundle.

Firebase web API keys identify a Firebase project and are public by design. Backend service-account credentials, private keys, database passwords, JWT secrets, and Supabase service-role keys must remain outside Git.

## Configure backend secrets

Configure these secrets independently in every Firebase project before deploying the API:

```powershell
npx firebase-tools functions:secrets:set DATABASE_URL --project camerohealth-dev
npx firebase-tools functions:secrets:set DIRECT_URL --project camerohealth-dev
npx firebase-tools functions:secrets:set JWT_SECRET --project camerohealth-dev
npx firebase-tools functions:secrets:set JWT_EXPIRES_IN --project camerohealth-dev
npx firebase-tools functions:secrets:set CORS_ORIGIN --project camerohealth-dev
npx firebase-tools functions:secrets:set SUPABASE_URL --project camerohealth-dev
npx firebase-tools functions:secrets:set SUPABASE_SERVICE_KEY --project camerohealth-dev
npx firebase-tools functions:secrets:set SUPABASE_STORAGE_BUCKET --project camerohealth-dev
```

For `CORS_ORIGIN`, use the comma-separated Hosting origins for the target environment. Never paste secret values into a command argument, tracked script, or CI log; allow the CLI to prompt securely.

Deploy the development API after all secrets exist:

```powershell
npx firebase-tools deploy --only functions:api --project camerohealth-dev
```

## Deploy Hosting

1. Authenticate the Firebase CLI with an account that can access the target project.
2. Export the required Nuxt build variables in the current shell.
3. Run the guarded deployment script from the repository root:

```powershell
.\scripts\deploy-firebase-hosting.ps1 -Environment dev
.\scripts\deploy-firebase-hosting.ps1 -Environment staging
.\scripts\deploy-firebase-hosting.ps1 -Environment pro
```

The script verifies project access, generates `frontend/dist`, and deploys Hosting only. The API Function must already exist for the `/api/**` rewrite. The script never deploys Firestore rules, Storage rules, or other backend services.

## Promotion policy

1. Deploy and validate `dev`.
2. Promote the same reviewed commit to `staging` and complete clinical acceptance testing.
3. Deploy that exact commit to `pro` only after approval.
4. Record the Git commit, Firebase release ID, operator, and validation result in the release log.
