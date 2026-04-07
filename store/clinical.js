
export const state = () => ({
  patients: [],
  visits: [],
  fieldReports: [],
  inpatients: [],
  appointments: [],
  medications: [],
  labOrders: [],
  imagingOrders: [],
  invoices: [],
  offlineMode: false,
  lastSync: null,
  viewMode: 'national'
})

export const mutations = {
  ADD_PATIENT(state, patient) {
    state.patients.push(patient)
    saveToLocalStorage('patients', state.patients)
  },
  ADD_VISIT(state, visit) {
    state.visits.push(visit)
    saveToLocalStorage('visits', state.visits)
  },
  ADD_FIELD_REPORT(state, report) {
    state.fieldReports.push(report)
    saveToLocalStorage('fieldReports', state.fieldReports)
  },
  SET_OFFLINE_MODE(state, mode) {
    state.offlineMode = mode
  },
  SET_VIEW_MODE(state, mode) {
    state.viewMode = mode
  },
  SET_LAST_SYNC(state, timestamp) {
    state.lastSync = timestamp
  },
  ADD_INPATIENT(state, record) {
    state.inpatients.push(record)
    saveToLocalStorage('inpatients', state.inpatients)
  },
  UPDATE_INPATIENT(state, record) {
    const idx = state.inpatients.findIndex(i => i.id === record.id)
    if (idx !== -1) { state.inpatients.splice(idx, 1, record); saveToLocalStorage('inpatients', state.inpatients) }
  },
  ADD_APPOINTMENT(state, appt) {
    state.appointments.push(appt)
    saveToLocalStorage('appointments', state.appointments)
  },
  UPDATE_APPOINTMENT(state, appt) {
    const idx = state.appointments.findIndex(a => a.id === appt.id)
    if (idx !== -1) { state.appointments.splice(idx, 1, appt); saveToLocalStorage('appointments', state.appointments) }
  },
  ADD_MEDICATION(state, med) {
    state.medications.push(med)
    saveToLocalStorage('medications', state.medications)
  },
  UPDATE_MEDICATION(state, med) {
    const idx = state.medications.findIndex(m => m.id === med.id)
    if (idx !== -1) { state.medications.splice(idx, 1, med); saveToLocalStorage('medications', state.medications) }
  },
  ADD_LAB_ORDER(state, order) {
    state.labOrders.push(order)
    saveToLocalStorage('labOrders', state.labOrders)
  },
  UPDATE_LAB_ORDER(state, order) {
    const idx = state.labOrders.findIndex(l => l.id === order.id)
    if (idx !== -1) { state.labOrders.splice(idx, 1, order); saveToLocalStorage('labOrders', state.labOrders) }
  },
  ADD_IMAGING_ORDER(state, order) {
    state.imagingOrders.push(order)
    saveToLocalStorage('imagingOrders', state.imagingOrders)
  },
  UPDATE_IMAGING_ORDER(state, order) {
    const idx = state.imagingOrders.findIndex(i => i.id === order.id)
    if (idx !== -1) { state.imagingOrders.splice(idx, 1, order); saveToLocalStorage('imagingOrders', state.imagingOrders) }
  },
  ADD_INVOICE(state, invoice) {
    state.invoices.push(invoice)
    saveToLocalStorage('invoices', state.invoices)
  },
  UPDATE_INVOICE(state, invoice) {
    const idx = state.invoices.findIndex(i => i.id === invoice.id)
    if (idx !== -1) { state.invoices.splice(idx, 1, invoice); saveToLocalStorage('invoices', state.invoices) }
  },
  LOAD_FROM_STORAGE(state) {
    state.patients = loadFromLocalStorage('patients') || []
    state.visits = loadFromLocalStorage('visits') || []
    state.fieldReports = loadFromLocalStorage('fieldReports') || []
    state.inpatients    = loadFromLocalStorage('inpatients')    || []
    state.appointments  = loadFromLocalStorage('appointments')  || []
    state.medications = loadFromLocalStorage('medications') || []
    state.labOrders = loadFromLocalStorage('labOrders') || []
    state.imagingOrders = loadFromLocalStorage('imagingOrders') || []
    state.invoices = loadFromLocalStorage('invoices') || []
  }
}

export const actions = {
  registerPatient({ commit, rootState }, patient) {
    const id = 'PAT-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    commit('ADD_PATIENT', { 
      ...patient, 
      id, 
      institution: rootState.auth.institution,
      region: rootState.auth.region,
      createdAt: new Date().toISOString() 
    })
  },
  logVisit({ commit, rootState }, visit) {
    commit('ADD_VISIT', { 
      ...visit, 
      id: Date.now(), 
      institution: rootState.auth.institution,
      region: rootState.auth.region,
      createdAt: new Date().toISOString() 
    })
  },
  reportFieldCase({ commit, rootState }, report) {
    commit('ADD_FIELD_REPORT', { 
      ...report, 
      id: Date.now(), 
      institution: rootState.auth.institution,
      createdAt: new Date().toISOString() 
    })
  },
  syncData({ commit }) {
    commit('SET_LAST_SYNC', new Date().toISOString())
    return new Promise(resolve => setTimeout(resolve, 1500))
  },
  admitPatient({ commit, rootState }, record) {
    commit('ADD_INPATIENT', {
      ...record,
      id: 'INP-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Admitted',
      admittedAt: new Date().toISOString()
    })
  },
  updateInpatient({ commit }, record) {
    commit('UPDATE_INPATIENT', record)
  },
  scheduleAppointment({ commit, rootState }, appt) {
    commit('ADD_APPOINTMENT', {
      ...appt,
      id: 'APT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    })
  },
  updateAppointment({ commit }, appt) {
    commit('UPDATE_APPOINTMENT', appt)
  },
  prescribeMedication({ commit, rootState }, med) {
    commit('ADD_MEDICATION', {
      ...med,
      id: 'MED-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Active',
      prescribedAt: new Date().toISOString()
    })
  },
  updateMedication({ commit }, med) {
    commit('UPDATE_MEDICATION', med)
  },
  orderLab({ commit, rootState }, order) {
    commit('ADD_LAB_ORDER', {
      ...order,
      id: 'LAB-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Requested',
      requestedAt: new Date().toISOString()
    })
  },
  updateLabOrder({ commit }, order) {
    commit('UPDATE_LAB_ORDER', order)
  },
  orderImaging({ commit, rootState }, order) {
    commit('ADD_IMAGING_ORDER', {
      ...order,
      id: 'IMG-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Requested',
      requestedAt: new Date().toISOString()
    })
  },
  updateImagingOrder({ commit }, order) {
    commit('UPDATE_IMAGING_ORDER', order)
  },
  createInvoice({ commit, rootState }, invoice) {
    commit('ADD_INVOICE', {
      ...invoice,
      id: 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Unpaid',
      createdAt: new Date().toISOString()
    })
  },
  updateInvoice({ commit }, invoice) {
    commit('UPDATE_INVOICE', invoice)
  }
}

export const getters = {
  // ROLE HELPERS
  isClinical: (state, getters, rootState) => rootState.auth.role === 'CLINICAL_STAFF',
  isMinistry: (state, getters, rootState) => rootState.auth.role === 'PUBLIC_HEALTH_OFFICER',

  // FILTERED DATA
  getPatients: (state, getters, rootState) => {
    // Ministry users sees ONLY anonymized stats conceptually (handled in view)
    // For simplicity here, we filter by institution for clinical staff
    if (getters.isClinical) {
       return state.patients.filter(p => p.institution === rootState.auth.institution)
    }
    return state.patients
  },
  
  getVisits: (state, getters, rootState) => {
    if (getters.isClinical) {
      return state.visits.filter(v => v.institution === rootState.auth.institution)
    }
    return state.visits
  },

  getFieldReports: state => state.fieldReports,
  getInpatients: (state, getters, rootState) => {
    if (getters.isClinical) return state.inpatients.filter(i => i.institution === rootState.auth.institution)
    return state.inpatients
  },
  getAppointments: (state, getters, rootState) => {
    if (getters.isClinical) return state.appointments.filter(a => a.institution === rootState.auth.institution)
    return state.appointments
  },
  getMedications: (state, getters, rootState) => {
    if (getters.isClinical) return state.medications.filter(m => m.institution === rootState.auth.institution)
    return state.medications
  },
  getLabOrders: (state, getters, rootState) => {
    if (getters.isClinical) return state.labOrders.filter(l => l.institution === rootState.auth.institution)
    return state.labOrders
  },
  getImagingOrders: (state, getters, rootState) => {
    if (getters.isClinical) return state.imagingOrders.filter(i => i.institution === rootState.auth.institution)
    return state.imagingOrders
  },
  getInvoices: (state, getters, rootState) => {
    if (getters.isClinical) return state.invoices.filter(i => i.institution === rootState.auth.institution)
    return state.invoices
  },
  isOffline: state => state.offlineMode,
  getViewMode: state => state.viewMode,
  
  // Intelligence: Rule-based alerts for infectious diseases
  infectiousAlerts: (state, getters, rootState) => {
    const alerts = []
    const regions = ['Far North', 'North', 'Adamawa', 'Centre', 'South', 'East', 'West', 'Littoral', 'South-West', 'North-West']
    
    // Check field reports for outbreaks
    state.fieldReports.forEach(report => {
      if (report.severity === 'High') {
        alerts.push({
          id: 'field-' + report.id,
          type: 'error',
          title: `Critical Outbreak: ${report.disease}`,
          message: `${report.cases} cases reported in ${report.region}. Severity: HIGH.`,
          region: report.region
        })
      }
    })

    return alerts
  },

  // Chronic transition alerts
  chronicAlerts: (state) => {
    const alerts = []
    const chronicVisits = state.visits.filter(v => v.type === 'Chronic')
    if (chronicVisits.length > 5) {
       alerts.push({
         id: 'chronic-trend',
         type: 'warning',
         title: 'Rising Chronic Trend',
         message: 'Steady increase in chronic disease visits detected in the field layer.',
         region: 'National'
       })
    }
    return alerts
  }
}

function saveToLocalStorage(key, data) {
  if (process.client) {
    localStorage.setItem('camero_health_' + key, JSON.stringify(data))
  }
}

function loadFromLocalStorage(key) {
  if (process.client) {
    const data = localStorage.getItem('camero_health_' + key)
    return data ? JSON.parse(data) : null
  }
  return null
}
