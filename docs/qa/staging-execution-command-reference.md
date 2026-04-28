# Staging Execution Command Reference

## Scope

Reference commands for local readiness and later staging validation execution.

## 1) Local Build Commands

```powershell
npm run build
```

Optional git context capture:

```powershell
git rev-parse HEAD
git status --short
```

## 2) Local API Testing Commands Where Applicable

Only run against approved local or staging URLs, never production.

Bootstrap endpoint example:

```powershell
curl -X POST http://localhost:3000/api/bootstrap/facility-admin ^
  -H "Content-Type: application/json" ^
  -H "X-Correlation-Id: local-phase18-bootstrap-check" ^
  -d "{\"facilityName\":\"Test Facility\",\"facilityCode\":\"TEST001\",\"adminEmail\":\"admin@example.com\",\"adminPassword\":\"ChangeMe123!\",\"firstName\":\"Test\",\"lastName\":\"Admin\"}"
```

Staff invite endpoint example:

```powershell
curl -X POST http://localhost:3000/api/admin/staff/invite ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <staging_or_local_test_token>" ^
  -H "X-Correlation-Id: local-phase18-invite-check" ^
  -d "{\"email\":\"staff@example.com\",\"role\":\"NURSE\",\"firstName\":\"Test\",\"lastName\":\"Staff\"}"
```

## 3) Staging SQL Execution Steps

Primary script to open in staging SQL console:

1. [supabase/tests/phase15_multiscope_helper_validation.sql](supabase/tests/phase15_multiscope_helper_validation.sql)

Execution sequence reference:

1. Confirm staging project reference.
2. Replace placeholders with fixture UUIDs.
3. Run baseline helper checks.
4. Run matrix blocks.
5. Run cross-tenant denial checks.
6. Run expired/inactive assignment checks.
7. Run compatibility checks.
8. Run break-glass checks.
9. Export evidence.

## 4) SQL Queries To Verify Policy Safety

```sql
select policyname, tablename
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## 5) Evidence Capture Commands / Exports

Record manually from approved tools:

1. SQL result exports from staging console.
2. Screenshot capture from staging project header/reference.
3. API request/response logs from staging platform if applicable.

## 6) Commands Blocked Until Staging Access Exists

1. Direct staging SQL execution.
2. Staging endpoint curl commands.
3. Staging log inspection commands.
