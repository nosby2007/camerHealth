/**
 * identity.js — CameroHealth Staff Identity Generator
 *
 * Staff ID format:  {OrgPrefix}-{RoleCode}{SEQ}
 *   OrgPrefix  : 2 uppercase letters + 2 digits chosen by the organisation at setup (e.g. RH01).
 *                Must be unique across all organisations.
 *   RoleCode   : first 3 uppercase letters of the role key (e.g. ADM, DOC, NUR, MID…)
 *   SEQ        : 3-digit zero-padded sequential counter (001, 002…)
 *
 * Examples: RH01-ADM001  RH01-DOC001  RH01-NUR003  BC47-MID002
 *
 * Staff email format: {staffId.toLowerCase()}@{facilityDomain}
 *   where facilityDomain is derived from the facility's official email domain,
 *   or defaults to "<orgPrefix.toLowerCase()>.camerohealth.cm"
 */

// ── Role → 3-letter code mapping ─────────────────────────────────────────────
const ROLE_CODES = {
  ADMIN:              'ADM',
  DOCTOR:             'DOC',
  NP:                 'NPC',   // Nurse Practitioner/Clinician
  NURSE:              'NUR',
  CNA:                'CNA',
  MAJOR_SERVICE:      'MAJ',
  NURSING_SUPERVISOR: 'SUV',
  MIDWIFE:            'MID',
  LAB:                'LAB',
  IMAGING:            'IMG',
  DENTIST:            'DEN',
  ANESTHESIOLOGIST:   'ANE',
  PHYSIOTHERAPIST:    'KIN',
  PHARMACY:           'PHM',
  BILLING:            'BIL',
  RECORDS:            'REC',
  FRONT_DESK:         'FDK',
  SOCIAL_WORKER:      'SOC',
  BIOMEDICAL:         'BIO'
}

/**
 * Derive the role code for a given role key.
 * Falls back to the first 3 chars of the role string if not in the map.
 */
export function getRoleCode (role) {
  if (!role) return 'STF'
  return ROLE_CODES[role.toUpperCase()] || role.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'STF'
}

/**
 * Validate an org prefix (2 uppercase letters + 2 digits, e.g. RH01, BC47).
 * Returns true if valid, false otherwise.
 */
export function isValidOrgPrefix (prefix) {
  return /^[A-Z]{2}[0-9]{2}$/.test((prefix || '').toUpperCase())
}

/**
 * Normalise an org prefix to uppercase.
 */
export function normaliseOrgPrefix (prefix) {
  return (prefix || '').toUpperCase().trim()
}

/**
 * Generate the next sequential staff ID for a given role,
 * given the list of existing staff IDs already in the system.
 *
 * @param {string} orgPrefix   e.g. "RH01"
 * @param {string} role        e.g. "DOCTOR"
 * @param {string[]} existingIds  array of existing staff IDs in the facility
 * @returns {string}  e.g. "RH01-DOC003"
 */
export function generateStaffId (orgPrefix, role, existingIds = []) {
  const prefix = normaliseOrgPrefix(orgPrefix)
  const code   = getRoleCode(role)
  const pattern = new RegExp(`^${escapeRegex(prefix)}-${escapeRegex(code)}(\\d{3})$`, 'i')

  let max = 0
  ;(existingIds || []).forEach(id => {
    const m = (id || '').toUpperCase().match(pattern)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > max) max = n
    }
  })

  const seq = String(max + 1).padStart(3, '0')
  return `${prefix}-${code}${seq}`
}

/**
 * Derive the facility domain from the facility's official email.
 * Falls back to "<orgPrefix.toLowerCase()>.camerohealth.cm".
 *
 * @param {string} facilityEmail  e.g. "contact@regionalhospital.cm"
 * @param {string} orgPrefix      e.g. "RH01"
 * @returns {string}  e.g. "regionalhospital.cm"
 */
export function getFacilityDomain (facilityEmail, orgPrefix) {
  if (facilityEmail && facilityEmail.includes('@')) {
    const domain = facilityEmail.split('@')[1].trim().toLowerCase()
    if (domain) return domain
  }
  return `${(orgPrefix || 'fac').toLowerCase()}.camerohealth.cm`
}

/**
 * Generate the system-issued staff email from the staff ID and facility domain.
 *
 * @param {string} staffId       e.g. "RH01-DOC003"
 * @param {string} facilityDomain  e.g. "regionalhospital.cm"
 * @returns {string}  e.g. "rh01-doc003@regionalhospital.cm"
 */
export function generateStaffEmail (staffId, facilityDomain) {
  return `${(staffId || '').toLowerCase()}@${facilityDomain}`
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function escapeRegex (str) {
  return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
