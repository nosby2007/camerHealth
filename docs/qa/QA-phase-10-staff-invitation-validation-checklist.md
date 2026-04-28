# QA Phase 10: Staff Invitation Validation Checklist

## Scope

Validate the frontend scaffold and backend contract assumptions for secure staff invitation mode.

## Preconditions

- `ENABLE_SUPABASE_AUTH=false` for regression checks.
- `ENABLE_SUPABASE_AUTH=true` for invitation-mode checks.
- Optional `STAFF_INVITE_ENDPOINT` configured only when a secure backend endpoint exists.

## Legacy Regression Checks

- With `ENABLE_SUPABASE_AUTH=false`, confirm [pages/admin/staff.vue](pages/admin/staff.vue) still supports local password-based account creation.
- Confirm password reset and deactivation actions still behave exactly as before.

## Invitation Mode Checks

- With `ENABLE_SUPABASE_AUTH=true`, confirm [pages/admin/staff.vue](pages/admin/staff.vue) shows the invitation warning banner.
- Confirm the create form no longer requests an initial password in invitation mode.
- Confirm the submit button label changes from account creation to invite sending.
- Confirm the page still lists existing staff without regression.

## Backend Endpoint Checks

- With `STAFF_INVITE_ENDPOINT` unset, confirm submit fails with a clear pending-backend message.
- With a stub backend returning `200`, confirm the UI shows a success toast and resets the create form.
- With a stub backend returning `400`, `403`, `404`, `409`, and `500`, confirm the mapped error messages are user-visible and do not mutate local staff state.

## Security Checks

- Confirm no invite flow introduces any service-role or secret key into [nuxt.config.js](nuxt.config.js) public config.
- Confirm no invite flow stores Supabase tokens in localStorage.
- Confirm local prototype `createStaffAccount` is not called when invitation mode is enabled.

## Operational Follow-Up

- Add integration coverage once the backend endpoint exists.
- Add audit-log verification once the server implementation persists invite events.