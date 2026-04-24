# CameroHealth v1.0 Next Tasks

This roadmap is grounded in the current application state. It lists what already exists in the clinical section and what must be completed or hardened before a realistic version 1.0 launch.

---

## What already exists today

- Facility registration and first-time admin setup via `pages/register.vue`.
- Role-based facility login via `pages/login.vue` and session persistence in `store/auth.js`.
- Client-side route guarding for clinical and ministry layers in `middleware/auth.js`.
- Facility admin dashboard, staff account creation/reset, and audit log pages in `pages/admin/index.vue`, `pages/admin/staff.vue`, and `pages/admin/audit.vue`.
- Clinical hub and operational dashboard in `pages/clinical/dashboard.vue`.
- Core clinical workflows:
  - Patient registry and new patient intake in `pages/clinical/patients/index.vue` and `pages/clinical/patients/new.vue`.
  - Visit/incidence logging in `pages/clinical/visits.vue`.
  - Appointment scheduling in `pages/clinical/appointments.vue`.
  - Inpatient admission and discharge in `pages/clinical/inpatient.vue`.
  - Lab orders in `pages/clinical/lab.vue`.
  - Imaging orders in `pages/clinical/imaging.vue`.
  - Medication prescriptions in `pages/clinical/medications.vue`.
  - Billing and invoicing in `pages/clinical/billing.vue`.
- Local persistence for facility, staff, clinical records, and audit data via `localStorage` in `store/facility.js` and `store/clinical.js`.
- Supabase integration is present, but only as a telemetry sync path in `store/clinical.js` (`syncToSupabase`).

---

## 1. Authentication & Identity Management

### Current state
- Auth is handled in the browser by verifying staff credentials against `store/facility.js`.
- Facility/staff records and session state are browser-local (`localStorage`/`sessionStorage`).
- Passwords are hashed on the client side; there is no centralized auth provider, no refresh token workflow, and no account recovery.
- Role-based navigation is enforced by client middleware only.

### Why it matters
Production clinical systems require centralized identity, auditability, and multi-device staff access. Browser-only auth is fine for a prototype but not for mission-critical hospital use.

### Tasks
1. Migrate authentication from local browser state to a centralized backend.
   - Retain the current admin-first registration flow, but persist facility and staff accounts to a shared database.
   - Prefer Supabase Auth or an equivalent secure provider.
   - Implement a proper login session using JWTs with refresh tokens or secure server session cookies.
2. Keep role-aware routing but enforce it server-side.
   - Preserve the current `ADMIN`, `DOCTOR`, `NURSE`, `LAB`, `IMAGING` roles.
   - Add server-side APIs that verify role and facility membership for every action.
3. Add missing account lifecycle flows.
   - Build password reset / recovery flows for staff.
   - Add account deactivation, reactivation, and login audit events.
   - Consider MFA for admin and high-risk clinical roles in the first release.
4. Remove client-only auth secrets and hash logic.
   - Stop relying on client-side SHA-256 as the only password safeguard.
   - Move password hashing and verification to the backend.

---

## 2. Data Persistence & Multi-Tenancy

### Current state
- Clinical records are stored in Vuex state and persisted locally in `localStorage`.
- Facility and staff data are also saved only in `localStorage`.
- The only Supabase use is a telemetry insert path in `store/clinical.js`.

### Why it matters
A hospital-grade app must store patient and clinical data centrally and isolate it per facility. Local storage is not shared across devices and cannot provide audit or multi-user consistency.

### Tasks
1. Define the backend schema for v1.0.
   - Facilities, staff, patients, visits, appointments, inpatient admissions, medications, lab orders, imaging orders, invoices, and audit logs.
   - Each record must include `facility_id` and `created_by` / `updated_by` metadata.
   - Add patient identifiers such as MRN or facility-specific patient codes.
2. Persist all clinical and admin data to the backend.
   - Migrate `store/clinical.js` actions such as `registerPatient`, `logVisit`, `orderLab`, `orderImaging`, `scheduleAppointment`, `admitPatient`, `prescribeMedication`, and `createInvoice`.
   - Migrate `store/facility.js` staff/account actions to backend CRUD.
3. Use row-level security and tenant isolation.
   - Implement RLS in Supabase so each facility can only access its own records.
   - Authorize users by role and facility claims in JWTs.
4. Keep local storage only as an optional offline cache.
   - Use it for temporary UI state or offline fallback, not as the primary source of truth.

---

## 3. Clinical Workflow & Patient Records

### Current state
- Several clinical workflows are implemented in UI pages, but they are mostly disconnected record lists.
- There is no patient detail/profile page that aggregates history, orders, medications, admissions, and billing.
- Existing pages include:
  - Dashboard, patient registry, patient intake
  - Visit logging, lab orders, imaging orders
  - Appointment scheduling, inpatient admission, medications, billing

### Why it matters
Clinicians need patient-centered workflows, not separate data silos. A true clinical EHR must link encounters, orders, and results to an individual patient record.

### Tasks
1. Build patient profile/detail views.
   - Show demographics, contact info, identifiers, payment profile, and referral source.
   - Display a patient timeline with visits, orders, admissions, medications, and invoices.
2. Connect workflows to patient records.
   - Allow staff to create lab, imaging, medication, and billing entries from a patient page.
   - Make orders available to lab/imaging teams with patient context.
3. Add patient edit and longitudinal data.
   - Support editing patient demographics and key medical history after registration.
   - Add structured allergy, chronic condition, and emergency contact fields.
4. Improve encounter workflows.
   - Keep the clinical visit form, but make it part of a record-centered workflow rather than a standalone page.
   - Add structured SOAP notes, vital signs, and treatment plan fields.
   - Connect visit records to follow-up appointments and admissions.
5. Refine appointment and admission management.
   - Ensure appointment and inpatient records are routable from a patient chart.
   - Add status updates, provider assignment, and discharge summaries for inpatient care.

---

## 4. Facility Admin & Compliance

### Current state
- Admin pages exist for staff account creation, password reset, account deactivation, dashboard KPIs, and audit logs.
- All admin state is currently persisted in browser `localStorage`.

### Why it matters
The admin layer is essential for facility governance and must be reliable across browsers and devices, with an immutable audit trail.

### Tasks
1. Migrate admin account management to the backend.
   - Ensure staff accounts can log in from any device and do not rely on browser-local storage.
   - Keep the current admin UX, but persist staff, facility settings, and audit events centrally.
2. Harden the audit trail.
   - Continue recording events like `FACILITY_REGISTERED`, `ACCOUNT_CREATED`, `PASSWORD_RESET`, and `ACCOUNT_DEACTIVATED`.
   - Add login/logout event logging and patient access auditing for clinical records.
3. Expand facility settings for v1.0.
   - Store facility metadata such as address, region, contact email, timezone, services, and wards.
   - Add configurable payment and insurance options for billing.
4. Keep the admin dashboard focused on role-based operations.
   - Preserve quick links to patient registry, visit logging, audit log, and staff management.
   - Add operational KPIs reflecting actual clinical data once backend persistence is in place.

---

## 5. Security & Production Hardening

### Current state
- Auth and staff data are held in browser storage.
- Sensitive behavior is enforced on the client.
- Password hashing is client-side only.
- Supabase keys or protected config should not be exposed in the client.

### Why it matters
Clinical systems must protect patient and staff data at every layer. Prototype security is insufficient for live deployment.

### Tasks
1. Move all sensitive logic to the backend.
   - Remove client-side secret handling and hashing.
   - Use server-side or Supabase-managed auth for all protected operations.
2. Enforce secure session storage.
   - Prefer secure HTTP-only cookies for refresh tokens or managed session state.
   - Avoid using `localStorage` for auth tokens.
3. Secure deployment and headers.
   - Enforce HTTPS and add CSP / security headers.
   - Prevent clickjacking, XSS, and injection attacks.
4. Add validation and sanitization.
   - Validate all form data client-side and server-side.
   - Normalize patient IDs, phone numbers, emails, and dates.
5. Plan for audit and compliance.
   - Keep the existing audit log and expand it to include record access and admin actions.
   - Use tenant isolation and minimal access privileges.

---

## 6. UX & Clinical Product Polish

### Current state
- The app already has polished Vuetify-based pages and hospital-themed styling.
- UX is uneven because many workflows are separate and not tightly connected.

### Why it matters
A clinical app must be intuitive, fast, and consistent so staff can use it reliably under pressure.

### Tasks
1. Consolidate clinical navigation.
   - Show role-appropriate menus and hide irrelevant pages.
   - Add breadcrumbs, page headings, and contextual actions.
2. Improve patient search and filters.
   - Add MRN/patient ID search.
   - Add filters for status, service, provider, and department.
   - Make tables sortable and paginated.
3. Build patient- and encounter-centered task flows.
   - Turn page lists into drill-down workflows rather than independent screens.
   - Add clear next actions for clinicians on patient records.
4. Standardize UI behavior.
   - Use consistent chips and status colors across lab, imaging, inpatient, medications, and billing.
   - Make forms easier to scan with grouped sections and field-level help.
5. Add operational readiness features.
   - Add confirmation dialogs for destructive actions.
   - Add export/print support where useful (e.g. audit log, clinical report).
   - Add inline help or onboarding hints for new facility users.

---

## Priority milestones for v1.0

1. Centralized auth + facility/staff accounts backed by shared storage.
2. Backend persistence for core clinical records and tenant isolation.
3. Patient profile / chart experience that links visits, orders, admissions, and billing.
4. Admin account management and audit logging available across devices.
5. Security hardening from prototype mode to deployable clinical app.

---

## 8. Missing Hospital-Standard Functionality

### Current situation
The system is missing several core hospital capabilities that are required for a true v1 clinical release.

### Why it matters
Without structured clinical documentation, integrated orders, billing, and admissions support, the system cannot function as a hospital-grade clinical record system.

### Tasks
1. Add clinical documentation features.
   - Capture encounter notes.
   - Maintain a problem list.
   - Track allergies.
   - Record diagnoses.
   - Maintain medication history.

2. Add medication management.
   - Implement prescription ordering.
   - Show active medication lists.
   - Track dispensing and administration.
   - Add a pharmacy workflow placeholder.

3. Add appointment and visit management.
   - Support scheduling appointments.
   - Track patient check-in and check-out.
   - Assign providers to visits.
   - Record visit status updates.

4. Add inpatient management.
   - Support bed assignment.
   - Track ward placement.
   - Manage admit/discharge workflows.
   - Capture discharge summaries.

5. Add billing and invoicing.
   - Record charges by visit and order.
   - Include payment profile and insurance details.
   - Generate invoices.
   - Track payment status and receipts.

---

## 9. Release Readiness Checklist

### Implementation order
The tasks should be tackled in this order so the team can build a stable foundation before adding workflow detail:
1. Architecture and data model design
2. Centralized authentication and RBAC
3. Secure Supabase schema and RLS
4. Clinical patient profile and encounter flow
5. Facility admin account management
6. Superadmin and audit dashboards
7. Security hardening and compliance
8. UI/UX polish and clinical workflow validation
9. Testing, user acceptance, and release readiness

### Key release criteria
The first v1.0 release should satisfy all of these:
- Production-grade auth with secure sessions and MFA for sensitive roles.
- Staff and patient data access limited by facility and role.
- Clinical data is persisted in Supabase, not only in local browser state.
- Patient history is accessible from the patient listing and profile.
- Admin/staff accounts work across devices and sessions.
- Audit trails exist for all sensitive actions.
- Clinical workflows are present for visits, lab/imaging orders, medications, and patient records.
- The interface is consistent and usable for hospital staff.
- No hardcoded secrets or unsafe client-side authentication practices.

---

## 10. Key system gaps for version 1.0

These are the highest-level missing system capabilities that should shape the release plan:
1. Lack of multi-facility, multi-device staff account model.
2. Missing full patient profile with longitudinal history.
3. Missing cohesive clinical workflow for admissions, labs, imaging, medications, and billing.
4. Lack of backend-enforced security; current protections are only client-side.
5. Missing audit and compliance evidence trails for record access and admin actions.
6. No superadmin operations dashboard for developers and operators.
7. No formal compliance plan for data privacy and clinical security.
8. No strong facility-level tenant isolation strategy.
9. No defined credential recovery or incident handling process.
10. No standardized clinical data model or naming conventions.
