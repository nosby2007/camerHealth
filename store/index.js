// Nuxt assembles every file in /store into the application store. Keeping the
// root in module format preserves auth, clinical, nursing and all other modules.
export const state = () => ({
  appLoading: false,
  appError: null
})

export const mutations = {
  SET_LOADING(state, loading) {
    state.appLoading = loading
  },
  SET_ERROR(state, error) {
    state.appError = error
  }
}

export const actions = {
  setLoading({ commit }, loading) {
    commit('SET_LOADING', loading)
  },
  setError({ commit }, error) {
    commit('SET_ERROR', error)
  }
}
