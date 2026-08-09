import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// Modules
import patient from './modules/patient'
import flowsheets from './modules/flowsheets'
import orders from './modules/orders'
import nursing from './modules/nursing'
import carePlan from './modules/carePlan'
import education from './modules/education'
import discharge from './modules/discharge'

export default new Vuex.Store({
  modules: {
    patient,
    flowsheets,
    orders,
    nursing,
    carePlan,
    education,
    discharge
  },
  state: {
    appLoading: false,
    appError: null
  },
  mutations: {
    SET_LOADING(state, loading) {
      state.appLoading = loading
    },
    SET_ERROR(state, error) {
      state.appError = error
    }
  },
  actions: {
    setLoading({ commit }, loading) {
      commit('SET_LOADING', loading)
    },
    setError({ commit }, error) {
      commit('SET_ERROR', error)
    }
  }
})
