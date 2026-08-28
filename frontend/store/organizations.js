/**
 * organizations.js — CameroHealth Phase 13 Org Hierarchy Store
 * MINSANTE / Regional Delegation / District -> Facility. Real backend API only
 * (see docs/security/multi-tenant-superadmin-architecture.md).
 */

import { organizationApi } from '~/services/api'

export const namespaced = true

export const state = () => ({
  organizations: [],
  units: [],
  facilities: [],
  overview: null,
  loading: false,
  error: null
})

export const mutations = {
  SET_ORGANIZATIONS(state, organizations) { state.organizations = organizations },
  SET_UNITS(state, units) { state.units = units },
  SET_FACILITIES(state, facilities) { state.facilities = facilities },
  SET_OVERVIEW(state, overview) { state.overview = overview },
  SET_LOADING(state, loading) { state.loading = loading },
  SET_ERROR(state, error) { state.error = error }
}

export const getters = {
  unitsByParent: state => parentId => state.units.filter(u => (u.parentUnitId || null) === (parentId || null)),
  unitById: state => id => state.units.find(u => u.id === id) || null
}

export const actions = {
  async fetchOrganizations({ commit }) {
    commit('SET_LOADING', true)
    try {
      const { data } = await organizationApi.list()
      commit('SET_ORGANIZATIONS', data.organizations || [])
      return data.organizations
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createOrganization({ dispatch }, payload) {
    const { data } = await organizationApi.create(payload)
    await dispatch('fetchOrganizations')
    return data.organization
  },

  async updateOrganization({ dispatch }, { id, ...payload }) {
    const { data } = await organizationApi.update(id, payload)
    await dispatch('fetchOrganizations')
    return data.organization
  },

  async removeOrganization({ dispatch }, id) {
    await organizationApi.remove(id)
    await dispatch('fetchOrganizations')
  },

  async fetchUnits({ commit }, organizationId) {
    commit('SET_LOADING', true)
    try {
      const { data } = await organizationApi.listUnits(organizationId)
      commit('SET_UNITS', data.organizationUnits || [])
      return data.organizationUnits
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchFacilities({ commit }, organizationId) {
    commit('SET_LOADING', true)
    try {
      const { data } = await organizationApi.listFacilities(organizationId)
      commit('SET_FACILITIES', data.facilities || [])
      return data.facilities
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchOverview({ commit }) {
    try {
      const { data } = await organizationApi.overview()
      commit('SET_OVERVIEW', data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },

  async createUnit({ dispatch }, { organizationId, ...payload }) {
    const { data } = await organizationApi.createUnit(organizationId, payload)
    await dispatch('fetchUnits', organizationId)
    return data.organizationUnit
  },

  async updateUnit({ dispatch }, { organizationId, unitId, ...payload }) {
    const { data } = await organizationApi.updateUnit(organizationId, unitId, payload)
    await dispatch('fetchUnits', organizationId)
    return data.organizationUnit
  },

  async removeUnit({ dispatch }, { organizationId, unitId }) {
    await organizationApi.removeUnit(organizationId, unitId)
    await dispatch('fetchUnits', organizationId)
  },

  async attachFacility(_ctx, { facilityId, organizationId, organizationUnitId }) {
    const { data } = await organizationApi.attachFacility(facilityId, { organizationId, organizationUnitId })
    return data.facility
  },

  async createStaffAssignment(_ctx, { organizationId, ...payload }) {
    const { data } = await organizationApi.createStaffAssignment(organizationId, payload)
    return data.staffAssignment
  },

  async revokeStaffAssignment(_ctx, assignmentId) {
    const { data } = await organizationApi.revokeStaffAssignment(assignmentId)
    return data.staffAssignment
  }
}
