
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
  vitalSigns: [],
  nursingNotes: [],
  medicalNotes: [],
  tasks: [],
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
    state.inpatients = loadFromLocalStorage('inpatients') || []
    state.appointments = loadFromLocalStorage('appointments') || []
    state.medications = loadFromLocalStorage('medications') || []
    state.labOrders = loadFromLocalStorage('labOrders') || []
    state.imagingOrders = loadFromLocalStorage('imagingOrders') || []
    state.invoices = loadFromLocalStorage('invoices') || []
    state.vitalSigns = loadFromLocalStorage('vitalSigns') || []
    state.nursingNotes = loadFromLocalStorage('nursingNotes') || []
    state.medicalNotes = loadFromLocalStorage('medicalNotes') || []
    state.tasks = loadFromLocalStorage('tasks') || []
  },
  ADD_VITAL_SIGNS(state, record) {
    state.vitalSigns.push(record)
    saveToLocalStorage('vitalSigns', state.vitalSigns)
  },
  ADD_NURSING_NOTE(state, note) {
    state.nursingNotes.push(note)
    saveToLocalStorage('nursingNotes', state.nursingNotes)
  },
  ADD_MEDICAL_NOTE(state, note) {
    state.medicalNotes.push(note)
    saveToLocalStorage('medicalNotes', state.medicalNotes)
  },
  UPDATE_NURSING_NOTE(state, note) {
    const idx = state.nursingNotes.findIndex(n => n.id === note.id)
    if (idx !== -1) {
      state.nursingNotes.splice(idx, 1, note)
      saveToLocalStorage('nursingNotes', state.nursingNotes)
    }
  },
  UPDATE_MEDICAL_NOTE(state, note) {
    const idx = state.medicalNotes.findIndex(n => n.id === note.id)
    if (idx !== -1) {
      state.medicalNotes.splice(idx, 1, note)
      saveToLocalStorage('medicalNotes', state.medicalNotes)
    }
  },
  ADD_TASK(state, task) {
    state.tasks.push(task)
    saveToLocalStorage('tasks', state.tasks)
  },
  UPDATE_TASK(state, task) {
    const idx = state.tasks.findIndex(t => t.id === task.id)
    if (idx !== -1) {
      state.tasks.splice(idx, 1, task)
      saveToLocalStorage('tasks', state.tasks)
    }
  }
}

export const actions = {
  registerPatient({ commit, rootState }, patient) {
    const id = 'PAT-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    commit('ADD_PATIENT', {
      ...patient,
      id,
      institution: rootState.auth.institution,
      region: patient.region || rootState.auth.region,
      createdAt: new Date().toISOString()
    })
  },
  async logVisit({ commit, rootState, dispatch }, visit) {
    commit('ADD_VISIT', {
      ...visit,
      id: Date.now(),
      institution: rootState.auth.institution,
      region: rootState.auth.region,
      createdAt: new Date().toISOString()
    })
  },
  async reportFieldCase({ commit, rootState }, report) {
    commit('ADD_FIELD_REPORT', {
      ...report,
      id: Date.now(),
      institution: rootState.auth.institution,
      createdAt: new Date().toISOString()
    })
  },
  async syncToSupabase({ state }, payload) {
    const record = {
      facility_name: payload.facility_name,
      region: payload.region,
      disease: payload.disease,
      case_count: payload.case_count,
      recorded_at: new Date().toISOString()
    }

    console.log('--- SUPABASE SYNC ATTEMPT ---')
    console.log('Payload:', record)

    try {
      const { data, error } = await this.$supabase.from('health_telemetry').insert([record])

      if (error) {
        console.error('❌ Supabase Error:', error.message, '| Hint:', error.hint || 'Check RLS Policies')
        this.$toast.error(`Sync Blocked: ${error.message}`)
        return
      }

      console.log('✅ Sync Successful:', data)
      this.$toast.success('Synced to National Hub')
    } catch (e) {
      console.error('❌ Critical system failure during sync:', e)
    }
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
    const medicationRecord = {
      ...med,
      id: 'MED-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Active',
      prescribedAt: new Date().toISOString()
    }
    commit('ADD_MEDICATION', medicationRecord)
    return medicationRecord
  },
  updateMedication({ commit }, med) {
    commit('UPDATE_MEDICATION', med)
  },
  orderLab({ commit, rootState }, order) {
    const labOrderRecord = {
      ...order,
      id: 'LAB-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Requested',
      requestedAt: new Date().toISOString()
    }
    commit('ADD_LAB_ORDER', labOrderRecord)
    return labOrderRecord
  },
  updateLabOrder({ commit }, order) {
    commit('UPDATE_LAB_ORDER', order)
  },
  orderImaging({ commit, rootState }, order) {
    const imagingOrderRecord = {
      ...order,
      id: 'IMG-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Requested',
      requestedAt: new Date().toISOString()
    }
    commit('ADD_IMAGING_ORDER', imagingOrderRecord)
    return imagingOrderRecord
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
  },
  recordVitalSigns({ commit, rootState }, vitals) {
    commit('ADD_VITAL_SIGNS', {
      ...vitals,
      id: 'VIT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution
    })
  },
  addNursingNote({ commit, rootState }, note) {
    const now = new Date().toISOString()
    const actor = note.recordedBy || rootState.auth.fullName || 'Unknown user'
    commit('ADD_NURSING_NOTE', {
      ...note,
      id: 'NNT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      createdBy: actor,
      createdAt: now,
      updatedBy: actor,
      updatedAt: now,
      auditTrail: [
        {
          id: 'AUD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'CREATED',
          actor,
          at: now,
          reason: 'Initial nursing note entry',
          changedFields: []
        }
      ]
    })
  },
  addMedicalNote({ commit, rootState }, note) {
    const now = new Date().toISOString()
    const actor = note.recordedBy || rootState.auth.fullName || 'Unknown user'
    commit('ADD_MEDICAL_NOTE', {
      ...note,
      id: 'MNT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      createdBy: actor,
      createdAt: now,
      updatedBy: actor,
      updatedAt: now,
      auditTrail: [
        {
          id: 'AUD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'CREATED',
          actor,
          at: now,
          reason: 'Initial medical note entry',
          changedFields: []
        }
      ]
    })
  },
  updateNursingNote({ state, commit, rootState }, payload) {
    const existing = state.nursingNotes.find(n => n.id === payload.id)
    if (!existing) return
    const now = new Date().toISOString()
    const actor = payload.updatedBy || rootState.auth.fullName || 'Unknown user'
    const updates = payload.updates || {}
    const next = {
      ...existing,
      ...updates,
      updatedBy: actor,
      updatedAt: now,
      auditTrail: [
        ...(existing.auditTrail || []),
        {
          id: 'AUD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'UPDATED',
          actor,
          at: now,
          reason: payload.reason || 'Nursing note updated',
          changedFields: getChangedFields(existing, updates)
        }
      ]
    }
    commit('UPDATE_NURSING_NOTE', next)
  },
  updateMedicalNote({ state, commit, rootState }, payload) {
    const existing = state.medicalNotes.find(n => n.id === payload.id)
    if (!existing) return
    const now = new Date().toISOString()
    const actor = payload.updatedBy || rootState.auth.fullName || 'Unknown user'
    const updates = payload.updates || {}
    const next = {
      ...existing,
      ...updates,
      updatedBy: actor,
      updatedAt: now,
      auditTrail: [
        ...(existing.auditTrail || []),
        {
          id: 'AUD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'UPDATED',
          actor,
          at: now,
          reason: payload.reason || 'Medical note updated',
          changedFields: getChangedFields(existing, updates)
        }
      ]
    }
    commit('UPDATE_MEDICAL_NOTE', next)
  },
  createTask({ commit, rootState }, task) {
    const now = new Date().toISOString()
    const actor = rootState.auth.fullName || 'Unknown user'
    const record = {
      ...task,
      id: 'TSK-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'pending',
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
      actionReason: task.actionReason || 'Task created from clinical order',
      history: [
        {
          id: 'THS-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'CREATED',
          status: 'pending',
          actor,
          at: now,
          reason: task.actionReason || 'Task created from clinical order'
        }
      ]
    }
    commit('ADD_TASK', record)
    return record
  },
  updateTaskStatus({ state, commit, rootState }, payload) {
    const task = state.tasks.find(t => t.id === payload.id)
    if (!task) return
    if (!['done', 'hold', 'cancel'].includes(payload.status)) return
    const now = new Date().toISOString()
    const actor = payload.updatedBy || rootState.auth.fullName || 'Unknown user'
    const reason = payload.reason || 'Task status updated'
    const next = {
      ...task,
      status: payload.status,
      updatedAt: now,
      updatedBy: actor,
      actionReason: reason,
      history: [
        ...(task.history || []),
        {
          id: 'THS-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'STATUS_UPDATED',
          status: payload.status,
          actor,
          at: now,
          reason
        }
      ]
    }
    commit('UPDATE_TASK', next)
  }
}

export const getters = {
  // ROLE HELPERS
  isClinical: (state, getters, rootState) => ['DOCTOR', 'NURSE', 'LAB', 'IMAGING', 'CLINICAL_STAFF'].includes(rootState.auth.role),
  isMinistry: (state, getters, rootState) => ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'].includes(rootState.auth.role),

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
  getVitalSigns: (state, getters, rootState) => {
    if (getters.isClinical) return state.vitalSigns.filter(v => v.institution === rootState.auth.institution)
    return state.vitalSigns
  },
  getNursingNotes: (state, getters, rootState) => {
    if (getters.isClinical) return state.nursingNotes.filter(n => n.institution === rootState.auth.institution)
    return state.nursingNotes
  },
  getMedicalNotes: (state, getters, rootState) => {
    if (getters.isClinical) return state.medicalNotes.filter(n => n.institution === rootState.auth.institution)
    return state.medicalNotes
  },
  getTasks: (state, getters, rootState) => {
    if (getters.isClinical) return state.tasks.filter(t => t.institution === rootState.auth.institution)
    return state.tasks
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

function getChangedFields(previous, updates) {
  return Object.keys(updates).filter((key) => {
    const prev = JSON.stringify(previous[key])
    const next = JSON.stringify(updates[key])
    return prev !== next
  })
}
