// ─── CameroHealth — API Client Service ──────────────────────────────────────
// Centralized HTTP client for communicating with the Express backend.
// All Vuex stores will use this service instead of direct localStorage.

import axios from 'axios'

let API_BASE = process.env.BACKEND_API_URL || ''
if (!API_BASE) {
  API_BASE = 'http://127.0.0.1:4000/api'
}
API_BASE = API_BASE.replace(/\/$/, '')

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// ─── Request interceptor: attach JWT token ──────────────────────────────────
api.interceptors.request.use(config => {
  if (process.client) {
    const token = sessionStorage.getItem('camero_api_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const facilityId = sessionStorage.getItem('camero_facility_id')
    if (facilityId) {
      config.headers['X-Facility-ID'] = facilityId
    }
  }
  return config
}, error => Promise.reject(error))

// ─── Response interceptor: handle auth errors ───────────────────────────────
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        // Token expired or invalid — clear session
        if (process.client) {
          sessionStorage.removeItem('camero_api_token')
          sessionStorage.removeItem('camero_session')
          sessionStorage.removeItem('camero_facility_id')
          sessionStorage.removeItem('camero_health_openPatientTabs')
          if (window.location.pathname !== '/login') {
            window.location.replace('/login?reason=expired')
          }
        }
      }
      // Enhance error with server message and validation details
      if (data?.details && Array.isArray(data.details)) {
        const detailsText = data.details.map(d => `${d.field}: ${d.message}`).join(', ')
        error.message = `${data.error || 'Validation error'} (${detailsText})`
      } else {
        error.message = data?.error || error.message
      }
    } else if (error.request) {
      error.message = 'Unable to connect to CameroHealth server at ' + API_BASE + '. Please ensure the backend is running.'
    }
    return Promise.reject(error)
  }
)

// ─── Save token after successful login ──────────────────────────────────────
export function setAuthToken(token) {
  if (process.client) {
    sessionStorage.setItem('camero_api_token', token)
  }
}

export function clearAuthToken() {
  if (process.client) {
    sessionStorage.removeItem('camero_api_token')
    sessionStorage.removeItem('camero_facility_id')
  }
}

// ─── Auth endpoints ─────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
}

// ─── Facility endpoints ─────────────────────────────────────────────────────
export const facilityApi = {
  list: () => api.get('/facilities'),
  get: (id) => api.get(`/facilities/${id}`),
  update: (id, data) => api.patch(`/facilities/${id}`, data)
}

// ─── Staff endpoints ────────────────────────────────────────────────────────
export const staffApi = {
  list: () => api.get('/staff'),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.patch(`/staff/${id}`, data),
  getProviders: () => api.get('/staff/providers')
}

// ─── Patient endpoints ──────────────────────────────────────────────────────
export const patientApi = {
  list: (params) => api.get('/patients', { params }),
  get: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.patch(`/patients/${id}`, data)
}

// ─── Clinical endpoints ─────────────────────────────────────────────────────
export const clinicalApi = {
  // Visits
  getVisits: () => api.get('/clinical/visits'),
  createVisit: (data) => api.post('/clinical/visits', data),
  // Lab orders
  getLabOrders: () => api.get('/clinical/lab-orders'),
  createLabOrder: (data) => api.post('/clinical/lab-orders', data),
  updateLabOrder: (id, data) => api.patch(`/clinical/lab-orders/${id}`, data),
  // Imaging orders
  getImagingOrders: () => api.get('/clinical/imaging-orders'),
  createImagingOrder: (data) => api.post('/clinical/imaging-orders', data),
  updateImagingOrder: (id, data) => api.patch(`/clinical/imaging-orders/${id}`, data),
  uploadImagingFile: (id, data) => api.patch(`/clinical/imaging-orders/${id}`, data),
  // Medications
  getMedications: () => api.get('/clinical/medications'),
  createMedication: (data) => api.post('/clinical/medications', data),
  updateMedication: (id, data) => api.patch(`/clinical/medications/${id}`, data)
}

// ─── Appointment endpoints ──────────────────────────────────────────────────
export const appointmentApi = {
  list: (params) => api.get('/appointments', { params }),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.patch(`/appointments/${id}`, data)
}

// ─── Inpatient endpoints ────────────────────────────────────────────────────
export const inpatientApi = {
  list: (params) => api.get('/inpatients', { params }),
  admit: (data) => api.post('/inpatients', data),
  update: (id, data) => api.patch(`/inpatients/${id}`, data)
}

// ─── Billing endpoints ──────────────────────────────────────────────────────
export const billingApi = {
  // Statements
  getStatements: ()           => api.get('/billing/statements'),
  getStatement:  (patientId)  => api.get(`/billing/statement/${patientId}`),
  // Charges
  addCharge:     (data)       => api.post('/billing/charges', data),
  updateCharge:  (id, data)   => api.patch(`/billing/charges/${id}`, data),
  // Payments
  recordPayment: (data)       => api.post('/billing/payments', data),
  // Clearances
  issueClearance:   (data)    => api.post('/billing/clearances', data),
  getClearances:    (pid)     => api.get(`/billing/clearances/${pid}`),
  revokeClearance:  (id)      => api.delete(`/billing/clearances/${id}`),
  // Legacy list
  list:   (params)            => api.get('/billing', { params }),
  create: (data)              => api.post('/billing', data),
  update: (id, data)          => api.patch(`/billing/${id}`, data)
}

// ─── Audit endpoints ────────────────────────────────────────────────────────
export const auditApi = {
  list: (params) => api.get('/audit', { params })
}

// ─── Department / Ward endpoints ────────────────────────────────────────────
export const departmentApi = {
  list:       ()              => api.get('/departments'),
  create:     (data)          => api.post('/departments', data),
  update:     (id, data)      => api.patch(`/departments/${id}`, data),
  remove:     (id)            => api.delete(`/departments/${id}`),
  addWard:    (deptId, data)  => api.post(`/departments/${deptId}/wards`, data),
  updateWard: (deptId, wardId, data) => api.patch(`/departments/${deptId}/wards/${wardId}`, data),
  removeWard: (deptId, wardId)       => api.delete(`/departments/${deptId}/wards/${wardId}`)
}

// ─── Price Catalog endpoints ────────────────────────────────────────────────
export const catalogApi = {
  list: () => api.get('/catalog'),
  create: (data) => api.post('/catalog', data),
  update: (id, data) => api.patch(`/catalog/${id}`, data),
  remove: (id) => api.delete(`/catalog/${id}`)
}

// ─── Vitals endpoints ───────────────────────────────────────────────────────
export const vitalsApi = {
  list: (patientId) => api.get('/vitals', { params: { patientId } }),
  record: (data) => api.post('/vitals', data)
}

// ─── Care team work list (Task) endpoints ───────────────────────────────────
export const taskApi = {
  list: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  updateStatus: (id, data) => api.patch(`/tasks/${id}`, data)
}

// ─── Care team & social assessment endpoints ────────────────────────────────
export const careTeamApi = {
  list: (patientId) => api.get('/care-team', { params: { patientId } }),
  addMember: (data) => api.post('/care-team', data),
  updateMember: (id, data) => api.patch(`/care-team/${id}`, data),
  listSocialAssessments: (patientId) => api.get('/social-assessments', { params: { patientId } }),
  addSocialAssessment: (data) => api.post('/social-assessments', data)
}

// ─── Discharge planning endpoints ───────────────────────────────────────────
export const dischargeApi = {
  overview: (patientId) => api.get('/discharge/overview', { params: { patientId } }),
  addMilestone: (data) => api.post('/discharge/milestones', data),
  updateMilestone: (id, data) => api.patch(`/discharge/milestones/${id}`, data),
  addFollowUp: (data) => api.post('/discharge/follow-ups', data),
  updateFollowUp: (id, data) => api.patch(`/discharge/follow-ups/${id}`, data)
}

// ─── Patient education endpoints ────────────────────────────────────────────
export const educationApi = {
  overview: (patientId) => api.get('/education', { params: { patientId } }),
  addTitle: (data) => api.post('/education/titles', data),
  addPoint: (data) => api.post('/education/points', data),
  updatePoint: (id, data) => api.patch(`/education/points/${id}`, data),
  addDocumentation: (data) => api.post('/education/documentation', data),
  updateDocumentation: (id, data) => api.patch(`/education/documentation/${id}`, data),
  addMaterial: (data) => api.post('/education/materials', data),
  addAssignment: (data) => api.post('/education/material-assignments', data),
  removeAssignment: (id) => api.patch(`/education/material-assignments/${id}`, {}),
  addComment: (data) => api.post('/education/comments', data)
}

// ─── Clinical notes endpoints ───────────────────────────────────────────────
export const clinicalNotesApi = {
  list: (patientId, noteType) => api.get('/clinical-notes', { params: { patientId, noteType } }),
  create: (data) => api.post('/clinical-notes', data),
  update: (id, data) => api.patch(`/clinical-notes/${id}`, data),
  sign: (id) => api.patch(`/clinical-notes/${id}/sign`),
  share: (id) => api.patch(`/clinical-notes/${id}/share`),
  amend: (id, body) => api.post(`/clinical-notes/${id}/amend`, { body })
}

// ─── Phase 13: Organization hierarchy endpoints ─────────────────────────────
export const organizationApi = {
  overview: () => api.get('/organizations/overview'),
  list: () => api.get('/organizations'),
  listFacilities: (orgId) => api.get(`/organizations/${orgId}/facilities`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.patch(`/organizations/${id}`, data),
  remove: (id) => api.delete(`/organizations/${id}`),
  listUnits: (orgId) => api.get(`/organizations/${orgId}/units`),
  createUnit: (orgId, data) => api.post(`/organizations/${orgId}/units`, data),
  updateUnit: (orgId, unitId, data) => api.patch(`/organizations/${orgId}/units/${unitId}`, data),
  removeUnit: (orgId, unitId) => api.delete(`/organizations/${orgId}/units/${unitId}`),
  attachFacility: (facilityId, data) => api.patch(`/organizations/facilities/${facilityId}/attach`, data),
  listAdmins: (orgId) => api.get(`/organizations/${orgId}/admins`),
  createAdmin: (orgId, data) => api.post(`/organizations/${orgId}/admins`, data),
  createStaffAssignment: (orgId, data) => api.post(`/organizations/${orgId}/staff-assignments`, data),
  revokeStaffAssignment: (assignmentId) => api.patch(`/organizations/staff-assignments/${assignmentId}/revoke`)
}

// ─── Platform operations endpoints (Super Admin only) ───────────────────────
export const platformApi = {
  overview: () => api.get('/platform/overview'),
  listTeam: () => api.get('/platform/team'),
  inviteTeamMember: (data) => api.post('/platform/team', data),
  setTeamMemberStatus: (staffProfileId, status) => api.patch(`/platform/team/${staffProfileId}/status`, { status })
}

// ─── Commercial pipeline endpoints (Super Admin only) ───────────────────────
export const leadsApi = {
  list: (stage) => api.get('/leads', { params: stage ? { stage } : undefined }),
  get: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.patch(`/leads/${id}`, data),
  changeStage: (id, data) => api.patch(`/leads/${id}/stage`, data),
  addActivity: (id, data) => api.post(`/leads/${id}/activities`, data),
  convert: (id, data) => api.post(`/leads/${id}/convert`, data),
  // Public — no auth required, called from the marketing site's contact form.
  submitPublicRequest: (data) => api.post('/leads/public', data)
}

// ─── RMA (Rapport Mensuel d'Activité) endpoints ─────────────────────────────
export const reportsApi = {
  submit: (data) => api.post('/rma', data),
  list: (params) => api.get('/rma', { params }),
  validate: (id, data) => api.patch(`/rma/${id}/validate`, data),
  reject: (id, data) => api.patch(`/rma/${id}/reject`, data),
  aggregate: (params) => api.get('/rma/aggregate', { params }),
  syncDhis2: (id) => api.post(`/rma/${id}/sync-dhis2`),
  getDhis2Mapping: (orgId) => api.get(`/organizations/${orgId}/dhis2-mapping`),
  updateDhis2Mapping: (orgId, data) => api.put(`/organizations/${orgId}/dhis2-mapping`, data)
}

// ─── Wound care endpoints ────────────────────────────────────────────────────
export const woundCareApi = {
  listForPatient: (patientId) => api.get(`/patients/${patientId}/wounds`),
  create: (data) => api.post('/wounds', data),
  update: (id, data) => api.patch(`/wounds/${id}`, data),
  addAssessment: (id, data) => api.post(`/wounds/${id}/assessments`, data),
  addPhoto: (id, data) => api.post(`/wounds/${id}/photos`, data)
}

// ─── Care plan endpoints ──────────────────────────────────────────────────────
export const carePlanApi = {
  listForPatient: (patientId) => api.get(`/patients/${patientId}/care-plans`),
  create: (data) => api.post('/care-plans', data),
  update: (id, data) => api.patch(`/care-plans/${id}`, data),
  review: (id, data) => api.post(`/care-plans/${id}/review`, data),
  addProblem: (data) => api.post('/care-plan-problems', data),
  updateProblem: (id, data) => api.patch(`/care-plan-problems/${id}`, data),
  addGoal: (data) => api.post('/care-plan-goals', data),
  updateGoal: (id, data) => api.patch(`/care-plan-goals/${id}`, data),
  addOutcome: (data) => api.post('/care-plan-outcomes', data),
  updateOutcome: (id, data) => api.patch(`/care-plan-outcomes/${id}`, data),
  addProgressEntry: (data) => api.post('/care-plan-progress-entries', data),
  listProgressEntries: (patientId) => api.get(`/patients/${patientId}/care-plan-progress-entries`)
}

// ─── Mobile money endpoints ───────────────────────────────────────────────────
export const mobileMoneyApi = {
  request: (data) => api.post('/mobile-money/request', data),
  status: (id) => api.get(`/mobile-money/${id}/status`)
}

export default api
