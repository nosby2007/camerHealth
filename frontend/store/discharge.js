import { withBase } from '~/util/nursing-workflow.cjs'
import { dischargeApi } from '~/services/api'

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
  SET_MILESTONES(state, { patientId, records }) {
    state.dischargeMilestones = [...state.dischargeMilestones.filter(item => item.patientId !== patientId), ...records]
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
  SET_FOLLOW_UP_ORDERS(state, { patientId, records }) {
    state.followUpOrders = [...state.followUpOrders.filter(item => item.patientId !== patientId), ...records]
  },
  ADD_NOTE(state, record) { state.dischargeNotes.push(record) },
  SET_NOTES(state, { patientId, records }) {
    state.dischargeNotes = [...state.dischargeNotes.filter(item => item.patientId !== patientId), ...records]
  },
  ADD_MEDICATION(state, record) { state.dischargeMedications.push(record) },
  UPDATE_MEDICATION(state, record) {
    const idx = state.dischargeMedications.findIndex(item => item.id === record.id)
    if (idx >= 0) state.dischargeMedications.splice(idx, 1, record)
  },
  SET_MEDICATIONS(state, { patientId, records }) {
    state.dischargeMedications = [...state.dischargeMedications.filter(item => item.patientId !== patientId), ...records]
  },
  ADD_PRECaution(state, record) { state.returnPrecautions.push(record) },
  SET_PRECAUTIONS(state, { patientId, records }) {
    state.returnPrecautions = [...state.returnPrecautions.filter(item => item.patientId !== patientId), ...records]
  },
  ADD_APPOINTMENT(state, record) { state.appointments.push(record) },
  UPDATE_APPOINTMENT(state, record) {
    const idx = state.appointments.findIndex(item => item.id === record.id)
    if (idx >= 0) state.appointments.splice(idx, 1, record)
  },
  SET_APPOINTMENTS(state, { patientId, records }) {
    state.appointments = [...state.appointments.filter(item => item.patientId !== patientId), ...records]
  },
  ADD_AUDIT(state, record) { state.auditLogs.push(record) },
  SET_ERROR(state, error) { state.error = error }
}

// A DischargeFollowUp row is { id, kind, payload, status, createdAt } — this
// flattens it back into the shape the frontend has always worked with
// ({ id, status, createdAt, ...payload }), so nothing downstream has to change.
function flattenFollowUp(row) {
  return { ...row.payload, id: row.id, status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt }
}

// Strips record-management fields so only the caller's intended edits are
// merged into the DischargeFollowUp's payload JSON blob server-side.
const FOLLOW_UP_PAYLOAD_OMIT = ['id', 'patientId', 'admissionId', 'status', 'kind', 'createdAt', 'updatedAt']
function followUpPayloadDelta(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !FOLLOW_UP_PAYLOAD_OMIT.includes(key)))
}

export const actions = {
  async fetchDischargeOverview({ commit }, patientId) {
    try {
      const { data } = await dischargeApi.overview(patientId)
      commit('SET_MILESTONES', { patientId, records: (data.milestones || []).map(m => ({ ...m, patientId })) })
      const byKind = kind => (data.followUps || []).filter(f => f.kind === kind).map(flattenFollowUp)
      commit('SET_NOTES', { patientId, records: byKind('note') })
      commit('SET_FOLLOW_UP_ORDERS', { patientId, records: byKind('follow_up_order') })
      commit('SET_MEDICATIONS', { patientId, records: byKind('medication') })
      commit('SET_PRECAUTIONS', { patientId, records: byKind('return_precaution') })
      commit('SET_APPOINTMENTS', { patientId, records: byKind('appointment') })
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },
  async seedDischargeForPatient({ state, commit, rootState, dispatch }, { patientId, encounterId, admissionId }) {
    const exists = state.dischargeMilestones.some(item => item.patientId === patientId && item.encounterId === encounterId)
    if (exists) return
    const seed = [
      { title: 'Discharge readiness', owner: 'Care team', dueLabel: 'Today' },
      { title: 'Medication reconciliation', owner: 'Provider / Pharmacy', dueLabel: 'Before discharge' },
      { title: 'Family handoff', owner: 'Nurse', dueLabel: 'Today' },
      { title: 'Transport / escort', owner: 'Reception', dueLabel: 'Before discharge' }
    ]
    for (const [index, item] of seed.entries()) {
      const local = withBase(rootState, { patientId, encounterId, admissionId, status: 'pending', ...item, sortOrder: index }, 'DMS')
      try {
        const { data } = await dischargeApi.addMilestone({ patientId, admissionId, title: item.title, owner: item.owner, dueLabel: item.dueLabel, sortOrder: index })
        Object.assign(local, data.milestone, { patientId })
      } catch (err) {
        commit('SET_ERROR', err.response?.data?.error || err.message)
      }
      commit('ADD_MILESTONE', local)
    }
  },
  async addDischargeNote({ commit, rootState }, payload) {
    const local = withBase(rootState, { status: 'filed', ...payload }, 'DSN')
    try {
      const { data } = await dischargeApi.addFollowUp({ patientId: payload.patientId, admissionId: payload.admissionId, kind: 'note', payload })
      Object.assign(local, flattenFollowUp(data.followUp), { patientId: payload.patientId })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_NOTE', local)
    return local
  },
  async updateMilestone({ state, commit }, payload) {
    const existing = state.dischargeMilestones.find(item => item.id === payload.id)
    if (!existing) return null
    const record = { ...existing, ...payload }
    try {
      await dischargeApi.updateMilestone(payload.id, { status: payload.status, title: payload.title, owner: payload.owner, dueLabel: payload.dueLabel })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_MILESTONE', record)
    return record
  },
  async addFollowUpOrder({ commit, rootState }, payload) {
    const local = withBase(rootState, { status: 'open', ...payload }, 'DFU')
    try {
      const { data } = await dischargeApi.addFollowUp({ patientId: payload.patientId, admissionId: payload.admissionId, kind: 'follow_up_order', payload })
      Object.assign(local, flattenFollowUp(data.followUp), { patientId: payload.patientId })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_FOLLOW_UP_ORDER', local)
    return local
  },
  async updateFollowUpOrder({ state, commit }, payload) {
    const existing = state.followUpOrders.find(item => item.id === payload.id)
    if (!existing) return null
    const record = { ...existing, ...payload }
    try {
      await dischargeApi.updateFollowUp(payload.id, { status: payload.status, payload: followUpPayloadDelta(payload) })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_FOLLOW_UP_ORDER', record)
    return record
  },
  async addDischargeMedication({ commit, rootState }, payload) {
    const local = withBase(rootState, { status: 'active', ...payload }, 'DMD')
    try {
      const { data } = await dischargeApi.addFollowUp({ patientId: payload.patientId, admissionId: payload.admissionId, kind: 'medication', payload })
      Object.assign(local, flattenFollowUp(data.followUp), { patientId: payload.patientId })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_MEDICATION', local)
    return local
  },
  async updateDischargeMedication({ state, commit }, payload) {
    const existing = state.dischargeMedications.find(item => item.id === payload.id)
    if (!existing) return null
    const record = { ...existing, ...payload }
    try {
      await dischargeApi.updateFollowUp(payload.id, { status: payload.status, payload: followUpPayloadDelta(payload) })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_MEDICATION', record)
    return record
  },
  async addReturnPrecaution({ commit, rootState }, payload) {
    const local = withBase(rootState, { status: 'open', ...payload }, 'DRP')
    try {
      const { data } = await dischargeApi.addFollowUp({ patientId: payload.patientId, admissionId: payload.admissionId, kind: 'return_precaution', payload })
      Object.assign(local, flattenFollowUp(data.followUp), { patientId: payload.patientId })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_PRECaution', local)
    return local
  },
  async addDischargeAppointment({ commit, rootState }, payload) {
    const local = withBase(rootState, { status: 'scheduled', ...payload }, 'DAP')
    try {
      const { data } = await dischargeApi.addFollowUp({ patientId: payload.patientId, admissionId: payload.admissionId, kind: 'appointment', payload })
      Object.assign(local, flattenFollowUp(data.followUp), { patientId: payload.patientId })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_APPOINTMENT', local)
    return local
  },
  async updateDischargeAppointment({ state, commit }, payload) {
    const existing = state.appointments.find(item => item.id === payload.id)
    if (!existing) return null
    const record = { ...existing, ...payload }
    try {
      await dischargeApi.updateFollowUp(payload.id, { status: payload.status, payload: followUpPayloadDelta(payload) })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
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
    const notes = forPatient(state.dischargeNotes)
    const meds = forPatient(state.dischargeMedications)
    const precautions = forPatient(state.returnPrecautions)
    const appointments = forPatient(state.appointments)
    const openItems = [...milestones, ...readiness, ...followUpOrders].filter(item => !['completed', 'closed', 'done', 'resolved'].includes(String(item.status || '').toLowerCase()))
    return {
      milestoneCount: milestones.length,
      readinessCount: readiness.length,
      followUpCount: followUpOrders.length,
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
