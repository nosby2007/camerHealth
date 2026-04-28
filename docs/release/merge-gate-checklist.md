# Merge Gate Checklist

## Scope

Define merge gates that must pass before this hardening branch is considered merge-ready.

## Required Gates

1. Build must pass:
- npm run build executes successfully on current branch.
2. Staging access must be granted:
- staging Supabase project access and reviewer/tester access confirmed.
3. Phase 17 must be executed with real evidence:
- pending execution report updated with actual staging outputs.
4. Cross-tenant denial must pass:
- all required denial tests show expected deny outcomes.
5. Reviewer signoff required:
- QA reviewer and security reviewer signoffs recorded.

## No-Go Conditions

1. Staging validation not executed with real data.
2. Any cross-tenant false positive.
3. Any unresolved blocker/high security issue.
4. Incomplete evidence package.
5. Any claim of staging pass without traceable outputs.

## Rollback Requirements

1. Stop merge progression if blocker appears during staging validation.
2. Revoke invalid fixtures/assignments used during failed validation runs.
3. Re-run validation with corrected fixtures and evidence capture.
4. Keep no-go status until blocker closure and reviewer re-signoff.

## Final Merge Decision Fields

- Decision owner:
- Decision date:
- Decision: Go / No-Go
- Evidence package reference:
- QA signoff:
- Security signoff:
- Follow-up items:
