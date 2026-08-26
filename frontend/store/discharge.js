import { withBase } from '~/util/nursing-workflow.cjs'

const scoped = (arr, rootState) => {
  if (!arr) return []
  const facility = rootState.auth?.facilityId
  if (!facility) return []
  return arr.filter(item => item && item.facilityId === facility)
}

export const state = () => ({
  dischargeMilestones: [],
  dischargeReadiness: [],
  followUpOrders: [],
  dischargeTasks: [],
  dischargeNotes: [],
  dischargeMedications: [],
  returnPrecautions: [],
  appointments: [],
  auditLogs: []
})

export const mutations = {
  ADD_MILESTONE(state, record) { state.dischargeMilestones.push(record) },
  UPDATE_MILESTONE(state, record) {
    const idx = state.dischargeMilestones.findIndex(item => item.id === record.id)
    if (idx >= 0) state.dischargeMilestones.splice(idx, 1, record)
  },
  ADD_READINESS(state, record) { state.dischargeReadiness.push(record) },
  UPDATE_READINESS(state, record) {
    const idx = state.dischargeReadiness.findIndex(item => item.id === record.id)
    if (idx >= 0) state.dischargeReadiness.splice(idx, 1, record)
  },
  ADD_FOLLOW_UP_ORDER(state, record) { state.followUpOrders.push(record) },
  UPDATE_FOLLOW_UP_ORDER(state, record) {
    const idx = state.followUpOrders.findIndex(item => item.id === record.id)
    if (idx >= 0) state.followUpOrders.splice(idx, 1, record)
  },
  ADD_TASK(state, record) { state.dischargeTasks.push(record) },
  UPDATE_TASK(state, record) {
    const idx = state.dischargeTasks.findIndex(item => item.id === record.id)
    if (idx >= 0) state.dischargeTasks.splice(idx, 1, record)
  },
  ADD_NOTE(state, record) { state.dischargeNotes.push(record) },
  ADD_MEDICATION(state, record) { state.dischargeMedications.push(record) },
  UPDATE_MEDICATION(state, record) {
    const idx = state.dischargeMedications.findIndex(item => item.id === record.id)
    if (idx >= 0) state.dischargeMedications.splice(idx, 1, record)
  },
  ADD_PRECaution(state, record) { state.returnPrecautions.push(record) },
  ADD_APPOINTMENT(state, record) { state.appointments.push(record) },
  UPDATE_APPOINTMENT(state, record) {
    const idx = state.appointments.findIndex(item => item.id === record.id)
    if (idx >= 0) state.appointments.splice(idx, 1, record)
  },
  ADD_AUDIT(state, record) { state.auditLogs.push(record) }
}

export const actions = {
  seedDischargeForPatient({ state, commit, rootState }, { patientId, encounterId, admissionId }) {
    const exists = state.dischargeMilestones.some(item => item.patientId === patientId && item.encounterId === encounterId)
    if (exists) return
    const seed = [
      { title: 'Discharge readiness', owner: 'Care team', status: 'pending', dueLabel: 'Today' },
      { title: 'Medication reconciliation', owner: 'Provider / Pharmacy', status: 'pending', dueLabel: 'Before discharge' },
      { title: 'Family handoff', owner: 'Nurse', status: 'pending', dueLabel: 'Today' },
      { title: 'Transport / escort', owner: 'Reception', status: 'pending', dueLabel: 'Before discharge' }
    ]
    seed.forEach((item, index) => {
      commit('ADD_MILESTONE', withBase(rootState, { patientId, encounterId, admissionId, ...item, sortOrder: index }, 'DMS'))
    })
  },
  addDischargeNote({ commit, rootState }, payload) {
    const record = withBase(rootState, { status: 'filed', ...payload }, 'DSN')
    commit('ADD_NOTE', record)
    return record
  },
  updateMilestone({ state, commit, rootState }, payload) {
    const existing = state.dischargeMilestones.find(item => item.id === payload.id)
    if (!existing) return null
    const record = { ...existing, ...payload }
    commit('UPDATE_MILESTONE', record)
    return record
  },
  addFollowUpOrder({ commit, rootState }, payload) {
    const record = withBase(rootState, { status: 'open', ...payload }, 'DFU')
    commit('ADD_FOLLOW_UP_ORDER', record)
    return record
  },
  updateFollowUpOrder({ state, commit }, payload) {
    const existing = state.followUpOrders.find(item => item.id === payload.id)
    if (!existing) return null
    const record = { ...existing, ...payload }
    commit('UPDATE_FOLLOW_UP_ORDER', record)
    return record
  },
  addDischargeMedication({ commit, rootState }, payload) {
    const record = withBase(rootState, { status: 'active', ...payload }, 'DMD')
    commit('ADD_MEDICATION', record)
    return record
  },
  updateDischargeMedication({ state, commit }, payload) {
    const existing = state.dischargeMedications.find(item => item.id === payload.id)
    if (!existing) return null
    const record = { ...existing, ...payload }
    commit('UPDATE_MEDICATION', record)
    return record
  },
  addReturnPrecaution({ commit, rootState }, payload) {
    const record = withBase(rootState, { status: 'open', ...payload }, 'DRP')
    commit('ADD_PRECaution', record)
    return record
  },
  addDischargeAppointment({ commit, rootState }, payload) {
    const record = withBase(rootState, { status: 'scheduled', ...payload }, 'DAP')
    commit('ADD_APPOINTMENT', record)
    return record
  },
  updateDischargeAppointment({ state, commit }, payload) {
    const existing = state.appointments.find(item => item.id === payload.id)
    if (!existing) return null
    const record = { ...existing, ...payload }
    commit('UPDATE_APPOINTMENT', record)
    return record
  }
}

export const getters = {
  patientDischargeOverview: (state, getters, rootState) => (patientId) => {
    const forPatient = records => scoped(records, rootState).filter(item => item.patientId === patientId)
    const milestones = forPatient(state.dischargeMilestones)
    const readiness = forPatient(state.dischargeReadiness)
    const followUpOrders = forPatient(state.followUpOrders)
    const tasks = forPatient(state.dischargeTasks)
    const notes = forPatient(state.dischargeNotes)
    const meds = forPatient(state.dischargeMedications)
    const precautions = forPatient(state.returnPrecautions)
    const appointments = forPatient(state.appointments)
    const openItems = [...milestones, ...readiness, ...followUpOrders, ...tasks].filter(item => !['completed', 'closed', 'done', 'resolved'].includes(String(item.status || '').toLowerCase()))
    return {
      milestoneCount: milestones.length,
      readinessCount: readiness.length,
      followUpCount: followUpOrders.length,
      taskCount: tasks.length,
      noteCount: notes.length,
      medicationCount: meds.length,
      precautionCount: precautions.length,
      appointmentCount: appointments.length,
      openCount: openItems.length,
      latestNote: notes[0] || null,
      latestAppointment: appointments[0] || null
    }
  }
}
