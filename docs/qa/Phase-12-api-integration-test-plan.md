# Phase 12 API Integration Test Plan (Documentation Scaffold)

## Why Documentation-Only

This repository currently has no dedicated API test framework wired for serverless route integration execution in CI.

Chosen option: documentation-only integration test plan (Option B).

## Test Matrix

## Bootstrap /api/bootstrap/facility-admin

1. Success first bootstrap
- Input: valid payload, unique facility/admin email
- Expect: 201 FACILITY_ADMIN_BOOTSTRAPPED, status completed, correlationId present

2. Duplicate email
- Input: existing auth email
- Expect: safe conflict/failure path, no sensitive leakage

3. Duplicate facility
- Input: payload causing facility uniqueness conflict
- Expect: FACILITY_CONFLICT

4. Missing required fields
- Input: omit adminPassword
- Expect: INVALID_BOOTSTRAP_PAYLOAD

5. Weak password
- Input: weak value
- Expect: INVALID_BOOTSTRAP_PAYLOAD

6. Supabase auth failure
- Input: simulate admin createUser error
- Expect: BOOTSTRAP_AUTH_CREATE_FAILED

7. DB insert failure
- Input: simulate facilities insert error
- Expect: FACILITY_CREATE_FAILED and rollback attempt for created auth user

8. Partial failure behavior
- Input: simulate staff_profiles insert error after facility create
- Expect: ADMIN_PROFILE_CREATE_FAILED, facility marked inactive, rollback attempt for auth user

9. Idempotency same key same payload
- Input: repeat request with same idempotency key
- Expect: replayed response

10. Idempotency same key different payload
- Input: same key changed payload
- Expect: IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD

## Invite /api/admin/staff/invite

1. Active admin invites nurse
- Input: valid admin token + role NURSE
- Expect: 201 STAFF_INVITED status pending

2. Non-admin rejected
- Input: token for non-admin
- Expect: 403 CALLER_NOT_ADMIN

3. Inactive admin rejected
- Input: token for inactive admin
- Expect: 403 CALLER_NOT_ACTIVE

4. Invalid role rejected
- Input: role = UNKNOWN
- Expect: INVALID_INVITE_PAYLOAD

5. Duplicate staffCode rejected
- Input: conflicting staffCode
- Expect: INVITE_CONFLICT

6. Duplicate email handling
- Input: email already invited/profile exists
- Expect: conflict or resend flow with safe response

7. Client supplied facility_id ignored/rejected
- Input: include facility_id
- Expect: INVALID_INVITE_PAYLOAD

8. Backend unavailable
- Input: remove service role env
- Expect: INVITE_BACKEND_UNAVAILABLE

9. Idempotency same key same payload
- Input: repeat same invite request key/payload
- Expect: replayed response

10. Invite failure audit event
- Input: force profile insert error
- Expect: AUTH_STAFF_INVITE_FAILED in audit log

## Execution Notes

- Run in staging only.
- Capture correlation IDs for every test.
- Validate response bodies do not expose provider internals.
- Archive results per test case with request payload fingerprint and response code.
