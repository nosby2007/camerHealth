import { makeId, withBase } from '~/util/nursing-workflow.cjs'

const scoped = (arr, rootState, rootGetters) => {
  if (!arr) return []
  const facility = rootState.auth?.facilityId
  const institution = rootState.auth?.institution
  return arr.filter(item => {
    if (facility && item.facilityId && item.facilityId !== facility) return false
    if (institution && item.institution && item.institution !== institution) return false
    return true
  })
}

const DEFAULT_EDUCATION_POINTS = {
  general: [
    { label: 'Explain daily care plan and call bell use', topic: 'Care participation', description: 'Patient/family knows who to call, when to ask for help and what care is planned today.' },
    { label: 'Review warning signs to report immediately', topic: 'Safety', description: 'Fever, severe pain, bleeding, breathing difficulty, confusion, fall or worsening symptoms.' }
  ],
  infection: [
    { label: 'Hand hygiene and visitor precautions', topic: 'Infection prevention', description: 'Hand washing, clean environment, mask/isolation instructions when needed.' },
    { label: 'Antibiotic adherence and fever escalation', topic: 'Medication safety', description: 'Complete prescribed medicine and report fever, rash, diarrhea or breathing difficulty.' }
  ],
  safety: [
    { label: 'Fall prevention and safe mobility', topic: 'Fall safety', description: 'Call before standing, use footwear/walker, keep belongings and call light close.' }
  ],
  wound: [
    { label: 'Keep dressing clean and dry', topic: 'Wound care', description: 'Do not remove dressing unless instructed; report odor, drainage, bleeding or spreading redness.' },
    { label: 'Nutrition for wound healing', topic: 'Nutrition', description: 'Encourage protein, fluids and diabetes control when relevant.' }
  ],
  discharge: [
    { label: 'Medication plan and follow-up appointment', topic: 'Discharge', description: 'Confirm dose timing, available supply, return date and transport/caregiver plan.' },
    { label: 'Return precautions after discharge', topic: 'Discharge safety', description: 'Return for fever, bleeding, severe pain, breathing difficulty, confusion or wound deterioration.' }
  ],
  pain: [
    { label: 'Pain scale and relief plan', topic: 'Pain', description: 'Report pain early, use positioning, prescribed analgesics and non-drug comfort measures.' }
  ],
  nutrition: [
    { label: 'Hydration and diet plan', topic: 'Nutrition', description: 'Review oral intake targets, restrictions and family-supported meals where appropriate.' }
  ]
}

export const state = () => ({
  educationTitles: [],
  educationPoints: [],
  learnerDocumentations: [],
  patientMaterials: [],
  materialAssignments: [],
  educationComments: [],
  auditLogs: [],
  selectedTitleId: null,
  selectedPointId: null,
  activeFilter: true,
  hideDescriptions: false
})

export const mutations = {
  ADD_TITLE(state, title) {
    state.educationTitles.push(title)
  },
  UPDATE_TITLE(state, title) {
    const idx = state.educationTitles.findIndex(t => t.id === title.id)
    if (idx >= 0) state.educationTitles.splice(idx, 1, title)
  },
  ADD_POINT(state, point) {
    state.educationPoints.push(point)
  },
  UPDATE_POINT(state, point) {
    const idx = state.educationPoints.findIndex(p => p.id === point.id)
    if (idx >= 0) state.educationPoints.splice(idx, 1, point)
  },
  ADD_DOCUMENTATION(state, doc) {
    state.learnerDocumentations.push(doc)
  },
  UPDATE_DOCUMENTATION(state, doc) {
    const idx = state.learnerDocumentations.findIndex(d => d.id === doc.id)
    if (idx >= 0) state.learnerDocumentations.splice(idx, 1, doc)
  },
  ADD_MATERIAL(state, material) {
    state.patientMaterials.push(material)
  },
  ADD_MATERIAL_ASSIGNMENT(state, assignment) {
    state.materialAssignments.push(assignment)
  },
  UPDATE_MATERIAL_ASSIGNMENT(state, assignment) {
    const idx = state.materialAssignments.findIndex(a => a.id === assignment.id)
    if (idx >= 0) state.materialAssignments.splice(idx, 1, assignment)
  },
  ADD_COMMENT(state, comment) {
    state.educationComments.push(comment)
  },
  ADD_AUDIT(state, log) {
    state.auditLogs.push(log)
  },
  SET_SELECTED_TITLE(state, titleId) {
    state.selectedTitleId = titleId
  },
  SET_SELECTED_POINT(state, pointId) {
    state.selectedPointId = pointId
  },
  SET_ACTIVE_FILTER(state, active) {
    state.activeFilter = active
  },
  SET_HIDE_DESCRIPTIONS(state, hide) {
    state.hideDescriptions = hide
  }
}

export const actions = {
  initializeEducationForPatient({ commit, dispatch, rootState }, { patientId, encounterId, admissionId }) {
    dispatch('syncEducationFromClinicalData', { patientId, encounterId, admissionId })
  },

  syncEducationFromClinicalData({ state, commit, dispatch, rootState }, { patientId, encounterId, admissionId }) {
    const clinical = rootState.clinical || {}
    const patient = clinical.patients?.find(p => p.id === patientId) || {}

    // Create default education titles if none exist
    const existingTitles = state.educationTitles.filter(t => t.patientId === patientId && t.encounterId === encounterId)
    if (existingTitles.length === 0) {
      const defaultTitles = [
        { title: 'General Patient Education', category: 'general' },
        { title: 'Infection', category: 'infection' },
        { title: 'Fall Safety', category: 'safety' },
        { title: 'Knowledge Deficit', category: 'general' },
        { title: 'Skin and Wound', category: 'wound' },
        { title: 'Discharge Planning', category: 'discharge' },
        { title: 'Pain Management', category: 'pain' },
        { title: 'Nutrition', category: 'nutrition' }
      ]

      defaultTitles.forEach((t, idx) => {
        const title = withBase(rootState, {
          patientId,
          encounterId,
          admissionId,
          ...t,
          status: 'active',
          source: 'system',
          sortOrder: idx
        }, 'EDT')
        commit('ADD_TITLE', title)

        ;(DEFAULT_EDUCATION_POINTS[t.category] || []).forEach((point, pointIdx) => {
          commit('ADD_POINT', withBase(rootState, {
            titleId: title.id,
            patientId,
            encounterId,
            admissionId,
            ...point,
            status: 'active',
            requiredLearners: ['Patient', 'Family/Caregiver'],
            sortOrder: pointIdx,
            systemGenerated: true
          }, 'EDP'))
        })
      })
    }
  },

  addEducationTitle({ commit, dispatch, rootState }, { patientId, encounterId, admissionId, title, category }) {
    const record = withBase(rootState, {
      patientId,
      encounterId,
      admissionId,
      title,
      category,
      status: 'active',
      source: 'manual',
      sortOrder: 0
    }, 'EDT')
    commit('ADD_TITLE', record)
    dispatch('audit', { action: 'EDUCATION_TITLE_ADDED', targetId: record.id, patientId })
    return record
  },

  addEducationPoint({ commit, dispatch, rootState }, { titleId, patientId, encounterId, admissionId, label, description, topic, materialIds, linkedProblemIds, linkedOrderIds, linkedMedicationIds }) {
    const record = withBase(rootState, {
      titleId,
      patientId,
      encounterId,
      admissionId,
      label,
      description,
      topic,
      status: 'active',
      requiredLearners: ['Patient'],
      materialIds,
      linkedProblemIds,
      linkedOrderIds,
      linkedMedicationIds,
      sortOrder: 0,
      systemGenerated: false
    }, 'EDP')
    commit('ADD_POINT', record)
    dispatch('audit', { action: 'EDUCATION_POINT_ADDED', targetId: record.id, patientId })
    return record
  },

  documentEducationPoint({ commit, dispatch, rootState }, { pointId, titleId, patientId, encounterId, learners, readiness, methods, responses, comment }) {
    const doc = withBase(rootState, {
      pointId,
      titleId,
      patientId,
      encounterId,
      learners,
      readiness,
      methods,
      responses,
      comment,
      taughtBy: rootState.auth?.fullName || rootState.auth?.staffId,
      taughtByRole: rootState.auth?.role,
      taughtAt: new Date().toISOString(),
      filedAt: null,
      resolvedAt: null,
      status: 'documented'
    }, 'LRN')
    commit('ADD_DOCUMENTATION', doc)

    // Update point status based on response
    const point = rootState.education.educationPoints.find(p => p.id === pointId)
    if (point) {
      let newStatus = 'active'
      if (responses?.includes('Needs Reinforcement')) {
        newStatus = 'needs_reinforcement'
      } else if (responses?.includes('Verbalizes Understanding') || responses?.includes('Demonstrated Understanding')) {
        newStatus = 'completed'
      }
      commit('UPDATE_POINT', { ...point, status: newStatus })
    }

    dispatch('audit', { action: 'EDUCATION_DOCUMENTED', targetId: doc.id, patientId })
    return doc
  },

  fileEducationDocumentation({ state, commit, dispatch, rootState }, { documentationId, pointId, patientId }) {
    const doc = state.learnerDocumentations.find(d => d.id === documentationId)
    if (doc) {
      const filed = { ...doc, filedAt: new Date().toISOString(), status: 'filed' }
      commit('UPDATE_DOCUMENTATION', filed)
      dispatch('audit', { action: 'EDUCATION_FILED', targetId: documentationId, patientId })
    }
  },

  fileAndResolveEducationDocumentation({ state, commit, dispatch, rootState }, { documentationId, pointId, patientId }) {
    const doc = state.learnerDocumentations.find(d => d.id === documentationId)
    if (doc) {
      const resolved = { ...doc, filedAt: new Date().toISOString(), resolvedAt: new Date().toISOString(), status: 'resolved' }
      commit('UPDATE_DOCUMENTATION', resolved)

      const point = state.educationPoints.find(p => p.id === pointId)
      if (point) {
        commit('UPDATE_POINT', { ...point, status: 'completed' })
      }

      dispatch('audit', { action: 'EDUCATION_RESOLVED', targetId: documentationId, patientId })
    }
  },

  resolveEducationPoint({ state, commit, dispatch, rootState }, { pointId, patientId, reason }) {
    const point = state.educationPoints.find(p => p.id === pointId)
    if (point) {
      commit('UPDATE_POINT', { ...point, status: 'resolved' })
      dispatch('audit', { action: 'EDUCATION_POINT_RESOLVED', targetId: pointId, patientId, details: reason })
    }
  },

  markEducationPointNotApplicable({ state, commit, dispatch, rootState }, { pointId, patientId, reason }) {
    const point = state.educationPoints.find(p => p.id === pointId)
    if (point) {
      commit('UPDATE_POINT', { ...point, status: 'not_applicable' })
      dispatch('audit', { action: 'EDUCATION_POINT_NOT_APPLICABLE', targetId: pointId, patientId, details: reason })
    }
  },

  addMaterialToAvs({ commit, dispatch, rootState }, { patientId, encounterId, materialId }) {
    const assignment = withBase(rootState, {
      patientId,
      encounterId,
      materialId,
      addedToAvs: true,
      addedBy: rootState.auth?.fullName || rootState.auth?.staffId,
      addedAt: new Date().toISOString(),
      removedAt: null,
      removedBy: null
    }, 'ASN')
    commit('ADD_MATERIAL_ASSIGNMENT', assignment)
    dispatch('audit', { action: 'MATERIAL_ADDED_TO_AVS', targetId: assignment.id, patientId })
    return assignment
  },

  removeMaterialFromAvs({ state, commit, dispatch, rootState }, { assignmentId, patientId }) {
    const assignment = state.materialAssignments.find(a => a.id === assignmentId)
    if (assignment) {
      const updated = { ...assignment, removedAt: new Date().toISOString(), removedBy: rootState.auth?.fullName || rootState.auth?.staffId }
      commit('UPDATE_MATERIAL_ASSIGNMENT', updated)
      dispatch('audit', { action: 'MATERIAL_REMOVED_FROM_AVS', targetId: assignmentId, patientId })
    }
  },

  addEducationComment({ commit, dispatch, rootState }, { pointId, patientId, encounterId, comment }) {
    const rec = withBase(rootState, {
      pointId,
      patientId,
      encounterId,
      comment,
      commentedBy: rootState.auth?.fullName || rootState.auth?.staffId,
      commentedAt: new Date().toISOString()
    }, 'CMT')
    commit('ADD_COMMENT', rec)
    dispatch('audit', { action: 'EDUCATION_COMMENT_ADDED', targetId: rec.id, patientId })
    return rec
  },

  audit({ commit, rootState }, event) {
    commit('ADD_AUDIT', {
      id: makeId('AUD'),
      facilityId: rootState.auth?.facilityId || '',
      actor: rootState.auth?.fullName || rootState.auth?.staffId || 'Unknown user',
      action: event.action,
      targetTable: 'education',
      targetId: event.targetId,
      patientId: event.patientId,
      timestamp: new Date().toISOString(),
      details: event.details || ''
    })
  }
}

export const getters = {
  educationTree: (state, getters, rootState, rootGetters) => (patientId) => {
    const titles = scoped(state.educationTitles, rootState, rootGetters)
      .filter(t => t.patientId === patientId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

    const points = scoped(state.educationPoints, rootState, rootGetters)
    const docs = scoped(state.learnerDocumentations, rootState, rootGetters)

    return titles.map(title => ({
      ...title,
      points: points
        .filter(p => p.titleId === title.id)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(p => ({
          ...p,
          latestDocumentation: docs
            .filter(d => d.pointId === p.id)
            .sort((a, b) => new Date(b.taughtAt) - new Date(a.taughtAt))[0] || null
        }))
    }))
  },

  activeEducationTree: (state, getters, rootState, rootGetters) => (patientId) => {
    const tree = getters.educationTree(patientId)
    return tree.map(title => ({
      ...title,
      points: title.points.filter(p => p.status === 'active' || p.status === 'needs_reinforcement')
    })).filter(title => title.points.length > 0)
  },

  educationTitlesForPatient: (state, getters, rootState, rootGetters) => (patientId) => {
    return scoped(state.educationTitles, rootState, rootGetters)
      .filter(t => t.patientId === patientId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  },

  educationPointsForTitle: (state, getters, rootState, rootGetters) => (titleId) => {
    return scoped(state.educationPoints, rootState, rootGetters)
      .filter(p => p.titleId === titleId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  },

  latestDocumentationByPoint: (state, getters, rootState, rootGetters) => (pointId) => {
    const docs = scoped(state.learnerDocumentations, rootState, rootGetters)
      .filter(d => d.pointId === pointId)
      .sort((a, b) => new Date(b.taughtAt) - new Date(a.taughtAt))
    return docs[0] || null
  },

  materialsForPoint: (state, getters, rootState, rootGetters) => (pointId) => {
    const point = state.educationPoints.find(p => p.id === pointId)
    if (!point || !point.materialIds) return []
    return scoped(state.patientMaterials, rootState, rootGetters)
      .filter(m => point.materialIds.includes(m.id))
  },

  assignedMaterialsForEncounter: (state, getters, rootState, rootGetters) => (patientId, encounterId) => {
    const assignments = scoped(state.materialAssignments, rootState, rootGetters)
      .filter(a => a.patientId === patientId && a.encounterId === encounterId && a.removedAt === null)

    return assignments.map(a => {
      const material = state.patientMaterials.find(m => m.id === a.materialId)
      return { ...a, material }
    })
  },

  educationCompletionSummary: (state, getters, rootState, rootGetters) => (patientId) => {
    const titles = getters.educationTitlesForPatient(patientId)
    const docs = scoped(state.learnerDocumentations, rootState, rootGetters).filter(d => d.patientId === patientId && d.filedAt)

    return titles.map(title => {
      const points = scoped(state.educationPoints, rootState, rootGetters).filter(p => p.titleId === title.id)
      const completedPoints = points.filter(p => {
        const latestDoc = getters.latestDocumentationByPoint(p.id)
        return latestDoc && (latestDoc.status === 'resolved' || p.status === 'completed')
      })

      return {
        titleId: title.id,
        title: title.title,
        totalPoints: points.length,
        completedCount: completedPoints.length
      }
    })
  },

  educationEventsForChartReview: (state, getters, rootState, rootGetters) => (patientId) => {
    const docs = scoped(state.learnerDocumentations, rootState, rootGetters)
      .filter(d => d.patientId === patientId && d.filedAt)
      .sort((a, b) => new Date(b.taughtAt) - new Date(a.taughtAt))

    return docs.map(doc => ({
      type: 'education_documented',
      label: `Patient education documented`,
      timestamp: doc.filedAt,
      details: `Learners: ${doc.learners?.join(', ')}`,
      source: 'education'
    }))
  }
}
