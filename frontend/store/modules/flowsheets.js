const state = () => ({
  flowsheetEntries: [],
  vitals: [],
  pain: [],
  mobility: [],
  intakeOutput: [],
  headToToe: []
})

const mutations = {
  ADD_FLOWSHEET_ENTRY(state, entry) {
    state.flowsheetEntries.push({
      id: Date.now().toString(),
      ...entry,
      timestamp: new Date().toISOString()
    })
  },
  ADD_VITALS(state, vitals) {
    state.vitals.push({
      id: Date.now().toString(),
      ...vitals,
      timestamp: new Date().toISOString()
    })
  },
  ADD_PAIN(state, pain) {
    state.pain.push({
      id: Date.now().toString(),
      ...pain,
      timestamp: new Date().toISOString()
    })
  },
  ADD_MOBILITY(state, mobility) {
    state.mobility.push({
      id: Date.now().toString(),
      ...mobility,
      timestamp: new Date().toISOString()
    })
  },
  ADD_INTAKE_OUTPUT(state, io) {
    state.intakeOutput.push({
      id: Date.now().toString(),
      ...io,
      timestamp: new Date().toISOString()
    })
  },
  ADD_HEAD_TO_TOE(state, htt) {
    state.headToToe.push({
      id: Date.now().toString(),
      ...htt,
      timestamp: new Date().toISOString()
    })
  }
}

const actions = {
  async createFlowsheetEntry({ commit }, payload) {
    commit('ADD_FLOWSHEET_ENTRY', payload)
    return payload
  },
  async createVitals({ commit }, vitals) {
    commit('ADD_VITALS', vitals)
    return vitals
  },
  async createPain({ commit }, pain) {
    commit('ADD_PAIN', pain)
    return pain
  },
  async createMobility({ commit }, mobility) {
    commit('ADD_MOBILITY', mobility)
    return mobility
  },
  async createIntakeOutput({ commit }, io) {
    commit('ADD_INTAKE_OUTPUT', io)
    return io
  },
  async createHeadToToe({ commit }, htt) {
    commit('ADD_HEAD_TO_TOE', htt)
    return htt
  }
}

const getters = {
  getLatestVitals: state => state.vitals[state.vitals.length - 1],
  getLatestPain: state => state.pain[state.pain.length - 1],
  getIOBalance: state => {
    const latest = state.intakeOutput[state.intakeOutput.length - 1]
    if (latest) {
      return (latest.totalIntake || 0) - (latest.totalOutput || 0)
    }
    return 0
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
