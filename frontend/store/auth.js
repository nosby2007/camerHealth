/**
 * auth.js — CameroHealth Session & Identity Store
 * Now powered by Express backend API instead of browser localStorage.
 */

import { authApi, setAuthToken, clearAuthToken } from '~/services/api'

const SESSION_KEY = 'camero_session'

function persistSession(data) {
  if (process.client) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    if (data?.facilityId) {
      sessionStorage.setItem('camero_facility_id', data.facilityId)
    }
  }
}
function loadSession() {
  if (!process.client) return null
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) } catch { return null }
}
function clearSession() {
  if (process.client) {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('camero_facility_id')
    sessionStorage.removeItem('camero_health_openPatientTabs')
  }
}

export const state = () => {
  const session = loadSession()
  return {
    isAuthenticated: !!(session && session.staffId),
    user:            session ? session.user : null,
    role:            session ? session.role : null,
    staffId:         session ? session.staffId : '',
    fullName:        session ? session.fullName : '',
    email:           session ? session.email : '',
    institution:     session ? session.institution : '',
    facilityId:      session ? session.facilityId : '',
    permissions:     session ? session.permissions : [],
    loginError:      null,
    loading:         false
  }
}

export const mutations = {
  SET_SESSION(state, session) {
    state.isAuthenticated = !!session
    state.user = session ? { staffId: session.staffId, role: session.role } : null
    state.role = session ? session.role : null
    state.staffId = session ? session.staffId : ''
    state.fullName = session ? session.fullName : ''
    state.email = session ? session.email : ''
    state.institution = session ? session.institution : ''
    state.facilityId = session ? session.facilityId : ''
    state.permissions = session ? session.permissions : []
    state.loginError = null
  },
  RESTORE_SESSION(state) {
    const session = loadSession()
    if (session && session.staffId) {
      state.isAuthenticated = true
      state.user = session.user
      state.role = session.role
      state.staffId = session.staffId
      state.fullName = session.fullName
      state.email = session.email
      state.institution = session.institution
      state.facilityId = session.facilityId
      state.permissions = session.permissions || []
    }
  },
  loadFromStorage() {
    // Purge any legacy localStorage items if present
    if (process.client) {
      localStorage.removeItem('camero_facility')
      localStorage.removeItem('camero_staff')
    }
  },
  CLEAR_SESSION(state) {
    state.isAuthenticated = false
    state.user = null
    state.role = null
    state.staffId = ''
    state.fullName = ''
    state.email = ''
    state.institution = ''
    state.facilityId = ''
    state.permissions = []
    state.loginError = null
    clearSession()
    clearAuthToken()
  },
  SET_LOGIN_ERROR(state, error) {
    state.loginError = error
  },
  SET_LOADING(state, val) {
    state.loading = val
  }
}

export const actions = {
  async login({ commit, dispatch }, { email, staffId, loginInput, password }) {
    commit('SET_LOADING', true)
    commit('SET_LOGIN_ERROR', null)
    try {
      const identifier = loginInput || staffId || email || ''
      const { data } = await authApi.login({ email: identifier, password })
      const { token, staffProfile, facility } = data

      setAuthToken(token)

      const session = {
        user: { staffId: staffProfile.staffCode, role: staffProfile.role },
        role: staffProfile.role,
        staffId: staffProfile.staffCode,
        fullName: staffProfile.fullName,
        email: staffProfile.email,
        institution: facility.name,
        facilityId: facility.id,
        permissions: data.permissions || []
      }

      persistSession(session)
      commit('SET_SESSION', session)

      // Populate facility store so admin dashboard shows data immediately
      commit('facility/SET_FACILITY', {
        id: facility.id,
        code: facility.code,
        name: facility.name,
        orgPrefix: facility.code,
        region: facility.region,
        city: facility.city,
        email: facility.email
      }, { root: true })
      commit('facility/SET_SETUP_COMPLETE', true, { root: true })

      commit('SET_LOADING', false)
      return true
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Login failed'
      commit('SET_LOGIN_ERROR', message)
      commit('SET_LOADING', false)
      return false
    }
  },

  async register({ commit }, payload) {
    commit('SET_LOADING', true)
    commit('SET_LOGIN_ERROR', null)
    try {
      const { data } = await authApi.register(payload)

      if (data.token) {
        setAuthToken(data.token)
        const session = {
          user: { staffId: data.staffProfile.staffCode, role: 'ADMIN' },
          role: 'ADMIN',
          staffId: data.staffProfile.staffCode,
          fullName: data.staffProfile.fullName,
          email: data.staffProfile.email,
          institution: data.facility.name,
          facilityId: data.facility.id,
          permissions: data.permissions || []
        }
        persistSession(session)
        commit('SET_SESSION', session)
      }

      commit('SET_LOADING', false)
      return data
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Registration failed'
      commit('SET_LOGIN_ERROR', message)
      commit('SET_LOADING', false)
      throw err
    }
  },

  async load({ commit }) {
    const session = loadSession()
    if (session && session.staffId) {
      commit('RESTORE_SESSION')
      // Re-attach token so API calls work after page refresh
      const token = process.client ? sessionStorage.getItem('camero_api_token') : null
      if (token) {
        const { setAuthToken } = require('~/services/api')
        setAuthToken(token)
        try {
          const { data } = await authApi.me()
          const staff = data.staff || {}
          const facility = data.facility || {}
          const refreshedSession = {
            ...session,
            user: { staffId: staff.staffCode || session.staffId, role: staff.role || session.role },
            role: staff.role || session.role,
            staffId: staff.staffCode || session.staffId,
            fullName: staff.fullName || session.fullName,
            email: staff.email || session.email,
            institution: facility.name || session.institution,
            facilityId: facility.id || staff.facilityId || session.facilityId,
            permissions: session.permissions || []
          }
          persistSession(refreshedSession)
          commit('SET_SESSION', refreshedSession)
        } catch (error) {
          commit('CLEAR_SESSION')
        }
      }
    }
  },

  logout({ commit }, options = {}) {
    clearAuthToken()
    commit('CLEAR_SESSION')
    if (process.client) {
      const reason = options && options.reason === 'inactive' ? '?reason=inactive' : ''
      const target = `/login${reason}`
      if (`${window.location.pathname}${window.location.search}` !== target) {
        window.location.replace(target)
      }
    }
  },

  async fetchProfile({ commit }) {
    try {
      const { data } = await authApi.me()
      return data
    } catch {
      commit('CLEAR_SESSION')
      return null
    }
  }
}

export const getters = {
  isAdmin:   state => state.role === 'ADMIN',
  isDoctor:  state => state.role === 'DOCTOR',
  isNurse:   state => state.role === 'NURSE',
  isMidwife: state => state.role === 'MIDWIFE',
  isPharmacy: state => state.role === 'PHARMACY',
  isFrontDesk: state => state.role === 'FRONT_DESK',
  isLab:     state => state.role === 'LAB',
  isImaging: state => state.role === 'IMAGING',
  isClinical: state => [
    'ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE',
    'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'LAB', 'IMAGING',
    'PHARMACY', 'BILLING', 'RECORDS', 'FRONT_DESK',
    'SOCIAL_WORKER', 'PHYSIOTHERAPIST'
  ].includes(state.role)
}
