/**
 * reports.js — CameroHealth RMA (Rapport Mensuel d'Activité) Store
 * Real backend API only — submission, review, and org-hierarchy aggregation.
 */

import { reportsApi } from '~/services/api'

export const namespaced = true

export const state = () => ({
  reports: [],
  aggregate: null,
  loading: false,
  error: null
})

export const mutations = {
  SET_REPORTS(state, reports) { state.reports = reports },
  SET_AGGREGATE(state, aggregate) { state.aggregate = aggregate },
  SET_LOADING(state, loading) { state.loading = loading },
  SET_ERROR(state, error) { state.error = error }
}

export const actions = {
  async submitRma(_ctx, { reportMonth, reportYear, indicators }) {
    const { data } = await reportsApi.submit({ reportMonth, reportYear, indicators })
    return data.report
  },

  async fetchReports({ commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      const { data } = await reportsApi.list(params)
      commit('SET_REPORTS', data.reports || [])
      return data.reports
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async validateReport({ dispatch }, { id, validationNotes }) {
    const { data } = await reportsApi.validate(id, { validationNotes })
    await dispatch('fetchReports')
    return data.report
  },

  async rejectReport({ dispatch }, { id, rejectionReason }) {
    const { data } = await reportsApi.reject(id, { rejectionReason })
    await dispatch('fetchReports')
    return data.report
  },

  async fetchAggregate({ commit }, { unitId, month, year }) {
    commit('SET_LOADING', true)
    try {
      const { data } = await reportsApi.aggregate({ unitId, month, year })
      commit('SET_AGGREGATE', data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    } finally {
      commit('SET_LOADING', false)
    }
  }
}
