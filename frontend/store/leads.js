/**
 * leads.js — CameroHealth Commercial Pipeline Store
 * The vendor's own sales CRM (prospect -> demo -> contract -> signed
 * customer). Real backend API only. Super Admin scope, unrelated to any
 * clinical or MINSANTE hierarchy concept.
 */

import { leadsApi } from '~/services/api'

export const namespaced = true

export const state = () => ({
  leads: [],
  stages: [],
  current: null,
  loading: false,
  error: null
})

export const mutations = {
  SET_LEADS(state, leads) { state.leads = leads },
  SET_STAGES(state, stages) { state.stages = stages },
  SET_CURRENT(state, lead) { state.current = lead },
  SET_LOADING(state, loading) { state.loading = loading },
  SET_ERROR(state, error) { state.error = error }
}

export const getters = {
  byStage: state => stage => state.leads.filter(l => l.stage === stage)
}

export const actions = {
  async fetchLeads({ commit }) {
    commit('SET_LOADING', true)
    try {
      const { data } = await leadsApi.list()
      commit('SET_LEADS', data.leads || [])
      commit('SET_STAGES', data.stages || [])
      return data.leads
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchLead({ commit }, id) {
    const { data } = await leadsApi.get(id)
    commit('SET_CURRENT', data.lead)
    return data.lead
  },

  async createLead({ dispatch }, payload) {
    const { data } = await leadsApi.create(payload)
    await dispatch('fetchLeads')
    return data.lead
  },

  async updateLead({ dispatch }, { id, ...payload }) {
    const { data } = await leadsApi.update(id, payload)
    await dispatch('fetchLeads')
    return data.lead
  },

  async changeStage({ dispatch }, { id, ...payload }) {
    const { data } = await leadsApi.changeStage(id, payload)
    await dispatch('fetchLeads')
    return data.lead
  },

  async addActivity({ dispatch }, { id, ...payload }) {
    const { data } = await leadsApi.addActivity(id, payload)
    await dispatch('fetchLead', id)
    return data.activity
  },

  async convertLead({ dispatch }, { id, ...payload }) {
    const { data } = await leadsApi.convert(id, payload)
    await dispatch('fetchLeads')
    return data
  }
}
