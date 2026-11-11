const { assertPatientWritable: assertWritableRecord } = require('../util/patient-360-policy.cjs')
const { taskFromProviderOrder, mapSnakeTask } = require('../util/nursing-workflow.cjs')
import { woundCareApi, taskApi, clinicalNotesApi } from '~/services/api'

const PREFIX = 'camero_health_nursing_'

export const state = () => ({
  bodyMapMarkers: [],
  wounds: [],
  woundAssessments: [],
  woundPhotos: [],
  woundTreatments: [],
  nursingAssessments: [],
  clinicalNotes: [],
  orders: [],
  tasks: [],
  carePlans: [],
  documents: [],
  auditLogs: [],
  error: null
})

export const mutations = {
  LOAD_FROM_STORAGE(state) {
    Object.keys(state).forEach(key => { state[key] = load(key) || [] })
  },
  ADD_RECORD(state, { collection, record }) {
    state[collection].push(record)
    save(collection, state[collection])
  },
  UPDATE_RECORD(state, { collection, record }) {
    const idx = state[collection].findIndex(item => item.id === record.id)
    if (idx !== -1) {
      state[collection].splice(idx, 1, record)
      save(collection, state[collection])
    }
  },
  // Upserts one patient's fetched records into a shared collection instead of
  // replacing it outright — other patients' records (used by facility-wide
  // aggregates like nurseDashboardMetrics) must survive a per-patient fetch.
  MERGE_PATIENT_COLLECTION(state, { collection, patientId, records }) {
    const others = state[collection].filter(item => item.patientId !== patientId)
    state[collection] = [...others, ...records]
    save(collection, state[collection])
  },
  SET_COLLECTION(state, { collection, records }) {
    state[collection] = records
    save(collection, state[collection])
  },
  ADD_AUDIT(state, entry) {
    state.auditLogs.unshift(entry)
    if (state.auditLogs.length > 1000) state.auditLogs.pop()
    save('auditLogs', state.auditLogs)
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

export const actions = {
  createBodyMapMarker({ commit, dispatch, rootState }, marker) {
    assertPatientWritable(rootState, marker.patientId)
    const record = withBase(rootState, marker, 'BMM')
    commit('ADD_RECORD', { collection: 'bodyMapMarkers', record })
    dispatch('audit', { action: 'BODY_MARKER_CREATED', targetTable: 'body_map_markers', targetId: record.id, patientId: record.patientId })
    return record
  },
  updateBodyMapMarker({ state, commit, dispatch, rootState }, marker) {
    const existing = state.bodyMapMarkers.find(item => item.id === marker.id)
    if (!existing) return null
    assertPatientWritable(rootState, existing.patientId)
    const record = { ...existing, ...marker, updatedAt: new Date().toISOString() }
    commit('UPDATE_RECORD', { collection: 'bodyMapMarkers', record })
    dispatch('audit', { action: 'BODY_MARKER_UPDATED', targetTable: 'body_map_markers', targetId: record.id, patientId: record.patientId })
    return record
  },
  async createWound({ commit, dispatch, rootState }, wound) {
    assertPatientWritable(rootState, wound.patientId)
    const record = withBase(rootState, { status: 'active', ...wound }, 'WND')
    try {
      const { data } = await woundCareApi.create(wound)
      Object.assign(record, data.wound)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
    commit('ADD_RECORD', { collection: 'wounds', record })
    dispatch('audit', { action: 'WOUND_CREATED', targetTable: 'wounds', targetId: record.id, patientId: record.patientId })
    return record
  },
  async updateWound({ state, commit, dispatch, rootState }, wound) {
    const existing = state.wounds.find(item => item.id === wound.id)
    if (!existing) return null
    assertPatientWritable(rootState, existing.patientId)
    const record = { ...existing, ...wound, updatedAt: new Date().toISOString() }
    try {
      const { data } = await woundCareApi.update(existing.id, wound)
      Object.assign(record, data.wound)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
    commit('UPDATE_RECORD', { collection: 'wounds', record })
    dispatch('audit', { action: 'WOUND_UPDATED', targetTable: 'wounds', targetId: record.id, patientId: record.patientId })
    return record
  },
  async createWoundAssessment({ state, commit, dispatch, rootState }, assessment) {
    const wound = state.wounds.find(item => item.id === assessment.woundId)
    assertPatientWritable(rootState, assessment.patientId || wound?.patientId)
    const record = withBase(rootState, {
      ...assessment,
      patientId: assessment.patientId || (wound && wound.patientId),
      surfaceArea: null,
      volume: null,
      warningAreaIncreased: false
    }, 'WAS')
    try {
      const { data } = await woundCareApi.addAssessment(assessment.woundId, assessment)
      Object.assign(record, data.assessment)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
    commit('ADD_RECORD', { collection: 'woundAssessments', record })
    dispatch('audit', { action: 'WOUND_ASSESSMENT_CREATED', targetTable: 'wound_assessments', targetId: record.id, patientId: record.patientId })
    return record
  },
  async addWoundPhoto({ commit, dispatch, rootState }, photo) {
    assertPatientWritable(rootState, photo.patientId)
    const record = withBase(rootState, photo, 'WPH')
    try {
      const { data } = await woundCareApi.addPhoto(photo.woundId, photo)
      Object.assign(record, data.photo)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
    commit('ADD_RECORD', { collection: 'woundPhotos', record })
    dispatch('audit', { action: 'WOUND_PHOTO_ADDED', targetTable: 'wound_photos', targetId: record.id, patientId: record.patientId })
    return record
  },
  createNursingAssessment({ commit, dispatch, rootState }, assessment) {
    assertPatientWritable(rootState, assessment.patientId)
    const record = withBase(rootState, assessment, 'NAS')
    commit('ADD_RECORD', { collection: 'nursingAssessments', record })
    dispatch('audit', { action: 'NURSING_ASSESSMENT_CREATED', targetTable: 'nursing_assessments', targetId: record.id, patientId: record.patientId })
    return record
  },
  // Single entry point every Nurse Command Center patient page calls on
  // mount — each page only ever showed LOAD_FROM_STORAGE (this browser's own
  // localStorage cache) before, so a chart opened on a different device or
  // after a cache clear looked empty even though real data existed.
  async loadPatientChart({ dispatch }, patientId) {
    if (!patientId) return
    await Promise.all([
      dispatch('fetchWounds', patientId),
      dispatch('fetchTasks', patientId),
      dispatch('fetchClinicalNotes', patientId),
      dispatch('fetchCarePlans', patientId)
    ])
  },
  async fetchWounds({ commit }, patientId) {
    try {
      const { data } = await woundCareApi.listForPatient(patientId)
      const wounds = (data.wounds || []).map(w => ({ ...w, assessments: undefined, photos: undefined }))
      const assessments = (data.wounds || []).flatMap(w => w.assessments || [])
      const photos = (data.wounds || []).flatMap(w => w.photos || [])
      commit('MERGE_PATIENT_COLLECTION', { collection: 'wounds', patientId, records: wounds })
      commit('MERGE_PATIENT_COLLECTION', { collection: 'woundAssessments', patientId, records: assessments })
      commit('MERGE_PATIENT_COLLECTION', { collection: 'woundPhotos', patientId, records: photos })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },
  async fetchTasks({ commit }, patientId) {
    try {
      const { data } = await taskApi.list(patientId ? { patientId } : {})
      if (patientId) {
        commit('MERGE_PATIENT_COLLECTION', { collection: 'tasks', patientId, records: data.tasks || [] })
      } else {
        commit('SET_COLLECTION', { collection: 'tasks', records: data.tasks || [] })
      }
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },
  async fetchClinicalNotes({ commit }, patientId) {
    try {
      const { data } = await clinicalNotesApi.list(patientId)
      commit('MERGE_PATIENT_COLLECTION', { collection: 'clinicalNotes', patientId, records: data.notes || [] })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },
  async fetchCarePlans({ commit }, patientId) {
    try {
      const { data } = await clinicalNotesApi.list(patientId, 'plan_of_care')
      commit('MERGE_PATIENT_COLLECTION', { collection: 'carePlans', patientId, records: data.notes || [] })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },
  createOrder({ commit, dispatch, rootState }, order) {
    assertPatientWritable(rootState, order.patientId)
    const record = withBase(rootState, { status: 'active', ...order }, 'ORD')
    commit('ADD_RECORD', { collection: 'orders', record })
    dispatch('audit', { action: 'ORDER_CREATED', targetTable: 'orders', targetId: record.id, patientId: record.patientId })
    const task = taskFromProviderOrder({
      id: record.id,
      patient_id: record.patientId,
      facility_id: record.facilityId,
      assigned_role: record.assignedRole,
      assigned_staff_id: record.assignedStaffId,
      order_type: record.orderType,
      title: record.title,
      priority: record.priority,
      reason: record.reason,
      instructions: record.instructions,
      due_at: record.dueAt
    })
    if (task) dispatch('createTask', mapSnakeTask(task))
    return record
  },
  async createTask({ commit, dispatch, rootState }, task) {
    assertPatientWritable(rootState, task.patientId)
    const local = withBase(rootState, { status: 'pending', priority: 'routine', ...task }, 'NTK')
    try {
      const { data } = await taskApi.create({
        patientId: task.patientId,
        relatedType: task.linkedOrderType || task.relatedType,
        relatedId: task.linkedOrderId || task.relatedId,
        title: task.title,
        assignedToRole: task.assignedToRole || rootState.auth.role || 'NURSE',
        assignedToId: task.assignedNurseId || task.assignedToId,
        priority: task.priority,
        dueAt: task.dueAt,
        actionReason: task.reason
      })
      Object.assign(local, data.task)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_RECORD', { collection: 'tasks', record: local })
    dispatch('audit', { action: 'TASK_CREATED', targetTable: 'tasks', targetId: local.id, patientId: local.patientId })
    return local
  },
  async updateTaskStatus({ state, commit, dispatch, rootState }, { id, status, reason }) {
    const task = state.tasks.find(item => item.id === id)
    if (!task) return null
    assertPatientWritable(rootState, task.patientId)
    const allowed = ['pending', 'in_progress', 'completed', 'refused', 'missed', 'cancelled']
    if (!allowed.includes(status)) return null
    const now = new Date().toISOString()
    const record = {
      ...task,
      status,
      completedAt: status === 'completed' ? now : task.completedAt,
      updatedAt: now,
      statusReason: reason || '',
      history: [
        ...(task.history || []),
        { action: 'STATUS_CHANGED', status, reason, actor: rootState.auth.fullName || rootState.auth.staffId || 'Unknown', at: now }
      ]
    }
    try {
      await taskApi.updateStatus(id, { status, reason })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_RECORD', { collection: 'tasks', record })
    dispatch('audit', { action: `TASK_${status.toUpperCase()}`, targetTable: 'tasks', targetId: record.id, patientId: record.patientId, detail: reason })
    return record
  },
  async createClinicalNote({ commit, dispatch, rootState }, note) {
    assertPatientWritable(rootState, note.patientId)
    const local = withBase(rootState, { status: 'draft', ...note }, 'CNO')
    try {
      const { data } = await clinicalNotesApi.create({
        patientId: note.patientId,
        encounterId: note.encounterId,
        noteType: note.noteType || 'nursing_note',
        title: note.title,
        body: note.body || note.note || note.text || '',
        status: note.status || 'draft',
        authorRole: note.authorRole
      })
      Object.assign(local, data.note)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_RECORD', { collection: 'clinicalNotes', record: local })
    dispatch('audit', { action: 'NOTE_CREATED', targetTable: 'clinical_notes', targetId: local.id, patientId: local.patientId })
    return local
  },
  async updateClinicalNote({ state, commit, dispatch, rootState }, note) {
    const existing = state.clinicalNotes.find(item => item.id === note.id)
    if (!existing || existing.status === 'signed') return null
    assertPatientWritable(rootState, existing.patientId)
    const record = { ...existing, ...note, updatedAt: new Date().toISOString() }
    try {
      await clinicalNotesApi.update(existing.id, { title: record.title, body: record.body, status: record.status })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_RECORD', { collection: 'clinicalNotes', record })
    dispatch('audit', { action: 'NOTE_UPDATED', targetTable: 'clinical_notes', targetId: record.id, patientId: record.patientId })
    return record
  },
  async signClinicalNote({ state, commit, dispatch, rootState }, id) {
    const note = state.clinicalNotes.find(item => item.id === id)
    if (!note) return null
    assertPatientWritable(rootState, note.patientId)
    const record = { ...note, status: 'signed', signedAt: new Date().toISOString(), signedBy: rootState.auth.fullName || rootState.auth.staffId }
    try {
      await clinicalNotesApi.sign(id)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_RECORD', { collection: 'clinicalNotes', record })
    dispatch('audit', { action: 'NOTE_SIGNED', targetTable: 'clinical_notes', targetId: record.id, patientId: record.patientId })
    return record
  },
  async shareClinicalNote({ state, commit, dispatch, rootState }, id) {
    const note = state.clinicalNotes.find(item => item.id === id)
    if (!note || note.status === 'draft') return null
    assertPatientWritable(rootState, note.patientId)
    const record = { ...note, sharedWithCareTeam: true, sharedAt: new Date().toISOString(), sharedBy: rootState.auth.fullName || rootState.auth.staffId }
    try {
      await clinicalNotesApi.share(id)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_RECORD', { collection: 'clinicalNotes', record })
    dispatch('audit', { action: 'NOTE_SHARED', targetTable: 'clinical_notes', targetId: record.id, patientId: record.patientId })
    return record
  },
  async amendClinicalNote({ state, commit, dispatch, rootState }, { id, amendment }) {
    const note = state.clinicalNotes.find(item => item.id === id)
    if (!note || note.status !== 'signed') return null
    assertPatientWritable(rootState, note.patientId)
    const record = {
      ...note,
      status: 'amended',
      amendments: [
        ...(note.amendments || []),
        { id: makeId('AMD'), body: amendment, actor: rootState.auth.fullName || rootState.auth.staffId, at: new Date().toISOString() }
      ]
    }
    try {
      await clinicalNotesApi.amend(id, amendment)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_RECORD', { collection: 'clinicalNotes', record })
    dispatch('audit', { action: 'NOTE_AMENDED', targetTable: 'clinical_notes', targetId: record.id, patientId: record.patientId })
    return record
  },
  signOrder({ state, commit, dispatch, rootState }, id) {
    const order = state.orders.find(item => item.id === id)
    if (!order) return null
    assertPatientWritable(rootState, order.patientId)
    const record = { ...order, status: 'signed', signedAt: new Date().toISOString(), signedBy: rootState.auth.fullName || rootState.auth.staffId }
    commit('UPDATE_RECORD', { collection: 'orders', record })
    dispatch('audit', { action: 'ORDER_SIGNED', targetTable: 'orders', targetId: record.id, patientId: record.patientId })
    dispatch('clinical/createTasksFromClinicalOrder', {
      order: {
        id: record.id,
        type: record.orderType,
        category: record.orderType,
        medication: record.medication && record.medication.name,
        description: record.title || record.notes || record.reason || `${record.orderType} order`,
        assigned_role: record.assignedRole || orderRole(record.orderType),
        assigned_user_id: record.assignedStaffId || null,
        priority: record.priority || 'Routine',
        due_at: record.startDateTime || record.dueAt || record.signedAt,
        frequency: record.frequency || 'Once'
      },
      patient: { id: record.patientId },
      encounter: { id: record.encounterId }
    }, { root: true })
    return record
  },
  updateMedicationAdministration({ commit, dispatch, rootState }, { patientId, encounterId, medicationId, marData }) {
    assertPatientWritable(rootState, patientId)
    const record = withBase(rootState, {
      patientId,
      encounterId,
      medicationId,
      ...marData,
      status: marData.status || 'given'
    }, 'MAR')
    commit('ADD_RECORD', { collection: 'documents', record })
    dispatch('audit', { action: 'MEDICATION_ADMINISTERED', targetTable: 'medication_administrations', targetId: record.id, patientId })
    return record
  },
  completeMedicationReconciliation({ commit, dispatch, rootState }, { patientId, encounterId, reconciliationData, completedAt }) {
    assertPatientWritable(rootState, patientId)
    const record = withBase(rootState, {
      patientId,
      encounterId,
      type: 'medication_reconciliation',
      ...reconciliationData,
      completedAt,
      status: 'completed'
    }, 'MRC')
    commit('ADD_RECORD', { collection: 'documents', record })
    dispatch('audit', { action: 'MEDICATION_RECONCILIATION_COMPLETED', targetTable: 'medication_reconciliations', targetId: record.id, patientId })
    return record
  },
  // This is a lightweight problem/goal/interventions note (CarePlanDialog.vue),
  // distinct from the full CarePlan/goals/outcomes structure in store/carePlan.js
  // — it's filed as a plan_of_care ClinicalNote so it actually persists.
  async createCarePlan({ commit, dispatch, rootState }, carePlan) {
    assertPatientWritable(rootState, carePlan.patientId)
    const local = withBase(rootState, { status: 'draft', ...carePlan }, 'CPL')
    const body = `Problem: ${carePlan.problem || '—'}\nGoal: ${carePlan.goal || '—'}\nInterventions: ${carePlan.interventions || '—'}${carePlan.targetDate ? '\nTarget date: ' + carePlan.targetDate : ''}`
    try {
      const { data } = await clinicalNotesApi.create({
        patientId: carePlan.patientId,
        noteType: 'plan_of_care',
        title: carePlan.problem,
        body,
        status: 'draft',
        authorRole: carePlan.authorRole,
        structuredData: { problem: carePlan.problem, goal: carePlan.goal, interventions: carePlan.interventions, targetDate: carePlan.targetDate }
      })
      Object.assign(local, data.note)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_RECORD', { collection: 'carePlans', record: local })
    dispatch('audit', { action: 'CARE_PLAN_CREATED', targetTable: 'care_plans', targetId: local.id, patientId: local.patientId })
    return local
  },
  async signCarePlan({ state, commit, dispatch, rootState }, id) {
    const plan = state.carePlans.find(item => item.id === id)
    if (!plan) return null
    assertPatientWritable(rootState, plan.patientId)
    let signedAt = new Date().toISOString()
    try {
      const { data } = await clinicalNotesApi.sign(id)
      signedAt = data.note.signedAt
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    const record = { ...plan, status: 'active', signedAt, signedBy: rootState.auth.fullName || rootState.auth.staffId }
    commit('UPDATE_RECORD', { collection: 'carePlans', record })
    dispatch('audit', { action: 'CARE_PLAN_SIGNED', targetTable: 'care_plans', targetId: record.id, patientId: record.patientId })
    return record
  },
  async archiveCarePlan({ state, commit, dispatch, rootState }, id) {
    const plan = state.carePlans.find(item => item.id === id)
    if (!plan) return null
    assertPatientWritable(rootState, plan.patientId)
    const record = { ...plan, status: 'archived', archivedAt: new Date().toISOString(), archivedBy: rootState.auth.fullName || rootState.auth.staffId }
    try {
      await clinicalNotesApi.update(id, { status: 'archived' })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_RECORD', { collection: 'carePlans', record })
    dispatch('audit', { action: 'CARE_PLAN_ARCHIVED', targetTable: 'care_plans', targetId: record.id, patientId: record.patientId })
    return record
  },
  createDocument({ commit, dispatch, rootState }, document) {
    assertPatientWritable(rootState, document.patientId)
    const record = withBase(rootState, document, 'NDC')
    commit('ADD_RECORD', { collection: 'documents', record })
    dispatch('audit', { action: 'DOCUMENT_CREATED', targetTable: 'documents', targetId: record.id, patientId: record.patientId })
    return record
  },
  audit({ commit, rootState }, event) {
    commit('ADD_AUDIT', {
      id: makeId('AUD'),
      facilityId: rootState.auth.facilityId || '',
      actor: rootState.auth.fullName || rootState.auth.staffId || 'Unknown user',
      actorRole: rootState.auth.role || 'UNKNOWN',
      action: event.action,
      targetTable: event.targetTable,
      targetId: event.targetId,
      patientId: event.patientId,
      detail: event.detail || '',
      createdAt: new Date().toISOString()
    })
  }
}

function scoped(items, rootState) {
  const facilityId = rootState.auth && rootState.auth.facilityId
  if (!facilityId) return []
  return items.filter(item => item && item.facilityId === facilityId)
}

function assertPatientWritable(rootState, patientId) {
  if (!patientId) return
  const patient = rootState.clinical?.patients?.find(item => item.id === patientId)
  if (!patient) return
  assertWritableRecord(patient)
}

export const getters = {
  getBodyMapMarkers: (state, getters, rootState, rootGetters) => scoped(state.bodyMapMarkers, rootState, rootGetters),
  getWounds: (state, getters, rootState, rootGetters) => scoped(state.wounds, rootState, rootGetters),
  getWoundAssessments: (state, getters, rootState, rootGetters) => scoped(state.woundAssessments, rootState, rootGetters),
  getWoundPhotos: (state, getters, rootState, rootGetters) => scoped(state.woundPhotos, rootState, rootGetters),
  getNursingAssessments: (state, getters, rootState, rootGetters) => scoped(state.nursingAssessments, rootState, rootGetters),
  getClinicalNotes: (state, getters, rootState, rootGetters) => scoped(state.clinicalNotes, rootState, rootGetters),
  getOrders: (state, getters, rootState, rootGetters) => scoped(state.orders, rootState, rootGetters),
  getTasks: (state, getters, rootState, rootGetters) => scoped(state.tasks, rootState, rootGetters),
  getCarePlans: (state, getters, rootState, rootGetters) => scoped(state.carePlans, rootState, rootGetters),
  getDocuments: (state, getters, rootState, rootGetters) => scoped(state.documents, rootState, rootGetters),
  getAuditLogs: (state, getters, rootState, rootGetters) => scoped(state.auditLogs, rootState, rootGetters),
  patientNursing360: (state, getters, rootState, rootGetters) => patientId => {
    const patients = rootGetters['clinical/getPatients'] || []
    const patient = patients.find(item => item.id === patientId)
    const forPatient = collection => getters[collection].filter(item => item.patientId === patientId)
    return {
      patient,
      markers: forPatient('getBodyMapMarkers'),
      wounds: forPatient('getWounds'),
      woundAssessments: forPatient('getWoundAssessments'),
      notes: forPatient('getClinicalNotes'),
      tasks: forPatient('getTasks'),
      orders: forPatient('getOrders'),
      carePlans: forPatient('getCarePlans'),
      documents: forPatient('getDocuments'),
      audit: forPatient('getAuditLogs')
    }
  },
  woundTrend: (state, getters, rootState, rootGetters) => woundId => scoped(state.woundAssessments, rootState, rootGetters)
    .filter(item => item.woundId === woundId)
    .sort((a, b) => new Date(a.assessedAt || a.createdAt) - new Date(b.assessedAt || b.createdAt)),
  nurseDashboardMetrics: (state, getters, rootState, rootGetters) => {
    const patients = rootGetters['clinical/patientDirectory'] || []
    const tasks = getters.getTasks
    const wounds = getters.getWounds
    const notes = getters.getClinicalNotes
    const woundAssessments = getters.getWoundAssessments
    return {
      assignedPatients: patients.length,
      openTasks: tasks.filter(item => ['pending', 'in_progress'].includes(item.status)).length,
      activeWounds: wounds.filter(item => item.status !== 'healed' && item.status !== 'closed').length,
      unsignedNotes: notes.filter(item => item.status !== 'signed').length,
      woundWarnings: woundAssessments.filter(item => item.warningAreaIncreased).length
    }
  }
}

function withBase(rootState, payload, prefix) {
  const now = new Date().toISOString()
  return {
    ...payload,
    id: payload.id || makeId(prefix),
    facilityId: payload.facilityId || rootState.auth.facilityId || '',
    createdBy: payload.createdBy || rootState.auth.fullName || rootState.auth.staffId || 'Unknown user',
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now
  }
}

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
}

function save(key, value) {
  if (!process.client) return
  const facilityId = sessionStorage.getItem('camero_facility_id')
  if (!facilityId) return
  const scopedValue = Array.isArray(value) ? value.filter(item => item && item.facilityId === facilityId) : value
  localStorage.setItem(`${PREFIX}${facilityId}_${key}`, JSON.stringify(scopedValue))
}

function load(key) {
  if (!process.client) return null
  const facilityId = sessionStorage.getItem('camero_facility_id')
  localStorage.removeItem(PREFIX + key)
  if (!facilityId) return null
  const storageKey = `${PREFIX}${facilityId}_${key}`
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey))
    return Array.isArray(parsed) ? parsed.filter(item => item && item.facilityId === facilityId) : parsed
  } catch (_) {
    localStorage.removeItem(storageKey)
    return null
  }
}

function orderRole(orderType) {
  const roles = { lab: 'LAB', imaging: 'IMAGING', medication: 'NURSE', procedure: 'NURSE', wound: 'NURSE', wound_dressing: 'NURSE' }
  return roles[String(orderType || '').toLowerCase()] || 'NURSE'
}
