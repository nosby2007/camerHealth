const state = () => ({
  educationSessions: [],
  educationTopics: [
    'Disease process',
    'Medication management',
    'Diet and nutrition',
    'Exercise and activity',
    'Stress management',
    'Warning signs/symptoms',
    'When to seek help',
    'Lifestyle modifications',
    'Follow-up appointments',
    'Support resources',
    'Wound care',
    'Pain management'
  ]
})

const mutations = {
  ADD_EDUCATION_SESSION(state, session) {
    state.educationSessions.push({
      id: Date.now().toString(),
      ...session,
      completedAt: new Date().toISOString()
    })
  },
  UPDATE_EDUCATION_SESSION(state, session) {
    const idx = state.educationSessions.findIndex(s => s.id === session.id)
    if (idx >= 0) {
      state.educationSessions[idx] = { ...state.educationSessions[idx], ...session }
    }
  }
}

const actions = {
  async recordEducation({ commit }, session) {
    commit('ADD_EDUCATION_SESSION', session)
    return session
  },
  async updateEducationSession({ commit }, session) {
    commit('UPDATE_EDUCATION_SESSION', session)
    return session
  }
}

const getters = {
  getEducationSessions: state => state.educationSessions,
  getEducationByTopic: state => topic =>
    state.educationSessions.filter(s => s.topic === topic),
  getTotalEducationHours: state =>
    state.educationSessions.reduce((total, s) => total + (s.duration || 0), 0) / 60
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
