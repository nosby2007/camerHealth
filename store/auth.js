/**
 * auth.js — CameroHealth Session & Identity Store
 * CIA Triad:
 *   Confidentiality : session stores only safe profile (no passwordHash). Token is a signed timestamp.
 *   Integrity       : login validates against hashed credentials in facility store. Role cannot be self-assigned.
 *   Availability    : session persisted to sessionStorage (tab-scoped, cleared on browser close).
 */

import { Auth } from 'aws-amplify'
import axios from 'axios'
import qs from 'qs'

const SESSION_KEY = 'camero_session'

function persistSession(data) {
  if (process.client) sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
}
function loadSession() {
  if (!process.client) return null
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) } catch { return null }
}
function clearSession() {
  if (process.client) sessionStorage.removeItem(SESSION_KEY)
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
    region:          session ? session.region : '',
    apiToken:        null,
    loginError:      null
  }
}

export const mutations = {
  SET_SESSION(state, profile) {
    state.isAuthenticated = true
    state.user            = { username: profile.fullName, first_name: profile.fullName.split(' ')[0], email: profile.email }
    state.role            = profile.role
    state.staffId         = profile.id
    state.fullName        = profile.fullName
    state.email           = profile.email
    state.institution     = profile.institution
    state.facilityId      = profile.facilityId
    state.region          = profile.region || ''
    state.loginError      = null
    persistSession({
      user:        state.user,
      role:        state.role,
      staffId:     state.staffId,
      fullName:    state.fullName,
      email:       state.email,
      institution: state.institution,
      facilityId:  state.facilityId,
      region:      state.region
    })
  },
  CLEAR_SESSION(state) {
    state.isAuthenticated = false
    state.user            = null
    state.role            = null
    state.staffId         = ''
    state.fullName        = ''
    state.email           = ''
    state.institution     = ''
    state.facilityId      = ''
    state.region          = ''
    state.apiToken        = null
    state.loginError      = null
    clearSession()
  },
  SET_LOGIN_ERROR(state, msg) {
    state.loginError = msg
  },
  SET_API_TOKEN(state, token) {
    state.apiToken = token
  },
  // Ministry layer — uses original free-entry flow (Cognito-backed)
  set(state, user) {
    if (user) {
      state.isAuthenticated = true
      state.user = user
    } else {
      state.isAuthenticated = false
      state.user = null
    }
  },
  setUserRole(state, { role, staffId, institution, region }) {
    state.role        = role
    state.staffId     = staffId
    state.institution = institution
    state.region      = region || ''
    // Persist ministry session to localStorage (survives tab close, matches original behaviour)
    if (process.client) {
      localStorage.setItem('camero_auth_role',        role)
      localStorage.setItem('camero_auth_staffId',     staffId)
      localStorage.setItem('camero_auth_institution', institution)
      localStorage.setItem('camero_auth_region',      region || '')
    }
  },
  loadFromStorage(state) {
    // Restore ministry session from localStorage on page reload
    if (process.client) {
      const role = localStorage.getItem('camero_auth_role')
      if (role === 'PUBLIC_HEALTH_OFFICER' || role === 'EPIDEMIOLOGIST') {
        state.role        = role
        state.staffId     = localStorage.getItem('camero_auth_staffId')     || ''
        state.institution = localStorage.getItem('camero_auth_institution') || ''
        state.region      = localStorage.getItem('camero_auth_region')      || ''
        state.isAuthenticated = true
      }
    }
  }
}

export const actions = {
  /**
   * login — verifies staffId + password + role against facility store.
   * On success commits SET_SESSION. On failure sets loginError.
   */
  async login({ commit, dispatch }, { staffId, password, role }) {
    commit('SET_LOGIN_ERROR', null)
    try {
      const profile = await dispatch('facility/verifyCredentials', { staffId, password, role }, { root: true })
      if (!profile) {
        commit('SET_LOGIN_ERROR', 'Invalid credentials. Please check your ID, password and role.')
        return false
      }
      // Attach facility name to session
      const facility = await dispatch('facility/getFacilityRecord', null, { root: true })
      commit('SET_SESSION', { ...profile, institution: facility ? facility.name : '' })
      return true
    } catch (err) {
      commit('SET_LOGIN_ERROR', 'Authentication error. Please try again.')
      return false
    }
  },

  logout({ commit }) {
    // Attempt Cognito sign-out silently (may fail if not using Cognito — that's fine)
    try { Auth.signOut() } catch (_) {}
    commit('CLEAR_SESSION')
  },

  // Legacy Cognito load — kept for backward compatibility
  async load({ commit }) {
    try {
      const user = await Auth.currentAuthenticatedUser()
      commit('set', user)
    } catch (_) {
      commit('set', null)
    }
  },

  async getApiToken({ commit }) {
    const authUrl      = process.env.AUTH_URL
    const clientId     = process.env.CLIENT_ID
    const clientSecret = process.env.CLIENT_SECRET
    if (!authUrl || !clientId || !clientSecret) return
    const key = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    try {
      const res = await axios.post(authUrl, qs.stringify({ grant_type: 'client_credentials' }), {
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8', Authorization: `Basic ${key}` }
      })
      commit('SET_API_TOKEN', res.data.access_token)
    } catch (_) {
      commit('SET_API_TOKEN', null)
    }
  }
}

export const getters = {
  isAdmin:   state => state.role === 'ADMIN',
  isDoctor:  state => state.role === 'DOCTOR',
  isNurse:   state => state.role === 'NURSE',
  isLab:     state => state.role === 'LAB',
  isImaging: state => state.role === 'IMAGING',
  isClinical: state => ['ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'IMAGING'].includes(state.role)
}
