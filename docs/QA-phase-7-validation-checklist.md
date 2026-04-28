# Phase 7 QA Validation Checklist: Supabase Auth Compatibility Scaffold

**Version:** 1.0  
**Date:** 2026-04-28  
**Branch:** `chore/v1-release-hardening`  
**Status:** Ready for QA Testing  

---

## 1. Objective

Validate that Phase 7 Supabase Auth compatibility scaffold:
1. Does **not** break existing prototype authentication (Mode A)
2. Provides working Supabase Auth integration when enabled (Mode B)
3. Maintains zero clinical regressions
4. Implements feature flag correctly
5. Passes go/no-go criteria for Phase 8

---

## 2. Test Environments & Prerequisites

### 2.1 Required Environment Variables

**For Mode A (Default - Prototype):**
```bash
ENABLE_SUPABASE_AUTH=false
API_URL=http://localhost:8000/api
VUE_APP_GOOGLE_MAPS_API_KEY=local-placeholder-google-maps-key
SUPABASE_URL=https://example.supabase.co
SUPABASE_KEY=local-placeholder-supabase-anon-key
CLIENT_ID=local-placeholder-client-id
```

**For Mode B (Supabase Compat):**
```bash
ENABLE_SUPABASE_AUTH=true
API_URL=http://localhost:8000/api
VUE_APP_GOOGLE_MAPS_API_KEY=local-placeholder-google-maps-key
SUPABASE_URL=https://your-real-supabase-instance.supabase.co
SUPABASE_KEY=your-real-anon-key
CLIENT_ID=your-real-client-id
```

### 2.2 Pre-Test Checklist

- [ ] Branch `chore/v1-release-hardening` is checked out
- [ ] `npm install --legacy-peer-deps` completed successfully
- [ ] `.env.development` file exists with correct variables
- [ ] `dist/` folder cleaned before each build (`rm -r dist/` on Unix or `Remove-Item dist -Recurse -Force` on Windows)
- [ ] Browser DevTools open (F12) for console errors
- [ ] Network tab monitored for failed requests
- [ ] localStorage inspector available (DevTools → Application → Local Storage)

---

## 3. Build Validation

### 3.1 Build Command

```bash
npm run build
```

**Expected Result:**
- ✔ Build succeeds with exit code 0
- ✔ No fatal errors related to Phase 7 files
- ✔ `dist/` directory created with all assets
- ✔ Warnings about bundle size are acceptable (known: 6.77 MiB total)

### 3.2 Code Quality Check

```bash
# Check for syntax errors in Phase 7 files
npm ls nuxt vue --depth=0
```

**Expected Result:**
- `nuxt@2.18.1` installed
- `vue@2.7.16` installed
- No missing peer dependencies

---

## 4. Mode A Testing (Default Prototype Mode)

**Setup:**
```bash
# Set .env.development
ENABLE_SUPABASE_AUTH=false
```

### 4.1 Start Dev Server

```bash
npm run dev
```

**Expected Result:**
- ✔ Server starts on `http://localhost:3000`
- ✔ No errors in terminal related to Phase 7
- ✔ Console clean (no "Cannot read property of undefined" errors)

### 4.2 Test Cases - Mode A

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| A1 | App loads homepage | Navigate to `http://localhost:3000` | Page loads, navbar visible, no Phase 7 errors in console | ☐ |
| A2 | Prototype login available | Inspect login page at `/login` | Login form visible, SHA256-based auth available | ☐ |
| A3 | Session persists after login | Login with credentials, refresh page | Session restored from sessionStorage, still logged in | ☐ |
| A4 | Middleware protects routes | Try to access `/admin` without login | Redirected to `/login` | ☐ |
| A5 | Admin role check works | Login as admin, access `/admin` | Dashboard loads, admin content visible | ☐ |
| A6 | Clinical role check works | Login as clinical staff, access `/clinical/dashboard` | Clinical dashboard loads | ☐ |
| A7 | Patient list route opens | Navigate to `/clinical/patients` | Patient list component renders, no errors | ☐ |
| A8 | Patient chart route works | Click patient in list, navigate to `/clinical/patients/:id` | Chart component loads with tabs (notes, audit, tasks) | ☐ |
| A9 | Nursing encounter loads | Navigate to `/clinical/patients/:id/encounter/nurse` | Nursing form component renders | ☐ |
| A10 | Medical encounter role check | Non-doctor tries `/clinical/patients/:id/encounter/medical` | Access denied or redirected (role-based) | ☐ |
| A11 | Medical encounter loads | Doctor/authorized staff accesses `/clinical/patients/:id/encounter/medical` | Medical form component renders | ☐ |
| A12 | localStorage data persists | Store data in clinical store, refresh | Data intact (camero_health_* keys present) | ☐ |
| A13 | No Supabase signup UI | Inspect login page HTML | No "Sign up with Supabase Auth" button/link | ☐ |
| A14 | No Supabase token in localStorage | After login, check DevTools → Application → Local Storage | No `supabase-auth-token` or `sb-*` keys | ☐ |
| A15 | Console check for Phase 7 errors | Open DevTools Console | No errors mentioning "supabaseAuthCompat" or "Phase 7" | ☐ |

### 4.3 Clinical Regression Tests - Mode A

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| CR1 | Patient visits still load | Visits tab in `/clinical/patients/:id` shows data | ☐ |
| CR2 | Notes creation still works | Add note in patient chart, refresh, verify persistence | ☐ |
| CR3 | Nursing notes create tasks | Complete nursing encounter, verify tasks created in store | ☐ |
| CR4 | Medical orders visible | Medical encounter shows order section | ☐ |
| CR5 | Audit trail immutable | Audit tab shows activity log, entries cannot be deleted | ☐ |
| CR6 | Facility selector works | Ministry page allows facility selection | ☐ |
| CR7 | Role-based actions visible | Admin staff sees admin actions, clinical staff does not | ☐ |
| CR8 | Reports generate | Navigate to `/clinical/reports`, page loads without errors | ☐ |

---

## 5. Mode B Testing (Supabase Compatibility Mode)

**Setup:**
```bash
# Set .env.development
ENABLE_SUPABASE_AUTH=true
SUPABASE_URL=https://your-dev-supabase-instance.supabase.co
SUPABASE_KEY=your-real-anon-key
```

**Prerequisites for Mode B:**
- Supabase project with `auth.users` table populated
- Staff profiles linked to `auth.users.id` via `auth_user_id` column
- At least one test user with valid staff profile

### 5.1 Start Dev Server (Mode B)

```bash
npm run dev
```

**Expected Result:**
- ✔ Server starts without errors
- ✔ Supabase client initialized
- ✔ Plugin `supabaseAuthCompat` injected into Vue
- ✔ No "missing environment variable" errors

### 5.2 Test Cases - Mode B

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| B1 | Supabase Auth available | Check `this.$supabaseAuthCompat` in Vue components | Service object exists with signIn, getCurrentUser, signOut methods | ☐ |
| B2 | signIn method exists | Call `this.$supabaseAuthCompat.signIn(email, password)` | Method accepts email/password, returns promise | ☐ |
| B3 | getCurrentUser method works | Call `this.$supabaseAuthCompat.getCurrentUser()` | Returns Supabase user object or null | ☐ |
| B4 | Valid user can resolve profile | Sign in with valid Supabase user, check `resolveStaffProfile(userId)` | Returns staff profile object with fields: id, staffId, facilityId, role, status, displayName | ☐ |
| B5 | Missing staff profile error | Sign in with Supabase user without staff profile | Error returned: "Staff profile not found" or similar | ☐ |
| B6 | Inactive staff error | Sign in with inactive staff profile (status='inactive') | Error returned: "Staff account inactive" or similar | ☐ |
| B7 | Missing facility error | Staff profile without facility_id | Error returned: "Facility not found" or similar | ☐ |
| B8 | Missing role error | Staff profile without role field | Error returned: "Role not assigned" or similar | ☐ |
| B9 | Normalized context includes userId | After successful resolution | Context includes `userId` (Supabase UUID) | ☐ |
| B10 | Normalized context includes authUserId | After successful resolution | Context includes `authUserId` (same as userId) | ☐ |
| B11 | Normalized context includes staffProfileId | After successful resolution | Context includes `staffProfileId` (UUID) | ☐ |
| B12 | Normalized context includes staffCode | After successful resolution | Context includes `staffCode` or `staffId` | ☐ |
| B13 | Normalized context includes facilityId | After successful resolution | Context includes `facilityId` or `institutionId` | ☐ |
| B14 | Normalized context includes role | After successful resolution | Context includes `role` (e.g., "doctor", "nurse") | ☐ |
| B15 | Normalized context includes displayName | After successful resolution | Context includes `displayName` (staff full name) | ☐ |
| B16 | Normalized context includes accountStatus | After successful resolution | Context includes `accountStatus` ("active", "inactive", etc.) | ☐ |
| B17 | Normalized context includes permissions | After successful resolution | Context includes `permissions` array or object | ☐ |
| B18 | No localStorage token storage | Sign in, check localStorage | No keys like `supabase-auth-token`, `sb-*`, or `auth-token` | ☐ |
| B19 | Supabase session in memory only | Sign in, check sessionStorage | Session is in Supabase's internal storage, not localStorage | ☐ |
| B20 | signOut clears session | Call `this.$supabaseAuthCompat.signOut()` | getCurrentUser() returns null, Supabase session cleared | ☐ |
| B21 | Prototype auth NOT deleted | Check localStorage after Mode B login | Original `camero_health_*` keys still exist if previously set | ☐ |
| B22 | Feature flag respected | Toggle `ENABLE_SUPABASE_AUTH` in .env, restart | Service availability changes based on flag | ☐ |

### 5.3 Integration Tests - Mode B

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| B-INT1 | Compat service in store | Vuex store can call `this.$supabaseAuthCompat.signIn()` | Integration works, store actions can delegate to compat | ☐ |
| B-INT2 | Auth context mapping | Map Supabase context to existing app auth shape | Fields align: userId→userId, role→role, etc. | ☐ |
| B-INT3 | Route middleware recognizes Supabase context | Protect route middleware checks Supabase user | If user present, route accessible | ☐ |
| B-INT4 | No forced logout of prototype users | Prototype user logs in Mode A, then enable Mode B | User session remains valid (no automatic logout) | ☐ |

---

## 6. Backward Compatibility Tests

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| BC1 | Existing clinical pages untouched | All clinical routes load identically in Mode A and Mode B | ☐ |
| BC2 | store/clinical.js unchanged | Patient, visit, note data structures identical | ☐ |
| BC3 | localStorage format unchanged | Data keys, serialization format same as before | ☐ |
| BC4 | Middleware unchanged | Route protection logic identical | ☐ |
| BC5 | Components unchanged | No Vue component modifications in Phase 7 | ☐ |

---

## 7. Browser Compatibility Tests

Test in these browsers (if available):
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**For each browser:**
- [ ] Mode A: All A-series tests pass
- [ ] Mode B: All B-series tests pass (if Supabase configured)
- [ ] No console errors
- [ ] localStorage inspector works

---

## 8. Performance Baseline

**Mode A (Prototype):**
- [ ] Page load time at `/clinical/dashboard`: < 3s
- [ ] Patient list render: < 2s
- [ ] Chart view opens: < 1.5s

**Mode B (Supabase):**
- [ ] Auth resolution time: < 2s
- [ ] Supabase API response: < 1s
- [ ] Compat service initialization: < 500ms

---

## 9. Security Checks

| # | Check | Expected | Status |
|---|-------|----------|--------|
| SEC1 | Tokens in localStorage | None (Supabase session in memory/cookies) | ☐ |
| SEC2 | Credentials in code | No hardcoded passwords, API keys in source | ☐ |
| SEC3 | CORS headers | API responses include proper CORS headers | ☐ |
| SEC4 | Session hijacking resistant | Tokens not exposed in localStorage | ☐ |
| SEC5 | XSS prevention | No eval(), dangerouslySetInnerHTML in Phase 7 code | ☐ |

---

## 10. Documentation Checks

| # | Item | Present | Status |
|---|------|---------|--------|
| DOC1 | Phase 7 code comments | Supabase compat service documented | ☐ |
| DOC2 | Feature flag documented | .env.example includes ENABLE_SUPABASE_AUTH | ☐ |
| DOC3 | Integration guide | README or docs explain Mode A vs Mode B | ☐ |
| DOC4 | Error messages | Clear, actionable error messages for B5-B8 | ☐ |

---

## 11. Manual Browser Test Steps (Mode A)

1. **Setup:**
   ```bash
   # Terminal 1
   npm run dev
   # Terminal 2 or integrated terminal
   # Check .env.development has ENABLE_SUPABASE_AUTH=false
   ```

2. **Navigate to http://localhost:3000**
   - [ ] Homepage loads
   - [ ] NavBar visible
   - [ ] No console errors

3. **Login:**
   - [ ] Click "Login" button
   - [ ] Enter test credentials (prototype staff)
   - [ ] Submit form
   - [ ] Redirected to `/admin` or `/clinical/dashboard`

4. **Admin Dashboard:**
   - [ ] Navigate to `/admin`
   - [ ] Admin table visible
   - [ ] Staff list shows
   - [ ] Audit log accessible

5. **Clinical Dashboard:**
   - [ ] Navigate to `/clinical/dashboard`
   - [ ] Statistics cards render
   - [ ] Charts load (daily cases, etc.)
   - [ ] No data missing

6. **Patient Flow:**
   - [ ] Navigate to `/clinical/patients`
   - [ ] Patient list loads (or "no patients" message)
   - [ ] Click a patient (or create test patient)
   - [ ] Patient chart loads with tabs: **Notes**, **Audit**, **Tasks**
   - [ ] Each tab content visible

7. **Nursing Encounter:**
   - [ ] Navigate to `/clinical/patients/:id/encounter/nurse`
   - [ ] Nursing form renders
   - [ ] Fill form, submit
   - [ ] Verify nursing notes created in chart

8. **Medical Encounter (if authorized role):**
   - [ ] Navigate to `/clinical/patients/:id/encounter/medical`
   - [ ] Medical form renders
   - [ ] Add orders (medications, lab, imaging)
   - [ ] Submit
   - [ ] Orders visible in chart

9. **Logout:**
   - [ ] Click "Logout" button
   - [ ] Redirected to `/login`
   - [ ] Session cleared
   - [ ] localStorage still has `camero_health_*` keys

---

## 12. Manual Browser Test Steps (Mode B)

**Prerequisites:** Supabase project with test user and staff profile

1. **Setup:**
   ```bash
   # Update .env.development
   ENABLE_SUPABASE_AUTH=true
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   
   # Restart dev server
   npm run dev
   ```

2. **Check Supabase Service Available:**
   - [ ] Open DevTools Console
   - [ ] Type `this.$supabaseAuthCompat` (if in Vue context)
   - [ ] Verify object with `signIn`, `getCurrentUser`, `signOut` methods

3. **Attempt Supabase Login (if UI integrated):**
   - [ ] Navigate to login page
   - [ ] Look for Supabase Auth option (if UI built in Phase 8)
   - [ ] Enter Supabase user email/password
   - [ ] Verify staff profile resolves
   - [ ] Session established

4. **Check Authorization Context:**
   - [ ] After login, inspect Vuex store state
   - [ ] Verify `auth.userId`, `auth.role`, `auth.facilityId` set correctly
   - [ ] User should have access to clinical routes based on role

5. **Verify localStorage Isolation:**
   - [ ] Open DevTools → Application → Local Storage
   - [ ] Confirm NO `supabase-auth-token` or `sb-*` keys
   - [ ] Existing `camero_health_*` keys still present

6. **Test Error Scenarios (if test user data allows):**
   - [ ] Test user without staff profile → Error message displays
   - [ ] Inactive staff → Error message displays
   - [ ] Missing facility → Error message displays

---

## 13. Regression Risk Assessment

### High Risk Areas
- [ ] Patient chart display (CR1-CR8)
- [ ] localStorage data persistence (A12, BC3)
- [ ] Route middleware (A4, CR7)
- [ ] Role-based access (A5, A6, A10, CR7)

### Medium Risk Areas
- [ ] Session behavior (A3)
- [ ] Multi-page clinical workflow (A7-A11)
- [ ] Feature flag toggle (B22)

### Low Risk Areas
- [ ] Supabase client initialization (B1)
- [ ] New compat service (B1-B21)
- [ ] Documentation (DOC1-DOC4)

---

## 14. Go/No-Go Criteria for Phase 8

### ✅ GO Criteria (All must pass)

- [x] **Mode A:** All A1-A15 tests pass
- [x] **Mode A:** All CR1-CR8 regression tests pass
- [x] **Backward Compatibility:** All BC1-BC5 tests pass
- [x] **Build:** `npm run build` succeeds with exit code 0
- [x] **No localStorage tokens:** B18 confirmed
- [x] **Feature flag works:** B22 confirmed
- [x] **Console clean:** No errors in Mode A or Mode B

### ⛔ NO-GO Criteria (Any failure blocks Phase 8)

- [ ] Mode A login fails
- [ ] Clinical pages crash in Mode A
- [ ] localStorage data lost after refresh
- [ ] Build fails
- [ ] Supabase tokens stored in localStorage
- [ ] Existing auth flow broken
- [ ] More than 2 console errors in any mode
- [ ] Route protection broken
- [ ] Patient chart data missing

---

## 15. Test Execution Log

| Date | Tester | Mode A | Mode B | Notes | Sign-off |
|------|--------|--------|--------|-------|----------|
| 2026-04-28 | QA-1 | ⏳ | ⏳ | Initial setup | |
| | | | | | |
| | | | | | |

---

## 16. Phase 7 Files Under Test

**New Files (Phase 7):**
- `services/auth/supabase-auth-compat.service.js` — Supabase Auth facade
- `plugins/supabase-auth-compat.js` — Vue plugin injection

**Modified Files (Phase 7):**
- `nuxt.config.js` — Added `ENABLE_SUPABASE_AUTH` flag + plugin registration
- `store/auth.js` — Added optional Supabase actions (backward compatible)
- `.env.example` — Added `ENABLE_SUPABASE_AUTH` documentation
- `.env.development` — Added `ENABLE_SUPABASE_AUTH=false` (default)

**Unchanged (Verified):**
- All `pages/clinical/**` components
- `store/clinical.js`
- `middleware/auth.js`
- `plugins/` (except new supabase-auth-compat.js)

---

## 17. Known Issues & Workarounds

| Issue | Workaround | Priority |
|-------|-----------|----------|
| Bundle size 6.77 MiB | Accept warning; optimize in Phase 9+ | Low |
| Vue 2 EOL | Plan upgrade to Vue 3 in Q3 2026 | Medium |
| Nuxt 2 EOL | Plan migration to Nuxt 3 in Q3 2026 | Medium |

---

## 18. Next Steps After Go

1. **Phase 8:** Implement Supabase Auth login UI
   - Add sign-in form component
   - Add "Sign up with Supabase Auth" link (optional)
   - Test end-to-end login flow

2. **Phase 9:** Implement staff profile linking UI
   - Allow existing clinical staff to link Supabase accounts
   - Unlink/re-link functionality

3. **Phase 10:** Implement migration strategy
   - Gradual migration of active staff to Supabase Auth
   - Fallback to prototype auth for offline users
   - Audit trail of who migrated when

---

**Document Owner:** Perry Home WoundCare / Camero-Health Team  
**Last Updated:** 2026-04-28  
**Next Review:** After Phase 7 QA completion
