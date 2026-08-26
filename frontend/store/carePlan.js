import { makeId, withBase } from '~/util/nursing-workflow.cjs'
const { assertPatientWritable } = require('~/util/patient-360-policy.cjs')

function assertCarePlanWritable(rootState, patientId) {
  const patients = (rootState.clinical && rootState.clinical.patients) || []
  assertPatientWritable(patients.find(patient => patient.id === patientId))
}

const scoped = (arr, rootState, rootGetters) => {
  if (!arr) return []
  const facility = rootState.auth?.facilityId
  if (!facility) return []
  return arr.filter(item => item && item.facilityId === facility)
}

const DEFAULT_CARE_PLAN_TEMPLATES = [
  {
    name: 'General Hospital Daily Care',
    type: 'general',
    problems: [
      {
        label: 'Daily nursing needs',
        goals: [
          'Vitals, pain, intake/output and safety checks documented per schedule',
          'Patient/family understands the care plan for the current shift'
        ]
      }
    ]
  },
  {
    name: 'Infection Prevention',
    type: 'infection',
    problems: [
      {
        label: 'Risk for infection or active infection',
        goals: [
          'Temperature, wound/line signs and antibiotics monitored',
          'Hand hygiene and isolation instructions reinforced with patient/family'
        ]
      }
    ]
  },
  {
    name: 'Skin / Wound Integrity',
    type: 'skin_integrity',
    problems: [
      {
        label: 'Risk for pressure injury or wound deterioration',
        goals: [
          'Skin/wound assessed and dressing plan followed',
          'Turning, hygiene and nutrition support completed as scheduled'
        ]
      }
    ]
  },
  {
    name: 'Mobility and Fall Prevention',
    type: 'fall_risk',
    problems: [
      {
        label: 'Fall risk or impaired mobility',
        goals: [
          'Patient mobilizes safely with assistance as ordered',
          'Family/patient calls staff before standing or transfer'
        ]
      }
    ]
  },
  {
    name: 'Discharge Readiness',
    type: 'discharge',
    problems: [
      {
        label: 'Needs coordinated discharge plan',
        goals: [
          'Medication, education, follow-up, transport and caregiver plan confirmed',
          'Financial/social barriers escalated before discharge'
        ]
      }
    ]
  }
]

export const state = () => ({
  carePlans: [],
  carePlanProblems: [],
  carePlanGoals: [],
  carePlanOutcomes: [],
  progressEntries: [],
  carePlanReviews: [],
  carePlanNoteDrafts: [],
  auditLogs: [],
  selectedSubview: 'overview',
  selectedProblemId: null,
  selectedGoalId: null,
  activeFilter: true,
  filterWarnings: []
})

export const mutations = {
  ADD_CARE_PLAN(state, plan) {
    state.carePlans.push(plan)
  },
  UPDATE_CARE_PLAN(state, plan) {
    const idx = state.carePlans.findIndex(p => p.id === plan.id)
    if (idx >= 0) state.carePlans.splice(idx, 1, plan)
  },
  ADD_PROBLEM(state, problem) {
    state.carePlanProblems.push(problem)
  },
  UPDATE_PROBLEM(state, problem) {
    const idx = state.carePlanProblems.findIndex(p => p.id === problem.id)
    if (idx >= 0) state.carePlanProblems.splice(idx, 1, problem)
  },
  ADD_GOAL(state, goal) {
    state.carePlanGoals.push(goal)
  },
  UPDATE_GOAL(state, goal) {
    const idx = state.carePlanGoals.findIndex(g => g.id === goal.id)
    if (idx >= 0) state.carePlanGoals.splice(idx, 1, goal)
  },
  ADD_OUTCOME(state, outcome) {
    state.carePlanOutcomes.push(outcome)
  },
  UPDATE_OUTCOME(state, outcome) {
    const idx = state.carePlanOutcomes.findIndex(o => o.id === outcome.id)
    if (idx >= 0) state.carePlanOutcomes.splice(idx, 1, outcome)
  },
  ADD_PROGRESS_ENTRY(state, entry) {
    state.progressEntries.push(entry)
  },
  ADD_REVIEW(state, review) {
    state.carePlanReviews.push(review)
  },
  ADD_NOTE_DRAFT(state, draft) {
    state.carePlanNoteDrafts.push(draft)
  },
  UPDATE_NOTE_DRAFT(state, draft) {
    const idx = state.carePlanNoteDrafts.findIndex(d => d.id === draft.id)
    if (idx >= 0) state.carePlanNoteDrafts.splice(idx, 1, draft)
  },
  ADD_AUDIT(state, log) {
    state.auditLogs.push(log)
  },
  SET_SELECTED_SUBVIEW(state, subview) {
    state.selectedSubview = subview
  },
  SET_SELECTED_PROBLEM(state, problemId) {
    state.selectedProblemId = problemId
  },
  SET_SELECTED_GOAL(state, goalId) {
    state.selectedGoalId = goalId
  },
  SET_ACTIVE_FILTER(state, active) {
    state.activeFilter = active
  },
  SET_FILTER_WARNINGS(state, warnings) {
    state.filterWarnings = warnings
  }
}

export const actions = {
  initializeCarePlanForPatient({ commit, dispatch, rootState }, { patientId, encounterId, admissionId }) {
    dispatch('syncCarePlanFromClinicalData', { patientId, encounterId, admissionId })
  },

  syncCarePlanFromClinicalData({ state, commit, dispatch, rootState }, { patientId, encounterId, admissionId }) {
    // Create default care plans if none exist
    const existingPlans = state.carePlans.filter(p => p.patientId === patientId && p.encounterId === encounterId)
    if (existingPlans.length === 0) {
      DEFAULT_CARE_PLAN_TEMPLATES.forEach((template, planIdx) => {
        const plan = withBase(rootState, {
          patientId,
          encounterId,
          admissionId,
          name: template.name,
          type: template.type,
          status: 'active',
          source: 'system',
          sortOrder: planIdx
        }, 'CPL')
        commit('ADD_CARE_PLAN', plan)

        template.problems.forEach((problemTemplate, problemIdx) => {
          const problem = withBase(rootState, {
            carePlanId: plan.id,
            patientId,
            encounterId,
            admissionId,
            label: problemTemplate.label,
            status: 'active',
            source: 'system',
            sortOrder: problemIdx
          }, 'PBL')
          commit('ADD_PROBLEM', problem)

          problemTemplate.goals.forEach((goalLabel, goalIdx) => {
            commit('ADD_GOAL', withBase(rootState, {
              carePlanId: plan.id,
              problemId: problem.id,
              patientId,
              encounterId,
              admissionId,
              label: goalLabel,
              description: 'Prefilled goal for Cameroon general hospital workflow.',
              status: 'active',
              source: 'system',
              sortOrder: goalIdx
            }, 'GOL'))
          })
        })
      })
    }
  },

  addCarePlan({ commit, dispatch, rootState }, carePlan) {
    assertCarePlanWritable(rootState, carePlan.patientId)
    const record = withBase(rootState, { status: 'active', ...carePlan }, 'CPL')
    commit('ADD_CARE_PLAN', record)
    dispatch('audit', { action: 'CARE_PLAN_ADDED', targetId: record.id, patientId: record.patientId })
    return record
  },

  async createCarePlan({ dispatch, rootState }, carePlan) {
    assertCarePlanWritable(rootState, carePlan.patientId)
    const problems = (carePlan.problems || []).map(item => String(item || '').trim()).filter(Boolean)
    const goals = (carePlan.goals || []).filter(item => item && String(item.description || '').trim())
    const interventions = (carePlan.interventions || []).filter(item => item && String(item.action || '').trim())
    const plan = await dispatch('addCarePlan', {
      ...carePlan,
      name: carePlan.title || carePlan.name || carePlan.diagnosis || 'Patient care plan',
      title: carePlan.title || carePlan.name || '',
      status: String(carePlan.status || 'active').toLowerCase(),
      problems: undefined,
      goals: undefined,
      interventions,
      education: {
        topics: carePlan.educationTopics || [],
        completed: !!carePlan.educationCompleted,
        understanding: carePlan.patientUnderstanding || '',
        notes: carePlan.educationNotes || '',
        familyInvolved: !!carePlan.familyInvolved
      }
    })

    const problemRecords = []
    for (let index = 0; index < problems.length; index += 1) {
      problemRecords.push(await dispatch('addProblem', {
        patientId: carePlan.patientId,
        encounterId: carePlan.encounterId,
        admissionId: carePlan.admissionId,
        carePlanId: plan.id,
        label: problems[index],
        diagnosis: carePlan.diagnosis || '',
        sortOrder: index
      }))
    }

    for (let index = 0; index < goals.length; index += 1) {
      const goal = goals[index]
      await dispatch('addGoal', {
        patientId: carePlan.patientId,
        encounterId: carePlan.encounterId,
        admissionId: carePlan.admissionId,
        carePlanId: plan.id,
        problemId: problemRecords[0] ? problemRecords[0].id : null,
        label: String(goal.description).trim(),
        description: interventions.map(item => `${item.action}${item.frequency ? ` (${item.frequency})` : ''}`).join('; '),
        expectedEndDate: carePlan.targetDate || null,
        achieved: !!goal.achieved,
        timeline: goal.timeline || '',
        sortOrder: index
      })
    }

    return plan
  },

  updateCarePlan({ state, commit, dispatch, rootState }, carePlan) {
    const existing = state.carePlans.find(item => item.id === carePlan.id)
    if (!existing) return null
    assertCarePlanWritable(rootState, carePlan.patientId || existing.patientId)
    const record = { ...existing, ...carePlan }
    commit('UPDATE_CARE_PLAN', record)
    dispatch('audit', { action: 'CARE_PLAN_UPDATED', targetId: record.id, patientId: record.patientId })
    return record
  },

  addProblem({ commit, dispatch, rootState }, problem) {
    assertCarePlanWritable(rootState, problem.patientId)
    const record = withBase(rootState, { status: 'active', ...problem }, 'PBL')
    commit('ADD_PROBLEM', record)
    dispatch('audit', { action: 'PROBLEM_ADDED', targetId: record.id, patientId: record.patientId })
    return record
  },

  updateProblem({ state, commit, dispatch, rootState }, problem) {
    const existing = state.carePlanProblems.find(item => item.id === problem.id)
    if (!existing) return null
    assertCarePlanWritable(rootState, problem.patientId || existing.patientId)
    const record = { ...existing, ...problem }
    commit('UPDATE_PROBLEM', record)
    dispatch('audit', { action: 'PROBLEM_UPDATED', targetId: record.id, patientId: record.patientId })
    return record
  },

  addGoal({ commit, dispatch, rootState }, goal) {
    assertCarePlanWritable(rootState, goal.patientId)
    const record = withBase(rootState, { status: 'active', ...goal }, 'GOL')
    commit('ADD_GOAL', record)
    dispatch('audit', { action: 'GOAL_ADDED', targetId: record.id, patientId: record.patientId })
    return record
  },

  updateGoal({ state, commit, dispatch, rootState }, goal) {
    const existing = state.carePlanGoals.find(item => item.id === goal.id)
    if (!existing) return null
    assertCarePlanWritable(rootState, goal.patientId || existing.patientId)
    const record = { ...existing, ...goal }
    commit('UPDATE_GOAL', record)
    dispatch('audit', { action: 'GOAL_UPDATED', targetId: record.id, patientId: record.patientId })
    return record
  },

  addOutcome({ commit, dispatch, rootState }, outcome) {
    assertCarePlanWritable(rootState, outcome.patientId)
    const record = withBase(rootState, { status: 'active', ...outcome }, 'OTC')
    commit('ADD_OUTCOME', record)
    dispatch('audit', { action: 'OUTCOME_ADDED', targetId: record.id, patientId: record.patientId })
    return record
  },

  updateOutcome({ state, commit, dispatch, rootState }, outcome) {
    const existing = state.carePlanOutcomes.find(item => item.id === outcome.id)
    if (!existing) return null
    assertCarePlanWritable(rootState, outcome.patientId || existing.patientId)
    const record = { ...existing, ...outcome }
    commit('UPDATE_OUTCOME', record)
    dispatch('audit', { action: 'OUTCOME_UPDATED', targetId: record.id, patientId: record.patientId })
    return record
  },

  documentProgress({ commit, dispatch, rootState }, { carePlanId, problemId, goalId, outcomeId, patientId, encounterId, progressStatus, comment }) {
    assertCarePlanWritable(rootState, patientId)
    const entry = withBase(rootState, {
      carePlanId,
      problemId,
      goalId,
      outcomeId,
      patientId,
      encounterId,
      progressStatus,
      comment,
      documentedBy: rootState.auth?.fullName || rootState.auth?.staffId,
      documentedByRole: rootState.auth?.role,
      documentedAt: new Date().toISOString(),
      source: 'manual'
    }, 'PRG')
    commit('ADD_PROGRESS_ENTRY', entry)

    // Update goal/outcome last progress status
    if (goalId) {
      const goal = rootState.carePlan.carePlanGoals.find(g => g.id === goalId)
      if (goal) {
        commit('UPDATE_GOAL', { ...goal, lastProgressStatus: progressStatus, lastDocumentedAt: entry.documentedAt, lastDocumentedBy: entry.documentedBy })
      }
    }
    if (outcomeId) {
      const outcome = rootState.carePlan.carePlanOutcomes.find(o => o.id === outcomeId)
      if (outcome) {
        commit('UPDATE_OUTCOME', { ...outcome, lastProgressStatus: progressStatus, lastDocumentedAt: entry.documentedAt, lastDocumentedBy: entry.documentedBy })
      }
    }

    dispatch('audit', { action: 'PROGRESS_DOCUMENTED', targetId: entry.id, patientId })
    return entry
  },

  applyProgressToAllUndocumented({ state, commit, dispatch, rootState }, { carePlanId, progressStatus, patientId, encounterId }) {
    assertCarePlanWritable(rootState, patientId)
    const undocumented = state.carePlanGoals.filter(g =>
      g.carePlanId === carePlanId &&
      g.patientId === patientId &&
      !g.lastProgressStatus
    )
    undocumented.forEach(goal => {
      dispatch('documentProgress', {
        carePlanId,
        problemId: goal.problemId,
        goalId: goal.id,
        outcomeId: null,
        patientId,
        encounterId,
        progressStatus,
        comment: 'Applied to all undocumented'
      })
    })
    dispatch('audit', { action: 'APPLY_PROGRESS_ALL', targetId: carePlanId, patientId })
  },

  resolveGoal({ state, commit, dispatch, rootState }, { goalId, patientId, status }) {
    assertCarePlanWritable(rootState, patientId)
    const goal = state.carePlanGoals.find(g => g.id === goalId)
    if (goal) {
      commit('UPDATE_GOAL', { ...goal, status, statusReason: 'resolved' })
      dispatch('audit', { action: 'GOAL_RESOLVED', targetId: goalId, patientId })
    }
  },

  resolveOutcome({ state, commit, dispatch, rootState }, { outcomeId, patientId, status }) {
    assertCarePlanWritable(rootState, patientId)
    const outcome = state.carePlanOutcomes.find(o => o.id === outcomeId)
    if (outcome) {
      commit('UPDATE_OUTCOME', { ...outcome, status, statusReason: 'resolved' })
      dispatch('audit', { action: 'OUTCOME_RESOLVED', targetId: outcomeId, patientId })
    }
  },

  resolveAllActive({ state, commit, dispatch, rootState }, { carePlanId, patientId, status }) {
    assertCarePlanWritable(rootState, patientId)
    state.carePlanGoals
      .filter(g => g.carePlanId === carePlanId && g.patientId === patientId && g.status === 'active')
      .forEach(goal => {
        dispatch('resolveGoal', { goalId: goal.id, patientId, status })
      })
    dispatch('audit', { action: 'RESOLVE_ALL_ACTIVE', targetId: carePlanId, patientId })
  },

  markCarePlanReviewed({ commit, dispatch, rootState }, { carePlanId, patientId, encounterId, comment }) {
    assertCarePlanWritable(rootState, patientId)
    const review = withBase(rootState, {
      carePlanId,
      patientId,
      encounterId,
      reviewedBy: rootState.auth?.fullName || rootState.auth?.staffId,
      reviewedAt: new Date().toISOString(),
      comment
    }, 'REV')
    commit('ADD_REVIEW', review)

    const plan = rootState.carePlan.carePlans.find(p => p.id === carePlanId)
    if (plan) {
      commit('UPDATE_CARE_PLAN', { ...plan, reviewedAt: review.reviewedAt, reviewedBy: review.reviewedBy })
    }

    dispatch('audit', { action: 'CARE_PLAN_REVIEWED', targetId: carePlanId, patientId })
    return review
  },

  buildCarePlanNoteBody({ state }, { selectedGoalIds, selectedOutcomeIds }) {
    const lines = ['PLAN OF CARE', '']

    selectedGoalIds?.forEach(goalId => {
      const goal = state.carePlanGoals.find(g => g.id === goalId)
      if (goal) {
        lines.push(`Goal: ${goal.label}`)
        lines.push(`Description: ${goal.description || ''}`)
        lines.push(`Status: ${goal.lastProgressStatus || 'Not documented'}`)
        lines.push('')
      }
    })

    selectedOutcomeIds?.forEach(outcomeId => {
      const outcome = state.carePlanOutcomes.find(o => o.id === outcomeId)
      if (outcome) {
        lines.push(`Outcome: ${outcome.label}`)
        lines.push(`Status: ${outcome.lastProgressStatus || 'Not documented'}`)
        lines.push('')
      }
    })

    return lines.join('\n')
  },

  createOrUpdateCarePlanNoteDraft({ state, commit, dispatch, rootState }, { patientId, encounterId, admissionId, includedProgressEntryIds, includedGoalIds, includedOutcomeIds, body }) {
    assertCarePlanWritable(rootState, patientId)
    let draft = state.carePlanNoteDrafts.find(d => d.patientId === patientId && d.encounterId === encounterId && d.status === 'draft')

    if (draft) {
      const updated = { ...draft, includedProgressEntryIds, includedGoalIds, includedOutcomeIds, body, updatedAt: new Date().toISOString() }
      commit('UPDATE_NOTE_DRAFT', updated)
      draft = updated
    } else {
      draft = withBase(rootState, {
        patientId,
        encounterId,
        admissionId,
        includedProgressEntryIds,
        includedGoalIds,
        includedOutcomeIds,
        body,
        status: 'draft',
        createdBy: rootState.auth?.fullName || rootState.auth?.staffId
      }, 'PCD')
      commit('ADD_NOTE_DRAFT', draft)
    }

    dispatch('audit', { action: 'CARE_PLAN_NOTE_DRAFT', targetId: draft.id, patientId })
    return draft
  },

  signCarePlanNote({ rootState, dispatch }, { patientId, encounterId, admissionId, body, linkedCarePlanProgressEntryIds }) {
    assertCarePlanWritable(rootState, patientId)
    return dispatch('nursing/createClinicalNote', {
      patientId,
      encounterId,
      admissionId,
      noteType: 'plan_of_care',
      title: 'Plan of Care',
      body,
      source: 'care_plan',
      linkedCarePlanProgressEntryIds,
      authorRole: rootState.auth?.role
    }, { root: true })
  },

  audit({ commit, rootState }, event) {
    commit('ADD_AUDIT', {
      id: makeId('AUD'),
      facilityId: rootState.auth?.facilityId || '',
      actor: rootState.auth?.fullName || rootState.auth?.staffId || 'Unknown user',
      action: event.action,
      targetTable: 'care_plans',
      targetId: event.targetId,
      patientId: event.patientId,
      timestamp: new Date().toISOString(),
      details: event.details || ''
    })
  }
}

export const getters = {
  carePlansForPatient: (state, getters, rootState, rootGetters) => (patientId) => {
    return scoped(state.carePlans, rootState, rootGetters).filter(p => p.patientId === patientId)
  },

  carePlanTree: (state, getters, rootState, rootGetters) => (carePlanId) => {
    const plans = scoped(state.carePlans, rootState, rootGetters)
    const plan = plans.find(p => p.id === carePlanId)
    if (!plan) return null

    const problems = scoped(state.carePlanProblems, rootState, rootGetters)
      .filter(p => p.carePlanId === carePlanId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

    const goals = scoped(state.carePlanGoals, rootState, rootGetters)
    const outcomes = scoped(state.carePlanOutcomes, rootState, rootGetters)

    return {
      ...plan,
      problems: problems.map(p => ({
        ...p,
        goals: goals
          .filter(g => g.problemId === p.id)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .map(g => ({
            ...g,
            outcomes: outcomes
              .filter(o => o.goalId === g.id)
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          }))
      }))
    }
  },

  activeCarePlanTree: (state, getters) => (carePlanId) => {
    const tree = getters.carePlanTree(carePlanId)
    if (!tree) return null
    return {
      ...tree,
      problems: tree.problems
        .filter(p => p.status === 'active')
        .map(p => ({
          ...p,
          goals: p.goals
            .filter(g => g.status === 'active')
            .map(g => ({
              ...g,
              outcomes: g.outcomes.filter(o => o.status === 'active')
            }))
        }))
    }
  },

  carePlanProblemsGoalsSummary: (state, getters, rootState, rootGetters) => (patientId) => {
    const plans = scoped(state.carePlans, rootState, rootGetters).filter(p => p.patientId === patientId)
    const problems = scoped(state.carePlanProblems, rootState, rootGetters).filter(p => p.patientId === patientId)
    const goals = scoped(state.carePlanGoals, rootState, rootGetters).filter(g => g.patientId === patientId)

    return {
      carePlanCount: plans.length,
      problemCount: problems.length,
      goalCount: goals.length,
      progressingCount: goals.filter(g => g.lastProgressStatus === 'progressing').length,
      adequateForDischargeCount: goals.filter(g => g.lastProgressStatus === 'adequate_for_discharge').length,
      undocumentedCount: goals.filter(g => !g.lastProgressStatus).length
    }
  },

  progressEntriesForPatient: (state, getters, rootState, rootGetters) => (patientId) => {
    return scoped(state.progressEntries, rootState, rootGetters).filter(e => e.patientId === patientId)
  },

  latestProgressByGoal: (state, getters, rootState, rootGetters) => (goalId) => {
    const entries = scoped(state.progressEntries, rootState, rootGetters)
      .filter(e => e.goalId === goalId)
      .sort((a, b) => new Date(b.documentedAt) - new Date(a.documentedAt))
    return entries[0] || null
  },

  undocumentedGoals: (state, getters, rootState, rootGetters) => (patientId) => {
    return scoped(state.carePlanGoals, rootState, rootGetters)
      .filter(g => g.patientId === patientId && g.status === 'active' && !g.lastProgressStatus)
  },

  overdueGoals: (state, getters, rootState, rootGetters) => (patientId) => {
    const now = new Date()
    return scoped(state.carePlanGoals, rootState, rootGetters)
      .filter(g => g.patientId === patientId && g.expectedEndDate && new Date(g.expectedEndDate) < now && g.status === 'active')
  },

  carePlanOverview: (state, getters, rootState, rootGetters) => (patientId) => {
    const summary = getters.carePlanProblemsGoalsSummary(patientId)
    const overdueCount = getters.overdueGoals(patientId).length
    const recentReview = scoped(state.carePlanReviews, rootState, rootGetters)
      .filter(r => r.patientId === patientId)
      .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))[0]

    return { ...summary, overdueCount, recentReview }
  },

  carePlanSummaryProjection: (state, getters, rootState, rootGetters) => (patientId) => {
    const plans = getters.carePlansForPatient(patientId)
    const problems = scoped(state.carePlanProblems, rootState, rootGetters).filter(item => item.patientId === patientId)
    const goals = scoped(state.carePlanGoals, rootState, rootGetters).filter(item => item.patientId === patientId)
    const outcomes = scoped(state.carePlanOutcomes, rootState, rootGetters).filter(item => item.patientId === patientId)
    const progress = scoped(state.progressEntries, rootState, rootGetters).filter(item => item.patientId === patientId)
    const recent = progress.sort((a, b) => new Date(b.documentedAt) - new Date(a.documentedAt))[0] || null
    return {
      patientId,
      planCount: plans.length,
      problemCount: problems.length,
      goalCount: goals.length,
      outcomeCount: outcomes.length,
      progressCount: progress.length,
      completedGoals: goals.filter(goal => ['completed', 'adequate_for_discharge'].includes(goal.lastProgressStatus)).length,
      pendingGoals: goals.filter(goal => !goal.lastProgressStatus || goal.lastProgressStatus === 'not_progressing').length,
      recentProgress: recent ? {
        id: recent.id,
        label: recent.comment || recent.progressStatus,
        documentedAt: recent.documentedAt,
        documentedBy: recent.documentedBy
      } : null
    }
  },

  mostRecentCarePlanNote: (state, getters, rootState, rootGetters) => (patientId) => {
    const notes = rootGetters['nursing/getClinicalNotes']
      ?.filter(n => n.patientId === patientId && n.noteType === 'plan_of_care')
      ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) || []
    return notes[0] || null
  }
}
