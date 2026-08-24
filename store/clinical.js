import { patientApi, clinicalApi, appointmentApi, inpatientApi } from '~/services/api'

export const namespaced = true

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
  documents: [],
  insuranceClaims: [],
  referrals: [],
  medicalTemplates: [],
  portalMessages: [],
  voiceDrafts: [],
  offlineMode: false,
  lastSync: null,
  viewMode: 'national',
  selectedAdmissionPatient: null,
  loading: false,
  error: null
})

export const mutations = {
  SET_PATIENTS(state, patients) { state.patients = patients },
  ADD_PATIENT(state, patient) { state.patients.push(patient) },
  UPDATE_PATIENT(state, patient) {
    const idx = state.patients.findIndex(p => p.id === patient.id)
    if (idx !== -1) state.patients.splice(idx, 1, patient)
  },
  UPDATE_PATIENT_ADMISSION_FLAG(state, payload) {
    const p = state.patients.find(pt => pt.id === payload.patientId)
    if (p) {
      p.pendingAdmission = payload.ward
      p.admissionStatus = payload.status
      p.admissionReason = payload.admissionReason || ''
    }
  },
  SET_VISITS(state, visits) { state.visits = visits },
  ADD_VISIT(state, visit) { state.visits.push(visit) },
  ADD_FIELD_REPORT(state, report) { state.fieldReports.push(report) },
  SET_OFFLINE_MODE(state, mode) { state.offlineMode = mode },
  SET_VIEW_MODE(state, mode) { state.viewMode = mode },
  SET_LAST_SYNC(state, timestamp) { state.lastSync = timestamp },
  SET_INPATIENTS(state, records) { state.inpatients = records },
  ADD_INPATIENT(state, record) { state.inpatients.push(record) },
  UPDATE_INPATIENT(state, record) {
    const idx = state.inpatients.findIndex(i => i.id === record.id)
    if (idx !== -1) state.inpatients.splice(idx, 1, record)
  },
  SET_APPOINTMENTS(state, appts) { state.appointments = appts },
  ADD_APPOINTMENT(state, appt) { state.appointments.push(appt) },
  UPDATE_APPOINTMENT(state, appt) {
    const idx = state.appointments.findIndex(a => a.id === appt.id)
    if (idx !== -1) state.appointments.splice(idx, 1, appt)
  },
  SET_MEDICATIONS(state, meds) { state.medications = meds },
  ADD_MEDICATION(state, med) { state.medications.push(med) },
  UPDATE_MEDICATION(state, med) {
    const idx = state.medications.findIndex(m => m.id === med.id)
    if (idx !== -1) state.medications.splice(idx, 1, med)
  },
  SET_LAB_ORDERS(state, orders) { state.labOrders = orders },
  ADD_LAB_ORDER(state, order) { state.labOrders.push(order) },
  UPDATE_LAB_ORDER(state, order) {
    const idx = state.labOrders.findIndex(o => o.id === order.id)
    if (idx !== -1) state.labOrders.splice(idx, 1, order)
  },
  SET_IMAGING_ORDERS(state, orders) { state.imagingOrders = orders },
  ADD_IMAGING_ORDER(state, order) { state.imagingOrders.push(order) },
  UPDATE_IMAGING_ORDER(state, order) {
    const idx = state.imagingOrders.findIndex(o => o.id === order.id)
    if (idx !== -1) state.imagingOrders.splice(idx, 1, order)
  },
  SET_LOADING(state, val) { state.loading = val },
  SET_ERROR(state, err) { state.error = err },
  SET_SELECTED_ADMISSION_PATIENT(state, patient) { state.selectedAdmissionPatient = patient },
  SET_MEDICAL_TEMPLATES(state, templates) { state.medicalTemplates = templates },
  UPDATE_MEDICAL_NOTE(state, note) {
    const idx = state.medicalNotes.findIndex(n => n.id === note.id)
    if (idx !== -1) state.medicalNotes.splice(idx, 1, note)
  }
}

export const getters = {
  getPatients: state => state.patients,
  patientDirectory: state => state.patients,
  patientDirectoryAll: state => state.patients,
  patientById: state => id => state.patients.find(p => p.id === id),
  getPatient: state => id => state.patients.find(p => p.id === id) || null,
  patientsByDepartment: state => dept =>
    state.patients.filter(p => p.currentDepartment === dept || p.departmentRouting === dept),
  getVisits: state => state.visits,
  getInpatients: state => state.inpatients,
  getLabOrders: state => state.labOrders,
  getImagingOrders: state => state.imagingOrders,
  getMedications: state => state.medications,
  loading: state => state.loading,
  error: state => state.error
}

export const actions = {
  // ─── Patients ────────────────────────────────────────────────────────────────
  async fetchPatients({ commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      const { data } = await patientApi.list(params)
      commit('SET_PATIENTS', data.patients || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async registerPatient({ commit, dispatch }, patientData) {
    commit('SET_LOADING', true)
    try {
      const { data } = await patientApi.create(patientData)
      commit('ADD_PATIENT', data.patient || data)
      await dispatch('fetchPatients')
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updatePatient({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await patientApi.update(id, data)
      commit('UPDATE_PATIENT', updated.patient || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  // ─── Visits ──────────────────────────────────────────────────────────────────
  async fetchVisits({ commit }) {
    try {
      const { data } = await clinicalApi.getVisits()
      commit('SET_VISITS', data.visits || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async logVisit({ commit }, visitData) {
    try {
      const { data } = await clinicalApi.createVisit(visitData)
      commit('ADD_VISIT', data.visit || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  // ─── Lab Orders ──────────────────────────────────────────────────────────────
  async fetchLabOrders({ commit }) {
    try {
      const { data } = await clinicalApi.getLabOrders()
      commit('SET_LAB_ORDERS', data.labOrders || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async orderLab({ commit }, orderData) {
    try {
      const { data } = await clinicalApi.createLabOrder(orderData)
      commit('ADD_LAB_ORDER', data.labOrder || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async updateLabOrder({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await clinicalApi.updateLabOrder(id, data)
      commit('UPDATE_LAB_ORDER', updated.labOrder || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  // ─── Imaging Orders ──────────────────────────────────────────────────────────
  async fetchImagingOrders({ commit }) {
    try {
      const { data } = await clinicalApi.getImagingOrders()
      commit('SET_IMAGING_ORDERS', data.imagingOrders || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async orderImaging({ commit }, orderData) {
    try {
      const { data } = await clinicalApi.createImagingOrder(orderData)
      commit('ADD_IMAGING_ORDER', data.imagingOrder || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async updateImagingOrder({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await clinicalApi.updateImagingOrder(id, data)
      commit('UPDATE_IMAGING_ORDER', updated.imagingOrder || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async uploadImagingFile({ commit }, { id, data }) {
    try {
      const { data: updated } = await clinicalApi.uploadImagingFile(id, data)
      commit('UPDATE_IMAGING_ORDER', updated.imagingOrder || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  // ─── Medications ─────────────────────────────────────────────────────────────
  async fetchMedications({ commit }) {
    try {
      const { data } = await clinicalApi.getMedications()
      commit('SET_MEDICATIONS', data.medications || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async prescribeMedication({ commit }, medData) {
    try {
      const { data } = await clinicalApi.createMedication(medData)
      commit('ADD_MEDICATION', data.medication || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async updateMedication({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await clinicalApi.updateMedication(id, data)
      commit('UPDATE_MEDICATION', updated.medication || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  // ─── Appointments ────────────────────────────────────────────────────────────
  async fetchAppointments({ commit }, params = {}) {
    try {
      const { data } = await appointmentApi.list(params)
      commit('SET_APPOINTMENTS', data.appointments || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async scheduleAppointment({ commit }, apptData) {
    try {
      const { data } = await appointmentApi.create(apptData)
      commit('ADD_APPOINTMENT', data.appointment || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async updateAppointment({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await appointmentApi.update(id, data)
      commit('UPDATE_APPOINTMENT', updated.appointment || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  // ─── Inpatients ──────────────────────────────────────────────────────────────
  async fetchInpatients({ commit }, params = {}) {
    try {
      const { data } = await inpatientApi.list(params)
      commit('SET_INPATIENTS', data.inpatients || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async admitPatient({ commit }, admitData) {
    try {
      const { data } = await inpatientApi.admit(admitData)
      commit('ADD_INPATIENT', data.inpatient || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async updateInpatient({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await inpatientApi.update(id, data)
      commit('UPDATE_INPATIENT', updated.inpatient || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  // ─── Demo Workflow ────────────────────────────────────────────────────────────
  async provisionPatientWorkflowDemo({ dispatch, state }) {
    // Reload patients and return the first one for demo navigation
    await dispatch('fetchPatients')
    const first = state.patients[0]
    return first ? first.id : null
  }
}


