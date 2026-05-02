# Staging Access Request Checklist

## Scope

Checklist for obtaining the minimum access needed to execute shadow validation safely in staging.

## 1) Supabase Access Required

1. Staging project reference.
2. SQL editor access for tester.
3. SQL editor access for reviewer.
4. Read access to staging schema objects involved in fixtures.
5. Evidence export permission where applicable.

## 2) Vercel Access Required

1. Staging deployment URL.
2. Read access to staging deployment configuration.
3. Read access to logs for API trace verification.
4. Confirmation of non-production environment label.

## 3) Approvals Required

1. QA manager approval.
2. Security reviewer approval.
3. Platform owner approval for staging database use.
4. Rollback owner acknowledgement.

## 4) Fixture Access Required

1. Fixture dataset version.
2. Fixture UUID map.
3. Fixture owner contact.
4. Confirmation that fixtures are staging-only.

## 5) Request Submission Checklist

1. State branch: chore/v1-release-hardening.
2. State purpose: Phase 15 helper shadow validation execution.
3. State no production deploy/apply.
4. State no active RLS policy changes.
5. State evidence artifacts required.

## 6) Access Request Output Fields

- Request owner:
- Requested date:
- Needed by date:
- Supabase approver:
- Vercel approver:
- Security approver:
- Status:
