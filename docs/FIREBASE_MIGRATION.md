# Firebase migration environments

CameroHealth uses three isolated Firebase projects:

| Alias | Project ID | Intended use |
| --- | --- | --- |
| `dev` | `camerohealth-dev` | Development and integration testing |
| `staging` | `camerohealth-staging` | Pre-production validation |
| `pro` | `camerohealth-pro` | Production only |

The default alias is deliberately `dev` to reduce the risk of an accidental production deployment.

## Current migration boundary

Firebase Hosting serves the generated Nuxt SPA. The existing Node API and PostgreSQL/Supabase clinical data remain unchanged during this first migration step. Authentication, database, Storage, Functions, and clinical records must not be moved without a separate tenant-isolation and security-rules review.

Firebase web API keys identify a Firebase project and are public by design. Backend service-account credentials, private keys, database passwords, JWT secrets, and Supabase service-role keys must remain outside Git.

## Deploy Hosting

1. Authenticate the Firebase CLI with an account that can access the target project.
2. Export the required Nuxt build variables in the current shell.
3. Run the guarded deployment script from the repository root:

```powershell
.\scripts\deploy-firebase-hosting.ps1 -Environment dev
.\scripts\deploy-firebase-hosting.ps1 -Environment staging
.\scripts\deploy-firebase-hosting.ps1 -Environment pro
```

The script verifies project access, generates `frontend/dist`, and deploys Hosting only. It never deploys Functions, Firestore rules, Storage rules, or backend services.

## Promotion policy

1. Deploy and validate `dev`.
2. Promote the same reviewed commit to `staging` and complete clinical acceptance testing.
3. Deploy that exact commit to `pro` only after approval.
4. Record the Git commit, Firebase release ID, operator, and validation result in the release log.
