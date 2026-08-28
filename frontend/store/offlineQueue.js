// ─── CameroHealth — Offline queue coordinator ───────────────────────────────
// Owns the "N pending sync" indicator and replays queued writes on reconnect.
// Handlers call the raw API client directly (not other store actions) so a
// replay never re-triggers a duplicate local/optimistic record.
import { vitalsApi, reportsApi } from '~/services/api'
import { listPending, flush, watchForReconnect } from '~/util/offline-queue'

export const namespaced = true

export const state = () => ({
  pendingCount: 0,
  flushing: false
})

export const mutations = {
  SET_PENDING_COUNT(state, count) { state.pendingCount = count },
  SET_FLUSHING(state, flushing) { state.flushing = flushing }
}

const HANDLERS = {
  'vitals-record': payload => vitalsApi.record(payload),
  'rma-submit': payload => reportsApi.submit(payload)
}

export const actions = {
  async refreshPendingCount({ commit, rootState }) {
    const pending = await listPending(rootState.auth?.facilityId).catch(() => [])
    commit('SET_PENDING_COUNT', pending.length)
  },

  async flushQueue({ commit, dispatch, rootState }) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    commit('SET_FLUSHING', true)
    try {
      await flush(rootState.auth?.facilityId, HANDLERS)
    } finally {
      commit('SET_FLUSHING', false)
      await dispatch('refreshPendingCount')
    }
  },

  initOfflineSync({ dispatch }) {
    dispatch('refreshPendingCount')
    watchForReconnect(() => dispatch('flushQueue'))
  }
}
