# QA Phase 8 Login Validation Checklist

Date: 2026-04-28  
Branch: chore/v1-release-hardening  
Scope: Phase 8 only (feature-flagged Supabase login integration)

## Preconditions

- .env.development is present and complete
- No deployment actions are performed
- Clinical pages are not modified
- store/clinical.js is not modified
- Existing prototype login path remains in place

Required variables:

- API_URL
- VUE_APP_GOOGLE_MAPS_API_KEY
- SUPABASE_URL
- SUPABASE_KEY
- CLIENT_ID
- ENABLE_SUPABASE_AUTH

## Build Validation

Run:

```bash
npm run build
```

Expected:

- Build exits with code 0
- No auth-related compile errors

## Mode A (ENABLE_SUPABASE_AUTH=false)

Goal: old prototype login must behave exactly as before.

1. App starts
- Step: `npm run dev`, open `/`
- Expected: app loads normally

2. Existing prototype login works
- Step: go to `/login`, use staff ID + password + role
- Expected: login succeeds for valid credentials

3. Dashboard redirects still correct
- Step: login as ADMIN, DOCTOR/NURSE, LAB, IMAGING
- Expected: redirects to role home (`/admin`, `/clinical/dashboard`, `/clinical/lab`, `/clinical/imaging`)

4. Middleware still works
- Step: try protected routes while logged out
- Expected: redirected by middleware as before

5. No Supabase login forced
- Step: inspect `/login`
- Expected: role selector visible, Staff ID field visible, no forced email-only path

6. Clinical routing unaffected
- Step: open patient chart route from existing flow
- Expected: route opens, no regression from auth integration

## Mode B (ENABLE_SUPABASE_AUTH=true)

Goal: /login uses Supabase compat path and keeps middleware-compatible auth state.

1. Login path switches to Supabase compat
- Step: open `/login`
- Expected: informational banner shown, email field shown, role selector hidden

2. Invalid credentials error
- Step: submit invalid email/password
- Expected: clear message `Invalid email or password.`

3. Missing staff profile error
- Step: valid auth user without linked `staff_profiles.auth_user_id`
- Expected: clear message indicating missing linked staff profile

4. Inactive staff profile error
- Step: valid auth user with status != active
- Expected: clear message indicating inactive staff account

5. Missing facility error
- Step: linked profile without facility_id
- Expected: clear message indicating missing facility assignment

6. Missing role error
- Step: linked profile without role
- Expected: clear message indicating missing role assignment

7. Successful linked profile login
- Step: valid user linked to active staff profile with facility + role
- Expected: session committed, middleware-compatible state (`isAuthenticated`, `role`, `staffId`, `facilityId`)

8. Correct role redirect
- Step: successful login for each role
- Expected: redirect to expected role dashboard

9. No Supabase token in localStorage
- Step: check browser localStorage after login
- Expected: no `sb-*`/Supabase token keys in localStorage

10. Prototype auth still exists
- Step: set flag back to false and retry prototype login
- Expected: old flow still works

## Error Handling Matrix

- INVALID_CREDENTIALS -> Invalid email or password.
- STAFF_PROFILE_NOT_FOUND -> linked staff profile missing
- STAFF_PROFILE_INACTIVE -> inactive account
- FACILITY_MISSING -> missing facility assignment
- ROLE_MISSING -> missing role assignment
- SUPABASE_AUTH_FAILURE -> generic Supabase auth failure

## Transitional Notes

- This is a feature-flagged transitional cutover path.
- TODO placeholders exist for backend audit event emission (success/failure).
- No audit persistence is implemented in Phase 8.
