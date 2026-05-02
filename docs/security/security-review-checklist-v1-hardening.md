# Security Review Checklist - v1 Hardening

## Scope

Security-focused verification checklist for the v1 hardening PR package.

## 1) Secret Management And Exposure Checks

1. Confirm no service role key is exposed in frontend runtime paths.
2. Confirm no real secrets are committed in repository files.
3. Confirm example/env template values are placeholders only.

## 2) Clinical Surface Change Checks

1. Confirm no unexpected clinical page modifications in hardening phases.
2. Confirm no unexpected modifications to store/clinical.js for this hardening package.

## 3) Authorization And RLS Change Checks

1. Confirm no active RLS cutover is applied.
2. Confirm no patient/clinical table policy replacement is applied.
3. Confirm helper work remains pre-cutover and validation-oriented.

## 4) Auth Activation Checks

1. Confirm Supabase Auth is not enabled by default.
2. Confirm transitional auth paths remain controlled and non-forced.
3. Confirm localStorage remains transitional and not represented as final security boundary.

## 5) Migration And Environment Safety Checks

1. Confirm no production migration apply was executed.
2. Confirm staging execution remains pending when access is missing.
3. Confirm no staging pass is claimed without evidence.

## 6) Backend Boundary Checks

1. Confirm staff invitation and bootstrap privileged operations are server-side only.
2. Confirm no client path uses service-role operations directly.
3. Confirm endpoint access controls remain server-validated.

## 7) Operational Limitation Documentation Checks

1. Confirm audit limitations and expectations are documented.
2. Confirm idempotency limitations and staging/production strategy notes are documented.
3. Confirm rate-limit limitations and distributed production requirement are documented.

## 8) Reviewer Signoff Fields

- Security reviewer:
- Date:
- Result: Pass / Conditional Pass / Fail
- Open issues:
- Required remediation before merge:
