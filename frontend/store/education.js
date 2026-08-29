import { makeId, withBase } from '~/util/nursing-workflow.cjs'
import { educationApi } from '~/services/api'

const scoped = (arr, rootState, rootGetters) => {
  if (!arr) return []
  const facility = rootState.auth?.facilityId
  if (!facility) return []
  return arr.filter(item => item && item.facilityId === facility)
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
  SET_PATIENT_DATA(state, { patientId, titles, points, documentations, materials, assignments, comments }) {
    const keep = (arr, list) => arr.filter(item => item.patientId !== patientId).concat(list)
    state.educationTitles = keep(state.educationTitles, titles)
    state.educationPoints = keep(state.educationPoints, points)
    state.learnerDocumentations = keep(state.learnerDocumentations, documentations)
    state.patientMaterials = keep(state.patientMaterials, materials)
    state.materialAssignments = keep(state.materialAssignments, assignments)
    state.educationComments = keep(state.educationComments, comments)
  },
  ADD_AUDIT(state, log) {
    state.auditLogs.push(log)
  },
  SET_ERROR(state, error) { state.error = error },
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
  async fetchEducationOverview({ commit }, patientId) {
    try {
      const { data } = await educationApi.overview(patientId)
      commit('SET_PATIENT_DATA', {
        patientId,
        titles: data.titles || [],
        points: data.points || [],
        documentations: data.documentations || [],
        materials: data.materials || [],
        assignments: data.assignments || [],
        comments: data.comments || []
      })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },

  async initializeEducationForPatient({ dispatch }, { patientId, encounterId, admissionId }) {
    await dispatch('fetchEducationOverview', patientId)
    await dispatch('syncEducationFromClinicalData', { patientId, encounterId, admissionId })
  },

  async syncEducationFromClinicalData({ state, dispatch }, { patientId, encounterId, admissionId }) {
    // Create default education titles if none exist for this patient yet
    // (checked against what fetchEducationOverview just loaded from the
    // server, so a returning session doesn't reseed duplicates).
    const existingTitles = state.educationTitles.filter(t => t.patientId === patientId)
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

      for (const t of defaultTitles) {
        const title = await dispatch('addEducationTitle', { patientId, encounterId, admissionId, ...t, source: 'system' })
        for (const point of (DEFAULT_EDUCATION_POINTS[t.category] || [])) {
          await dispatch('addEducationPoint', {
            titleId: title.id,
            patientId,
            encounterId,
            admissionId,
            ...point,
            requiredLearners: ['Patient', 'Family/Caregiver'],
            systemGenerated: true
          })
        }
      }
    }
  },

  async addEducationTitle({ commit, dispatch, rootState }, { patientId, encounterId, admissionId, title, category, source }) {
    const local = withBase(rootState, {
      patientId, encounterId, admissionId, title, category,
      status: 'active', source: source || 'manual', sortOrder: 0
    }, 'EDT')
    try {
      const { data } = await educationApi.addTitle({ patientId, encounterId, admissionId, title, category, source: source || 'manual' })
      Object.assign(local, data.title)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_TITLE', local)
    dispatch('audit', { action: 'EDUCATION_TITLE_ADDED', targetId: local.id, patientId })
    return local
  },

  async addEducationPoint({ commit, dispatch, rootState }, { titleId, patientId, encounterId, admissionId, label, description, topic, materialIds, linkedProblemIds, linkedOrderIds, linkedMedicationIds, requiredLearners, systemGenerated }) {
    const local = withBase(rootState, {
      titleId, patientId, encounterId, admissionId, label, description, topic,
      status: 'active', requiredLearners: requiredLearners || ['Patient'],
      materialIds, linkedProblemIds, linkedOrderIds, linkedMedicationIds,
      sortOrder: 0, systemGenerated: systemGenerated || false
    }, 'EDP')
    try {
      const { data } = await educationApi.addPoint({ titleId, patientId, encounterId, admissionId, label, description, topic, materialIds, linkedProblemIds, linkedOrderIds, linkedMedicationIds, requiredLearners: requiredLearners || ['Patient'], systemGenerated: systemGenerated || false })
      Object.assign(local, data.point)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_POINT', local)
    dispatch('audit', { action: 'EDUCATION_POINT_ADDED', targetId: local.id, patientId })
    return local
  },

  async documentEducationPoint({ commit, dispatch, rootState }, { pointId, titleId, patientId, encounterId, learners, readiness, methods, responses, comment }) {
    const familyEducation = learners?.includes('Family') || learners?.includes('Family/Caregiver') || learners?.includes('Caregiver') || false
    const local = withBase(rootState, {
      pointId, titleId, patientId, encounterId, learners, readiness, methods, responses, comment,
      teachingCompleted: true, familyEducation, nextReviewAt: null,
      taughtBy: rootState.auth?.fullName || rootState.auth?.staffId,
      taughtByRole: rootState.auth?.role,
      taughtAt: new Date().toISOString(), filedAt: null, resolvedAt: null, status: 'documented'
    }, 'LRN')
    try {
      const { data } = await educationApi.addDocumentation({ pointId, titleId, patientId, learners, readiness, methods, responses, comment, familyEducation })
      Object.assign(local, data.documentation)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_DOCUMENTATION', local)

    const point = rootState.education.educationPoints.find(p => p.id === pointId)
    if (point) {
      let newStatus = 'active'
      if (responses?.includes('Needs Reinforcement')) newStatus = 'needs_reinforcement'
      else if (responses?.includes('Verbalizes Understanding') || responses?.includes('Demonstrated Understanding')) newStatus = 'completed'
      commit('UPDATE_POINT', { ...point, status: newStatus })
    }

    dispatch('audit', { action: 'EDUCATION_DOCUMENTED', targetId: local.id, patientId })
    return local
  },

  async fileEducationDocumentation({ state, commit, dispatch }, { documentationId, pointId, patientId }) {
    const doc = state.learnerDocumentations.find(d => d.id === documentationId)
    if (!doc) return
    const filed = { ...doc, filedAt: new Date().toISOString(), status: 'filed' }
    try {
      await educationApi.updateDocumentation(documentationId, { filed: true })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_DOCUMENTATION', filed)
    dispatch('audit', { action: 'EDUCATION_FILED', targetId: documentationId, patientId })
  },

  async fileAndResolveEducationDocumentation({ state, commit, dispatch }, { documentationId, pointId, patientId }) {
    const doc = state.learnerDocumentations.find(d => d.id === documentationId)
    if (!doc) return
    const resolved = { ...doc, filedAt: new Date().toISOString(), resolvedAt: new Date().toISOString(), status: 'resolved' }
    try {
      await educationApi.updateDocumentation(documentationId, { resolved: true })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_DOCUMENTATION', resolved)
    const point = state.educationPoints.find(p => p.id === pointId)
    if (point) commit('UPDATE_POINT', { ...point, status: 'completed' })
    dispatch('audit', { action: 'EDUCATION_RESOLVED', targetId: documentationId, patientId })
  },

  async resolveEducationPoint({ state, commit, dispatch }, { pointId, patientId, reason }) {
    const point = state.educationPoints.find(p => p.id === pointId)
    if (!point) return
    try {
      await educationApi.updatePoint(pointId, { status: 'resolved' })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_POINT', { ...point, status: 'resolved' })
    dispatch('audit', { action: 'EDUCATION_POINT_RESOLVED', targetId: pointId, patientId, details: reason })
  },

  async markEducationPointNotApplicable({ state, commit, dispatch }, { pointId, patientId, reason }) {
    const point = state.educationPoints.find(p => p.id === pointId)
    if (!point) return
    try {
      await educationApi.updatePoint(pointId, { status: 'not_applicable' })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_POINT', { ...point, status: 'not_applicable' })
    dispatch('audit', { action: 'EDUCATION_POINT_NOT_APPLICABLE', targetId: pointId, patientId, details: reason })
  },

  async addMaterialToAvs({ commit, dispatch, rootState }, { patientId, encounterId, materialId }) {
    const local = withBase(rootState, {
      patientId, encounterId, materialId, addedToAvs: true,
      addedBy: rootState.auth?.fullName || rootState.auth?.staffId,
      addedAt: new Date().toISOString(), removedAt: null, removedBy: null
    }, 'ASN')
    try {
      const { data } = await educationApi.addAssignment({ patientId, materialId, addedToAvs: true })
      Object.assign(local, data.assignment)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_MATERIAL_ASSIGNMENT', local)
    dispatch('audit', { action: 'MATERIAL_ADDED_TO_AVS', targetId: local.id, patientId })
    return local
  },

  async createPatientMaterial({ commit, dispatch, rootState }, { patientId, title, language, format, instructions }) {
    const local = withBase(rootState, {
      patientId, title, language: language || 'French', format: format || 'Verbal + printed',
      instructions: instructions || '', status: 'active',
      createdBy: rootState.auth?.fullName || rootState.auth?.staffId
    }, 'MAT')
    try {
      const { data } = await educationApi.addMaterial({ patientId, title, language, format, instructions })
      Object.assign(local, data.material)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_MATERIAL', local)
    dispatch('audit', { action: 'EDUCATION_MATERIAL_CREATED', targetId: local.id, patientId })
    return local
  },

  async removeMaterialFromAvs({ state, commit, dispatch, rootState }, { assignmentId, patientId }) {
    const assignment = state.materialAssignments.find(a => a.id === assignmentId)
    if (!assignment) return
    const updated = { ...assignment, removedAt: new Date().toISOString(), removedBy: rootState.auth?.fullName || rootState.auth?.staffId }
    try {
      await educationApi.removeAssignment(assignmentId)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_MATERIAL_ASSIGNMENT', updated)
    dispatch('audit', { action: 'MATERIAL_REMOVED_FROM_AVS', targetId: assignmentId, patientId })
  },

  async addEducationComment({ commit, dispatch, rootState }, { pointId, patientId, encounterId, comment }) {
    const local = withBase(rootState, {
      pointId, patientId, encounterId, comment,
      commentedBy: rootState.auth?.fullName || rootState.auth?.staffId,
      commentedAt: new Date().toISOString()
    }, 'CMT')
    try {
      const { data } = await educationApi.addComment({ pointId, patientId, comment })
      Object.assign(local, data.comment)
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_COMMENT', local)
    dispatch('audit', { action: 'EDUCATION_COMMENT_ADDED', targetId: local.id, patientId })
    return local
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

  materialsForPatient: (state, getters, rootState, rootGetters) => (patientId) => {
    return scoped(state.patientMaterials, rootState, rootGetters)
      .filter(material => !material.patientId || material.patientId === patientId)
      .filter(material => material.status !== 'inactive')
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
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
        completedCount: completedPoints.length,
        completionRate: points.length ? Math.round((completedPoints.length / points.length) * 100) : 0
      }
    })
  },

  educationSummaryProjection: (state, getters, rootState, rootGetters) => (patientId) => {
    const titles = getters.educationTitlesForPatient(patientId)
    const points = scoped(state.educationPoints, rootState, rootGetters).filter(p => p.patientId === patientId)
    const docs = scoped(state.learnerDocumentations, rootState, rootGetters).filter(d => d.patientId === patientId)
    const latest = docs.sort((a, b) => new Date(b.taughtAt) - new Date(a.taughtAt))[0] || null
    const familyDocs = docs.filter(d => d.familyEducation)
    return {
      titleCount: titles.length,
      pointCount: points.length,
      documentedCount: docs.length,
      familyEducationCount: familyDocs.length,
      completedCount: points.filter(point => {
        const latestDoc = getters.latestDocumentationByPoint(point.id)
        return latestDoc && (latestDoc.status === 'resolved' || point.status === 'completed')
      }).length,
      latestEducation: latest ? {
        id: latest.id,
        learners: latest.learners || [],
        taughtAt: latest.taughtAt,
        comment: latest.comment || ''
      } : null
    }
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
