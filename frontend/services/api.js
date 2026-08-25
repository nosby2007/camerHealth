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
          window.location.href = '/login'
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
  get: (id) => api.get(`/facilities/${id}`),
  update: (id, data) => api.patch(`/facilities/${id}`, data)
}

// ─── Staff endpoints ────────────────────────────────────────────────────────
export const staffApi = {
  list: () => api.get('/staff'),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.patch(`/staff/${id}`, data)
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

export default api
