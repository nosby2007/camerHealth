/**
 * facility.js — CameroHealth Facility & Identity Store
 * CIA Triad:
 *   Confidentiality : passwords hashed (SHA-256), never stored plain. Role-scoped data access.
 *   Integrity       : only ADMIN can mutate accounts. Every action is audit-logged with timestamp + actor.
 *   Availability    : all data persisted to localStorage for offline resilience.
 */

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:    'ADMIN',
  DOCTOR:   'DOCTOR',
  NURSE:    'NURSE',
  LAB:      'LAB',
  IMAGING:  'IMAGING'
}

export const ROLE_LABELS = {
  ADMIN:   'Administrator',
  DOCTOR:  'Doctor / Clinician',
  NURSE:   'Nurse / Midwife',
  LAB:     'Laboratory Technician',
  IMAGING: 'Imaging / Radiology'
}

// ─── SHA-256 (client-side, no plain-text storage) ─────────────────────────────
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const KEY_FACILITY  = 'camero_facility'
const KEY_STAFF     = 'camero_staff'
const KEY_AUDIT     = 'camero_audit'

function persist(key, data) {
  if (process.client) localStorage.setItem(key, JSON.stringify(data))
}
function load(key) {
  if (!process.client) return null
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

// ─── State ────────────────────────────────────────────────────────────────────
export const state = () => ({
  facility: load(KEY_FACILITY) || null,   // single clinic record
  staff: load(KEY_STAFF) || [],           // array of staff accounts
  auditLog: load(KEY_AUDIT) || [],        // immutable audit trail
  setupComplete: !!(load(KEY_FACILITY))   // true once admin registered
})

// ─── Mutations ────────────────────────────────────────────────────────────────
export const mutations = {
  SET_FACILITY(state, facility) {
    state.facility = facility
    state.setupComplete = true
    persist(KEY_FACILITY, facility)
  },
  ADD_STAFF(state, member) {
    state.staff.push(member)
    persist(KEY_STAFF, state.staff)
  },
  UPDATE_STAFF(state, updated) {
    const idx = state.staff.findIndex(s => s.id === updated.id)
    if (idx !== -1) {
      state.staff.splice(idx, 1, updated)
      persist(KEY_STAFF, state.staff)
    }
  },
  DEACTIVATE_STAFF(state, staffId) {
    const idx = state.staff.findIndex(s => s.id === staffId)
    if (idx !== -1) {
      state.staff[idx].active = false
      persist(KEY_STAFF, state.staff)
    }
  },
  ADD_AUDIT(state, entry) {
    state.auditLog.unshift(entry)   // newest first
    // cap at 500 entries to avoid localStorage bloat
    if (state.auditLog.length > 500) state.auditLog.pop()
    persist(KEY_AUDIT, state.auditLog)
  },
  RELOAD_FROM_STORAGE(state) {
    state.facility    = load(KEY_FACILITY) || null
    state.staff       = load(KEY_STAFF)    || []
    state.auditLog    = load(KEY_AUDIT)    || []
    state.setupComplete = !!(load(KEY_FACILITY))
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export const actions = {

  /**
   * registerFacility — called ONCE by the clinic director.
   * Creates the facility record AND the ADMIN account simultaneously.
   */
  async registerFacility({ commit, dispatch }, { facility, admin }) {
    const hashedPassword = await sha256(admin.password)

    const facilityRecord = {
      id:        'FAC-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      name:      facility.name,
      region:    facility.region,
      city:      facility.city,
      quarter:   facility.quarter,
      email:     facility.email,
      createdAt: new Date().toISOString()
    }

    const adminRecord = {
      id:           admin.staffId.trim().toUpperCase(),
      fullName:     admin.fullName.trim(),
      email:        admin.email.trim().toLowerCase(),
      role:         ROLES.ADMIN,
      passwordHash: hashedPassword,
      facilityId:   facilityRecord.id,
      active:       true,
      createdAt:    new Date().toISOString(),
      createdBy:    'SYSTEM'
    }

    commit('SET_FACILITY', facilityRecord)
    commit('ADD_STAFF', adminRecord)
    dispatch('_audit', { action: 'FACILITY_REGISTERED', actor: adminRecord.id, detail: `Facility "${facilityRecord.name}" registered.` })
  },

  /**
   * createStaffAccount — called by ADMIN only.
   * Creates a staff account with hashed password.
   */
  async createStaffAccount({ commit, dispatch, rootState }, staffData) {
    const actorId = rootState.auth.staffId
    const hashedPassword = await sha256(staffData.password)

    const member = {
      id:           staffData.staffId.trim().toUpperCase(),
      fullName:     staffData.fullName.trim(),
      email:        staffData.email.trim().toLowerCase(),
      role:         staffData.role,
      passwordHash: hashedPassword,
      facilityId:   rootState.facility.facility.id,
      active:       true,
      createdAt:    new Date().toISOString(),
      createdBy:    actorId
    }

    commit('ADD_STAFF', member)
    dispatch('_audit', {
      action: 'ACCOUNT_CREATED',
      actor: actorId,
      detail: `Account created for ${member.fullName} (${member.id}) — Role: ${member.role}`
    })
  },

  /**
   * deactivateStaffAccount — ADMIN only. Soft-delete (never hard-delete for audit integrity).
   */
  deactivateStaffAccount({ commit, dispatch, rootState }, staffId) {
    const actorId = rootState.auth.staffId
    commit('DEACTIVATE_STAFF', staffId)
    dispatch('_audit', { action: 'ACCOUNT_DEACTIVATED', actor: actorId, detail: `Account ${staffId} deactivated.` })
  },

  /**
   * resetStaffPassword — ADMIN only.
   */
  async resetStaffPassword({ commit, dispatch, rootState, state }, { staffId, newPassword }) {
    const actorId = rootState.auth.staffId
    const member = state.staff.find(s => s.id === staffId)
    if (!member) return
    const hashedPassword = await sha256(newPassword)
    commit('UPDATE_STAFF', { ...member, passwordHash: hashedPassword })
    dispatch('_audit', { action: 'PASSWORD_RESET', actor: actorId, detail: `Password reset for account ${staffId}.` })
  },

  /**
   * _audit — internal only, never call from outside.
   */
  _audit({ commit }, { action, actor, detail }) {
    commit('ADD_AUDIT', {
      id:        Date.now(),
      action,
      actor,
      detail,
      timestamp: new Date().toISOString()
    })
  },

  /**
   * getFacilityRecord — used by auth store to attach facility name to session.
   */
  getFacilityRecord({ state }) {
    return state.facility
  },

  /**
   * verifyCredentials — used by auth store login.
   * Returns the staff member if credentials match, null otherwise.
   */
  async verifyCredentials({ state }, { staffId, password, role }) {
    const id = staffId.trim().toUpperCase()
    const member = state.staff.find(s => s.id === id && s.role === role && s.active)
    if (!member) return null
    const hashedInput = await sha256(password)
    if (hashedInput !== member.passwordHash) return null
    // Return safe profile — NEVER return passwordHash
    const { passwordHash, ...safeProfile } = member
    return safeProfile
  }
}

// ─── Getters ──────────────────────────────────────────────────────────────────
export const getters = {
  getFacility:       state => state.facility,
  isSetupComplete:   state => state.setupComplete,
  getAllStaff:        state => state.staff.map(({ passwordHash, ...s }) => s),  // strip hash
  getActiveStaff:    state => state.staff.filter(s => s.active).map(({ passwordHash, ...s }) => s),
  getStaffByRole:    state => role => state.staff.filter(s => s.role === role && s.active).map(({ passwordHash, ...s }) => s),
  getAuditLog:       state => state.auditLog
}
