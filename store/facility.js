/**
 * facility.js — CameroHealth Facility & Identity Store
 * CIA Triad:
 *   Confidentiality : passwords hashed (SHA-256), never stored plain. Role-scoped data access.
 *   Integrity       : only ADMIN can mutate accounts. Every action is audit-logged with timestamp + actor.
 *   Availability    : all data persisted to localStorage for offline resilience.
 */

import { inviteStaff } from '~/services/admin/staff-invitation.service'
import { registerFacilityWithAdmin } from '~/services/facility/supabase-facility-registration.service'

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:    'ADMIN',
  DOCTOR:   'DOCTOR',
  NP:       'NP',
  NURSE:    'NURSE',
  CNA:      'CNA',
  MIDWIFE:  'MIDWIFE',
  LAB:      'LAB',
  IMAGING:  'IMAGING',
  PHYSIOTHERAPIST: 'PHYSIOTHERAPIST',
  PHARMACY: 'PHARMACY',
  BILLING:  'BILLING',
  RECORDS:  'RECORDS',
  FRONT_DESK: 'FRONT_DESK',
  SOCIAL_WORKER: 'SOCIAL_WORKER',
  BIOMEDICAL: 'BIOMEDICAL'
}

export const ROLE_LABELS = {
  ADMIN:   'Administrator',
  DOCTOR:  'Doctor / Clinician',
  NP:      'Nurse Practitioner',
  NURSE:   'Nurse / Midwife',
  CNA:     'Care Assistant / Nursing Aide',
  MIDWIFE: 'Sage-femme / Midwife',
  LAB:     'Laboratory Technician',
  IMAGING: 'Imaging / Radiology',
  PHYSIOTHERAPIST: 'Kinesitherapist / Physiotherapist',
  PHARMACY: 'Pharmacy Staff',
  BILLING: 'Billing / Claims Staff',
  RECORDS: 'Medical Records Officer',
  FRONT_DESK: 'Admissions / Front Desk',
  SOCIAL_WORKER: 'Social Worker',
  BIOMEDICAL: 'Biomedical Technician'
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
const KEY_HOSPITAL_MODEL = 'camero_hospital_model'

function persist(key, data) {
  if (process.client) localStorage.setItem(key, JSON.stringify(data))
}
function load(key) {
  if (!process.client) return null
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

function buildSupabaseFacilityRecord(result, fallbackFacility) {
  const facility = result.facility || {}
  return {
    id: facility.id || facility.facility_id,
    name: facility.name || fallbackFacility.name,
    region: facility.region || fallbackFacility.region,
    city: facility.city || fallbackFacility.city,
    quarter: facility.quarter || fallbackFacility.quarter,
    email: facility.email || fallbackFacility.email,
    createdAt: facility.created_at || new Date().toISOString(),
    backendSource: 'supabase'
  }
}

function buildSupabaseAdminRecord(result, admin, facilityId, passwordHash) {
  const authContext = result.authContext || {}
  return {
    id: (authContext.staffCode || admin.staffId || '').trim().toUpperCase(),
    fullName: authContext.displayName || admin.fullName.trim(),
    email: (authContext.email || admin.email || '').trim().toLowerCase(),
    role: ROLES.ADMIN,
    passwordHash,
    facilityId,
    active: true,
    createdAt: (result.staffProfile && result.staffProfile.created_at) || new Date().toISOString(),
    createdBy: 'SYSTEM',
    authUserId: result.authUserId || null,
    staffProfileId: result.staffProfile ? result.staffProfile.id : null,
    backendSource: 'supabase'
  }
}

// ─── State ────────────────────────────────────────────────────────────────────
export const state = () => ({
  facility: load(KEY_FACILITY) || null,   // single clinic record
  staff: load(KEY_STAFF) || [],           // array of staff accounts
  auditLog: load(KEY_AUDIT) || [],        // immutable audit trail
  hospitalModel: load(KEY_HOSPITAL_MODEL) || defaultHospitalOperatingModel(),
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
  SET_HOSPITAL_MODEL(state, model) {
    state.hospitalModel = normalizeHospitalModel(model)
    persist(KEY_HOSPITAL_MODEL, state.hospitalModel)
  },
  UPDATE_DEPARTMENT(state, department) {
    const nextModel = normalizeHospitalModel(state.hospitalModel)
    const idx = nextModel.departments.findIndex(item => item.id === department.id)
    if (idx !== -1) {
      nextModel.departments.splice(idx, 1, { ...nextModel.departments[idx], ...department })
    } else {
      nextModel.departments.push(department)
    }
    state.hospitalModel = nextModel
    persist(KEY_HOSPITAL_MODEL, state.hospitalModel)
  },
  RELOAD_FROM_STORAGE(state) {
    state.facility    = load(KEY_FACILITY) || null
    state.staff       = load(KEY_STAFF)    || []
    state.auditLog    = load(KEY_AUDIT)    || []
    state.hospitalModel = load(KEY_HOSPITAL_MODEL) || defaultHospitalOperatingModel()
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

  async registerFacilityWithSupabase({ commit, dispatch, state }, { facility, admin, supabaseUrl, supabaseKey }) {
    const result = await registerFacilityWithAdmin(
      { facility, admin },
      { supabaseUrl, supabaseKey }
    )

    if (result.status === 'pending_confirmation') {
      return result
    }

    const hashedPassword = await sha256(admin.password)
    const facilityRecord = buildSupabaseFacilityRecord(result, facility)
    const adminRecord = buildSupabaseAdminRecord(result, admin, facilityRecord.id, hashedPassword)
    const existingAdmin = state.staff.find(member => member.id === adminRecord.id)

    commit('SET_FACILITY', facilityRecord)
    if (existingAdmin) {
      commit('UPDATE_STAFF', adminRecord)
    } else {
      commit('ADD_STAFF', adminRecord)
    }

    dispatch('_audit', {
      action: 'FACILITY_REGISTERED_SUPABASE_COMPAT',
      actor: adminRecord.id,
      detail: `Facility "${facilityRecord.name}" registered through Supabase compatibility flow.`
    })

    return result
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
      position:     staffData.position || ROLE_LABELS[staffData.role] || staffData.role,
      department:   staffData.department || '',
      service:      staffData.service || '',
      specialty:    staffData.specialty || '',
      phiScope:     staffData.phiScope || defaultPhiScopeForRole(staffData.role),
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

  async inviteStaffAccount({ rootState }, { staff, endpoint }) {
    return inviteStaff({
      email: staff.email,
      fullName: staff.fullName,
      staffId: staff.staffId,
      role: staff.role,
      phone: staff.phone,
      title: staff.title,
      department: staff.department,
      facilityId: rootState.facility.facility ? rootState.facility.facility.id : null
    }, {
      endpoint
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

  saveHospitalModel({ commit, dispatch, rootState }, model) {
    commit('SET_HOSPITAL_MODEL', model)
    dispatch('_audit', {
      action: 'HOSPITAL_MODEL_UPDATED',
      actor: rootState.auth.staffId || 'SYSTEM',
      detail: 'Hospital departments, specialties, workflows and PHI policies updated.'
    })
  },

  updateDepartment({ commit, dispatch, rootState }, department) {
    commit('UPDATE_DEPARTMENT', department)
    dispatch('_audit', {
      action: 'DEPARTMENT_UPDATED',
      actor: rootState.auth.staffId || 'SYSTEM',
      detail: `Department ${department.name || department.id} updated.`
    })
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
  getAuditLog:       state => state.auditLog,
  getHospitalModel:  state => normalizeHospitalModel(state.hospitalModel),
  getDepartments:    state => normalizeHospitalModel(state.hospitalModel).departments,
  getClinicalDepartments: state => normalizeHospitalModel(state.hospitalModel).departments.filter(item => item.type === 'clinical' || item.type === 'diagnostic'),
  getAdministrativeUnits: state => normalizeHospitalModel(state.hospitalModel).departments.filter(item => item.type === 'administrative' || item.type === 'support'),
  getClinicalServices: state => normalizeHospitalModel(state.hospitalModel).departments.flatMap(department => (department.services || []).map(service => ({ ...service, departmentId: department.id, departmentName: department.name }))),
  getSpecialties: state => [...new Set(normalizeHospitalModel(state.hospitalModel).departments.flatMap(department => department.specialties || []))].sort(),
  getWorkflowCatalog: state => normalizeHospitalModel(state.hospitalModel).workflows,
  getPhiPolicies: state => normalizeHospitalModel(state.hospitalModel).phiPolicies,
  getStaffContext: state => staffId => {
    const member = state.staff.find(item => item.id === staffId)
    if (!member) return null
    const model = normalizeHospitalModel(state.hospitalModel)
    const department = model.departments.find(item => item.id === member.department || item.name === member.department)
    const service = department && (department.services || []).find(item => item.id === member.service || item.name === member.service)
    const policy = model.phiPolicies[member.role] || model.phiPolicies.DEFAULT
    const { passwordHash, ...safeMember } = member
    return { ...safeMember, departmentRecord: department || null, serviceRecord: service || null, phiPolicy: policy }
  }
}

function defaultPhiScopeForRole(role) {
  return {
    ADMIN: 'facility-administration',
    DOCTOR: 'assigned-service-and-consult',
    NP: 'assigned-service-and-consult',
    NURSE: 'assigned-unit-care-team',
    CNA: 'assigned-unit-care-team-limited',
    MIDWIFE: 'maternal-care-team',
    LAB: 'diagnostic-orders-only',
    IMAGING: 'imaging-orders-only',
    PHYSIOTHERAPIST: 'rehab-care-plan',
    PHARMACY: 'medication-profile',
    BILLING: 'billing-only',
    RECORDS: 'records-management',
    FRONT_DESK: 'demographics-and-consent',
    SOCIAL_WORKER: 'social-care-minimum',
    BIOMEDICAL: 'no-direct-phi'
  }[role] || 'minimum-necessary'
}

function normalizeHospitalModel(model) {
  const fallback = defaultHospitalOperatingModel()
  return {
    ...fallback,
    ...(model || {}),
    departments: (model && model.departments && model.departments.length) ? model.departments : fallback.departments,
    workflows: (model && model.workflows && model.workflows.length) ? model.workflows : fallback.workflows,
    phiPolicies: { ...fallback.phiPolicies, ...((model && model.phiPolicies) || {}) }
  }
}

function defaultHospitalOperatingModel() {
  return {
    facilityDisplayName: 'Hopital General de Douala',
    governance: {
      administratorTitle: 'Directeur general',
      medicalDirectorTitle: 'Directeur medical',
      nursingDirectorTitle: 'Surveillant general',
      serviceLeadTitle: 'Chef de service',
      headNurseTitle: 'Major de service'
    },
    departments: [
      {
        id: 'urgence', name: 'Urgences', type: 'clinical', location: 'Bloc urgences', leadRole: 'Chef de service urgences', headNurseRole: 'Major des urgences',
        specialties: ['Medecine d urgence', 'Traumatologie', 'Reanimation'],
        services: [
          { id: 'triage-urgence', name: 'Triage urgence', queueKey: 'triage', defaultPhiScope: 'urgent-care-team' },
          { id: 'salle-dechocage', name: 'Salle de dechocage', queueKey: 'provider', defaultPhiScope: 'critical-care-team' },
          { id: 'observation-urgence', name: 'Observation urgence', queueKey: 'inpatient', defaultPhiScope: 'ward-care-team' }
        ]
      },
      {
        id: 'medecine-interne', name: 'Medecine interne', type: 'clinical', location: 'Batiment medical', leadRole: 'Chef de service medecine', headNurseRole: 'Major medecine interne',
        specialties: ['Cardiologie', 'Neurologie', 'Endocrinologie', 'Pneumologie', 'Nephrologie', 'Gastroenterologie'],
        services: [
          { id: 'consultation-medicale', name: 'Consultation medicale', queueKey: 'provider', defaultPhiScope: 'assigned-service' },
          { id: 'hospitalisation-medicale', name: 'Hospitalisation medicale', queueKey: 'inpatient', defaultPhiScope: 'ward-care-team' }
        ]
      },
      {
        id: 'chirurgie', name: 'Chirurgie', type: 'clinical', location: 'Bloc operatoire', leadRole: 'Chef de service chirurgie', headNurseRole: 'Major bloc operatoire',
        specialties: ['Chirurgie generale', 'Orthopedie', 'Urologie', 'Neurochirurgie', 'Anesthesie'],
        services: [
          { id: 'consultation-chirurgie', name: 'Consultation chirurgie', queueKey: 'provider', defaultPhiScope: 'assigned-service' },
          { id: 'bloc-operatoire', name: 'Bloc operatoire', queueKey: 'task-worklist', defaultPhiScope: 'surgical-team' },
          { id: 'suites-operatoires', name: 'Suites operatoires', queueKey: 'inpatient', defaultPhiScope: 'ward-care-team' }
        ]
      },
      {
        id: 'mere-enfant', name: 'Mere et enfant', type: 'clinical', location: 'Pavillon maternite pediatrie', leadRole: 'Chef de service mere-enfant', headNurseRole: 'Major maternite',
        specialties: ['Gynecologie', 'Obstetrique', 'Sage-femme', 'Maieutique', 'Pediatrie', 'Neonatologie'],
        services: [
          { id: 'maternite', name: 'Maternite', queueKey: 'provider', defaultPhiScope: 'maternal-care-team' },
          { id: 'consultation-prenatale', name: 'Consultation prenatale', queueKey: 'provider', defaultPhiScope: 'maternal-care-team' },
          { id: 'salle-accouchement', name: 'Salle d accouchement', queueKey: 'task-worklist', defaultPhiScope: 'maternal-care-team' },
          { id: 'pediatrie', name: 'Pediatrie', queueKey: 'provider', defaultPhiScope: 'pediatric-care-team' },
          { id: 'neonatologie', name: 'Neonatologie', queueKey: 'inpatient', defaultPhiScope: 'restricted-care-team' }
        ]
      },
      {
        id: 'soins-infirmiers', name: 'Direction des soins infirmiers', type: 'clinical', location: 'Unites de soins', leadRole: 'Surveillant general', headNurseRole: 'Majors de service',
        specialties: ['Soins generaux', 'Soins critiques', 'Pansements et plaies', 'Education therapeutique', 'Aide-soignant'],
        services: [
          { id: 'soins-generaux', name: 'Soins generaux', queueKey: 'task-worklist', defaultPhiScope: 'assigned-unit-care-team' },
          { id: 'plaies-pansements', name: 'Plaies et pansements', queueKey: 'task-worklist', defaultPhiScope: 'assigned-unit-care-team' },
          { id: 'aides-soignants', name: 'Aides-soignants', queueKey: 'task-worklist', defaultPhiScope: 'assigned-unit-care-team-limited' }
        ]
      },
      {
        id: 'diagnostic', name: 'Plateau technique', type: 'diagnostic', location: 'Diagnostic central', leadRole: 'Responsable plateau technique', headNurseRole: 'Major technique',
        specialties: ['Laboratoire', 'Biologie medicale', 'Prelevement', 'Imagerie medicale', 'Radiologie', 'Echographie', 'Anatomopathologie'],
        services: [
          { id: 'laboratoire', name: 'Laboratoire', queueKey: 'diagnostics', defaultPhiScope: 'orders-and-results' },
          { id: 'imagerie', name: 'Imagerie', queueKey: 'diagnostics', defaultPhiScope: 'orders-and-results' },
          { id: 'banque-sang', name: 'Banque de sang', queueKey: 'diagnostics', defaultPhiScope: 'restricted-diagnostic' }
        ]
      },
      {
        id: 'readaptation', name: 'Readaptation et kinesitherapie', type: 'clinical', location: 'Plateau rehabilitation', leadRole: 'Responsable readaptation', headNurseRole: 'Referent kinesitherapie',
        specialties: ['Kinesitherapie', 'Physiotherapie', 'Ergotherapie', 'Orthophonie', 'Reeducation fonctionnelle'],
        services: [
          { id: 'kinesitherapie', name: 'Kinesitherapie', queueKey: 'task-worklist', defaultPhiScope: 'rehab-care-plan' },
          { id: 'reeducation', name: 'Reeducation fonctionnelle', queueKey: 'task-worklist', defaultPhiScope: 'rehab-care-plan' },
          { id: 'ergotherapie', name: 'Ergotherapie', queueKey: 'task-worklist', defaultPhiScope: 'rehab-care-plan' }
        ]
      },
      {
        id: 'pharmacie', name: 'Pharmacie', type: 'support', location: 'Pharmacie hospitaliere', leadRole: 'Pharmacien chef', headNurseRole: 'Responsable dispensation',
        specialties: ['Pharmacie clinique', 'Preparation', 'Dispensation', 'Stock medical'],
        services: [
          { id: 'dispensation', name: 'Dispensation', queueKey: 'task-worklist', defaultPhiScope: 'medication-profile' },
          { id: 'stock', name: 'Gestion stock', queueKey: 'task-worklist', defaultPhiScope: 'no-direct-phi' }
        ]
      },
      {
        id: 'administration', name: 'Administration et finances', type: 'administrative', location: 'Administration', leadRole: 'Directeur administratif et financier', headNurseRole: 'Responsable admissions',
        specialties: ['Admissions', 'Facturation', 'Assurance', 'Archives medicales', 'Qualite'],
        services: [
          { id: 'admissions', name: 'Admissions', queueKey: 'front-desk', defaultPhiScope: 'demographics-and-consent' },
          { id: 'facturation', name: 'Facturation', queueKey: 'task-worklist', defaultPhiScope: 'billing-only' },
          { id: 'assurance', name: 'Assurance et claims', queueKey: 'task-worklist', defaultPhiScope: 'coverage-and-claims' },
          { id: 'archives', name: 'Archives dossier patient', queueKey: 'front-desk', defaultPhiScope: 'records-management' }
        ]
      }
    ],
    workflows: [
      { id: 'admission-programmee', name: 'Admission programmee', stages: ['Admissions', 'Verification PHI', 'Triage', 'Consultation', 'Orders', 'Billing', 'Sortie'] },
      { id: 'urgence-vitale', name: 'Urgence vitale', stages: ['Triage rapide', 'Emergency override PHI', 'Salle de dechocage', 'Diagnostic STAT', 'Hospitalisation ou sortie'] },
      { id: 'hospitalisation', name: 'Hospitalisation', stages: ['Admission', 'Affectation lit', 'Plan de soins', 'Notes infirmieres', 'Visite medicale', 'Sortie'] },
      { id: 'chirurgie', name: 'Parcours chirurgie', stages: ['Consultation', 'Consentement', 'Bilan pre-op', 'Bloc operatoire', 'Reveil', 'Suites operatoires'] },
      { id: 'diagnostic', name: 'Diagnostic labo/imagerie', stages: ['Prescription', 'Prelevement ou examen', 'Validation resultat', 'Notification medecin', 'Archivage'] },
      { id: 'assurance-facturation', name: 'Assurance et facturation', stages: ['Eligibilite', 'Pre-autorisation', 'Facturation', 'Claim', 'Paiement ou rejet'] }
    ],
    phiPolicies: {
      ADMIN: { access: 'administrative', canOpenChart: true, requiresReason: true, breakGlass: false, note: 'Administrative access is audited and should avoid clinical details unless necessary.' },
      DOCTOR: { access: 'clinical-full-assigned', canOpenChart: true, requiresReason: false, breakGlass: true, note: 'Clinical PHI for assigned services and consults.' },
      NP: { access: 'clinical-full-assigned', canOpenChart: true, requiresReason: false, breakGlass: true, note: 'Advanced nursing/clinical PHI for assigned services.' },
      NURSE: { access: 'care-team-assigned', canOpenChart: true, requiresReason: false, breakGlass: true, note: 'Nursing PHI for assigned unit and active care team.' },
      CNA: { access: 'care-team-limited', canOpenChart: true, requiresReason: false, breakGlass: false, note: 'Limited nursing aide PHI for assigned tasks and unit.' },
      MIDWIFE: { access: 'maternal-care-team', canOpenChart: true, requiresReason: false, breakGlass: true, note: 'Maternal and newborn PHI for assigned maternity care.' },
      LAB: { access: 'diagnostic-orders-results', canOpenChart: false, requiresReason: true, breakGlass: false, note: 'Minimum necessary access to lab orders and results.' },
      IMAGING: { access: 'imaging-orders-results', canOpenChart: false, requiresReason: true, breakGlass: false, note: 'Minimum necessary access to imaging orders and reports.' },
      PHYSIOTHERAPIST: { access: 'rehab-care-plan', canOpenChart: true, requiresReason: false, breakGlass: false, note: 'Rehabilitation access to care plan, mobility notes and functional assessments.' },
      PHARMACY: { access: 'medication-profile', canOpenChart: false, requiresReason: true, breakGlass: false, note: 'Medication profile, dispensing and stock-related access.' },
      BILLING: { access: 'billing-only', canOpenChart: false, requiresReason: true, breakGlass: false, note: 'Billing, payer and claims data only.' },
      RECORDS: { access: 'records-management', canOpenChart: true, requiresReason: true, breakGlass: false, note: 'Medical records management with audited chart access.' },
      FRONT_DESK: { access: 'demographics-and-consent', canOpenChart: false, requiresReason: true, breakGlass: false, note: 'Registration, demographics, consent and appointment access.' },
      SOCIAL_WORKER: { access: 'social-care-minimum', canOpenChart: true, requiresReason: true, breakGlass: false, note: 'Minimum necessary social support documentation.' },
      BIOMEDICAL: { access: 'no-direct-phi', canOpenChart: false, requiresReason: true, breakGlass: false, note: 'Equipment and device support without direct patient PHI.' },
      DEFAULT: { access: 'minimum-necessary', canOpenChart: false, requiresReason: true, breakGlass: false, note: 'No PHI unless specifically assigned.' }
    }
  }
}
