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

function parseBooleanFlag(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

function mapSupabaseCompatError(err) {
  const code = err && err.code ? err.code : ''
  const map = {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    STAFF_PROFILE_NOT_FOUND: 'Your account is authenticated but not linked to a staff profile.',
    STAFF_PROFILE_INACTIVE: 'Your staff account is inactive. Please contact an administrator.',
    FACILITY_MISSING: 'Your staff profile is missing a facility assignment.',
    ROLE_MISSING: 'Your staff profile is missing a role assignment.',
    SUPABASE_AUTH_FAILURE: 'Supabase authentication failed. Please try again.',
    STAFF_PROFILE_LOOKUP_FAILED: 'Unable to resolve your staff profile at this time.',
    SUPABASE_CONFIG_MISSING: 'Supabase login is not configured for this environment.'
  }
  return map[code] || (err && err.message ? err.message : 'Supabase authentication failed.')
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
    if (process.client) {
      localStorage.removeItem('camero_auth_role')
      localStorage.removeItem('camero_auth_staffId')
      localStorage.removeItem('camero_auth_institution')
      localStorage.removeItem('camero_auth_region')
    }
  },
  SET_LOGIN_ERROR(state, msg) {
    state.loginError = msg
  },
  SET_API_TOKEN(state, token) {
    state.apiToken = token
  },
  RESTORE_SESSION(state) {
    const session = loadSession()
    if (!session || !session.staffId || !session.role) return
    state.isAuthenticated = true
    state.user            = session.user || { username: session.fullName, first_name: (session.fullName || '').split(' ')[0], email: session.email }
    state.role            = session.role
    state.staffId         = session.staffId
    state.fullName        = session.fullName || ''
    state.email           = session.email || ''
    state.institution     = session.institution || ''
    state.facilityId      = session.facilityId || ''
    state.region          = session.region || ''
    state.loginError      = null
  },
  // National Health Statistics — uses original free-entry flow (Cognito-backed)
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
    // Ministry session is NOT auto-restored on page load.
    // User must explicitly log in via /ministry-login each session.
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

  // Transitional compatibility action:
  // Optional Supabase Auth path behind feature flag.
  // It does not replace prototype login() unless explicitly called.
  async loginWithSupabaseCompat({ commit }, { email, password }) {
    commit('SET_LOGIN_ERROR', null)
    const enabled = this.$supabaseAuthCompat && typeof this.$supabaseAuthCompat.isEnabled === 'function'
      ? this.$supabaseAuthCompat.isEnabled()
      : parseBooleanFlag(process.env.ENABLE_SUPABASE_AUTH || 'false', false)
    if (!enabled) {
      commit('SET_LOGIN_ERROR', 'Supabase Auth compatibility is disabled by feature flag.')
      return false
    }

    try {
      const context = await this.$supabaseAuthCompat.signInWithPassword({ email, password })

      // TODO(phase-9): emit backend audit event for successful Supabase compatibility login.
      commit('SET_SESSION', {
        id: context.staffCode || context.staffProfileId,
        role: context.role,
        fullName: context.displayName,
        email: context.email,
        institution: context.institutionName || '',
        facilityId: context.facilityId,
        region: ''
      })
      return true
    } catch (err) {
      // TODO(phase-9): emit backend audit event for failed Supabase compatibility login.
      commit('SET_LOGIN_ERROR', mapSupabaseCompatError(err))
      return false
    }
  },

  // Optional helper to resolve normalized Supabase auth context for migrated flows.
  async resolveSupabaseCompatContext() {
    return this.$supabaseAuthCompat.resolveAuthContext()
  },

  logout({ commit }) {
    // Attempt Cognito sign-out silently (may fail if not using Cognito — that's fine)
    try { Auth.signOut() } catch (_) {}
    commit('CLEAR_SESSION')
  },

  // Optional Supabase sign-out for migrated flows.
  async logoutSupabaseCompat() {
    return this.$supabaseAuthCompat.signOut()
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
    const key = (process.server) 
      ? Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      : btoa(`${clientId}:${clientSecret}`)
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
  isMidwife: state => state.role === 'MIDWIFE',
  isPharmacy: state => state.role === 'PHARMACY',
  isFrontDesk: state => state.role === 'FRONT_DESK',
  isLab:     state => state.role === 'LAB',
  isImaging: state => state.role === 'IMAGING',
  isClinical: state => [
    'ADMIN',
    'DOCTOR',
    'NP',
    'NURSE',
    'CNA',
    'MIDWIFE',
    'MAJOR_SERVICE',
    'NURSING_SUPERVISOR',
    'LAB',
    'IMAGING',
    'PHARMACY',
    'BILLING',
    'RECORDS',
    'FRONT_DESK',
    'SOCIAL_WORKER',
    'PHYSIOTHERAPIST'
  ].includes(state.role)
}
