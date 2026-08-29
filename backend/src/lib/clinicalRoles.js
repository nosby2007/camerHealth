// ─── CameroHealth — Shared clinical role sets ───────────────────────────────
// A single source of truth for which staff roles may write to clinical data,
// so the boundary lives in one place instead of being re-typed (and drifting)
// route by route. FRONT_DESK, SOCIAL_WORKER, BILLING, RECORDS, LAB, IMAGING
// and PHARMACY are deliberately excluded from CLINICAL_WRITE_ROLES — those
// roles operate their own domain (registration, case management, billing,
// diagnostics, dispensing) and never write encounters, orders, notes, or
// prescriptions directly.
const CLINICAL_WRITE_ROLES = ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR']

// Nurse-only charting (vitals entry, nursing notes) — narrower than
// CLINICAL_WRITE_ROLES: doctors/NPs have their own "Medical" charting path
// and should not also see/use the nurse charting form.
const NURSE_CHART_ROLES = ['NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR']

// Who may write a prescription (create/modify a Medication order).
const PRESCRIBER_ROLES = ['ADMIN', 'DOCTOR', 'NP', 'NURSE']

const LAB_ROLES = ['ADMIN', 'LAB']
const IMAGING_ROLES = ['ADMIN', 'IMAGING']
const PHARMACY_ROLES = ['ADMIN', 'PHARMACY']

module.exports = {
  CLINICAL_WRITE_ROLES,
  NURSE_CHART_ROLES,
  PRESCRIBER_ROLES,
  LAB_ROLES,
  IMAGING_ROLES,
  PHARMACY_ROLES
}
