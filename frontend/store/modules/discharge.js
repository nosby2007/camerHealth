const state = () => ({
  dischargePlans: [],
  followUpPlans: [],
  appointmentSchedules: [],
  returnPrecautions: []
})

const mutations = {
  ADD_DISCHARGE_PLAN(state, plan) {
    state.dischargePlans.push({
      id: Date.now().toString(),
      ...plan,
      createdAt: new Date().toISOString()
    })
  },
  ADD_FOLLOWUP_PLAN(state, plan) {
    state.followUpPlans.push({
      id: Date.now().toString(),
      ...plan,
      createdAt: new Date().toISOString()
    })
  },
  ADD_APPOINTMENT_SCHEDULE(state, schedule) {
    state.appointmentSchedules.push({
      id: Date.now().toString(),
      ...schedule,
      createdAt: new Date().toISOString()
    })
  },
  ADD_RETURN_PRECAUTIONS(state, precautions) {
    state.returnPrecautions.push({
      id: Date.now().toString(),
      ...precautions,
      createdAt: new Date().toISOString()
    })
  },
  UPDATE_DISCHARGE_PLAN(state, plan) {
    const idx = state.dischargePlans.findIndex(p => p.id === plan.id)
    if (idx >= 0) {
      state.dischargePlans[idx] = { ...state.dischargePlans[idx], ...plan }
    }
  },
  UPDATE_APPOINTMENT_STATUS(state, { appointmentId, status }) {
    const schedule = state.appointmentSchedules.find(s => s.id === appointmentId)
    if (schedule) {
      schedule.status = status
    }
  }
}

const actions = {
  async createDischargePlan({ commit }, plan) {
    commit('ADD_DISCHARGE_PLAN', plan)
    return plan
  },
  async createFollowUpPlan({ commit }, plan) {
    commit('ADD_FOLLOWUP_PLAN', plan)
    return plan
  },
  async createAppointmentSchedule({ commit }, schedule) {
    commit('ADD_APPOINTMENT_SCHEDULE', schedule)
    return schedule
  },
  async createReturnPrecautions({ commit }, precautions) {
    commit('ADD_RETURN_PRECAUTIONS', precautions)
    return precautions
  },
  async updateDischargePlan({ commit }, plan) {
    commit('UPDATE_DISCHARGE_PLAN', plan)
    return plan
  },
  async updateAppointmentStatus({ commit }, payload) {
    commit('UPDATE_APPOINTMENT_STATUS', payload)
    return payload
  }
}

const getters = {
  getDischargePlan: state => encounterId =>
    state.dischargePlans.find(p => p.encounterId === encounterId),
  getFollowUpTasks: state => encounterId => {
    const plan = state.followUpPlans.find(p => p.encounterId === encounterId)
    return plan ? plan.tasks || [] : []
  },
  getPendingAppointments: state =>
    state.appointmentSchedules.filter(a => a.status !== 'Completed'),
  getCriticalRedFlags: state => encounterId => {
    const precautions = state.returnPrecautions.find(p => p.encounterId === encounterId)
    return precautions ? Object.keys(precautions.criticalRedFlags || {}).filter(
      key => precautions.criticalRedFlags[key]
    ) : []
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
