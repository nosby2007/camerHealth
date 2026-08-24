import { billingApi, catalogApi } from '~/services/api'
import DEFAULT_CATALOG from '~/services/defaultCatalog'

function deepClone(val) { return JSON.parse(JSON.stringify(val)) }

function mergeDbIntoCatalog(base, dbItems) {
  const result = deepClone(base)
  for (const item of dbItems) {
    const section = item.section
    if (!result[section]) result[section] = []
    const idx = result[section].findIndex(d => d.name === item.name || d.id === item.id)
    if (idx !== -1) {
      result[section][idx] = { ...result[section][idx], unitPrice: item.unitPrice, costPrice: item.costPrice, minPrice: item.minPrice, maxPrice: item.maxPrice, active: item.active, dbId: item.id }
    } else {
      result[section].push({ ...item })
    }
  }
  return result
}

export const state = () => ({
  catalog: deepClone(DEFAULT_CATALOG),
  statements: {},      // keyed by patientId
  clearances: {},      // keyed by patientId → array
  loading: false,
  error: null
})

export const mutations = {
  SET_CATALOG(state, catalog) { state.catalog = catalog },
  UPDATE_CATALOG_ITEM(state, { section, id, updates }) {
    if (!state.catalog[section]) return
    const idx = state.catalog[section].findIndex(i => i.id === id || i.dbId === id)
    if (idx !== -1) state.catalog[section].splice(idx, 1, { ...state.catalog[section][idx], ...updates })
  },
  ADD_CATALOG_ITEM(state, { section, item }) {
    if (!state.catalog[section]) state.catalog[section] = []
    state.catalog[section].push(item)
  },
  SET_STATEMENT(state, { patientId, statement }) {
    state.statements = { ...state.statements, [patientId]: statement }
  },
  SET_ALL_STATEMENTS(state, statements) {
    const map = { ...state.statements }
    statements.forEach(s => {
      // Only overwrite if the incoming data is newer or the slot is empty
      const existing = map[s.patientId]
      if (!existing || !existing.updatedAt || (s.updatedAt && new Date(s.updatedAt) >= new Date(existing.updatedAt))) {
        map[s.patientId] = s
      }
    })
    state.statements = map
  },
  SET_CLEARANCES(state, { patientId, clearances }) {
    state.clearances = { ...state.clearances, [patientId]: clearances }
  },
  SET_LOADING(state, val) { state.loading = val },
  SET_ERROR(state, err) { state.error = err }
}

export const actions = {
  // ─── Catalog ──────────────────────────────────────────────────────────────
  async fetchCatalog({ commit }) {
    try {
      const { data } = await catalogApi.list()
      if (data && data.items && data.items.length > 0) {
        commit('SET_CATALOG', mergeDbIntoCatalog(DEFAULT_CATALOG, data.items))
      }
    } catch (err) {
      console.warn('[BillingStore] Catalog API unreachable, using defaults:', err.message)
    }
  },

  async loadFromStorage({ dispatch }) {
    return dispatch('fetchCatalog')
  },

  async updateCatalogItem({ commit }, { section, id, updates }) {
    commit('UPDATE_CATALOG_ITEM', { section, id, updates })
    try { await catalogApi.update(id, updates) } catch (err) { console.error(err.message) }
  },

  async addCatalogItem({ commit }, { section, item }) {
    commit('ADD_CATALOG_ITEM', { section, item })
    try { await catalogApi.create({ ...item, section }) } catch (err) { console.error(err.message) }
  },

  // ─── Statements ───────────────────────────────────────────────────────────
  async fetchAllStatements({ commit }) {
    try {
      const { data } = await billingApi.getStatements()
      commit('SET_ALL_STATEMENTS', data.statements || [])
    } catch (err) {
      commit('SET_ERROR', err.message)
      console.error('[billing/fetchAllStatements]', err.message)
    }
  },

  async fetchStatement({ commit }, patientId) {
    try {
      const { data } = await billingApi.getStatement(patientId)
      commit('SET_STATEMENT', { patientId, statement: data })
      return data
    } catch (err) {
      commit('SET_ERROR', err.message)
    }
  },

  // ─── Charges ──────────────────────────────────────────────────────────────
  async createManualCharge({ dispatch }, { patientId, description, unitPrice, quantity, category }) {
    await billingApi.addCharge({ patientId, description, unitPrice, quantity: quantity || 1, category: category || 'manual' })
    await dispatch('fetchStatement', patientId)
    await dispatch('fetchAllStatements')
  },

  async waiveCharge({ dispatch, state }, chargeId) {
    // Find which patient owns this charge
    const patientId = Object.keys(state.statements).find(pid => {
      const stmt = state.statements[pid]
      return stmt && (stmt.charges || []).some(c => c.id === chargeId)
    })
await billingApi.updateCharge(chargeId, { status: 'Waived' })
    if (patientId) {
      await dispatch('fetchStatement', patientId)
      await dispatch('fetchAllStatements')
    }
  },

  async reopenCharge({ dispatch, state }, chargeId) {
    const patientId = Object.keys(state.statements).find(pid => {
      const stmt = state.statements[pid]
      return stmt && (stmt.charges || []).some(c => c.id === chargeId)
    })
    await billingApi.updateCharge(chargeId, { status: 'Open' })
    if (patientId) {
      await dispatch('fetchStatement', patientId)
      await dispatch('fetchAllStatements')
    }
  },

  // ─── Payments ─────────────────────────────────────────────────────────────
  async recordPayment({ dispatch }, { patientId, amount, method, reference, note, paidChargeIds }) {
    const { data } = await billingApi.recordPayment({ patientId, amount, method, reference, note, paidChargeIds })
    // Refresh the single patient statement AND the whole queue so the left list,
    // totals, and balance stay coherent everywhere.
    await dispatch('fetchStatement', patientId)
    await dispatch('fetchAllStatements')
    return data.payment
  },

  // ─── Clearances ───────────────────────────────────────────────────────────
  async issueClearance({ commit, dispatch }, { patientId, serviceType, department, amount, method }) {
    const { data } = await billingApi.issueClearance({ patientId, serviceType, department, amount, method })
    await dispatch('fetchStatement', patientId)
    await dispatch('fetchClearances', patientId)
    return data
  },

  async fetchClearances({ commit }, patientId) {
    try {
      const { data } = await billingApi.getClearances(patientId)
      commit('SET_CLEARANCES', { patientId, clearances: data.clearances || [] })
    } catch (err) {
      commit('SET_CLEARANCES', { patientId, clearances: [] })
    }
  },

  async revokeClearance({ dispatch, state }, clearanceId) {
    await billingApi.revokeClearance(clearanceId)
    // Refresh clearances for all patients that have this clearance
    const patientId = Object.keys(state.clearances).find(pid =>
      (state.clearances[pid] || []).some(c => c.id === clearanceId)
    )
    if (patientId) await dispatch('fetchClearances', patientId)
  },

  // ─── Auto-charge helpers (called by clinical modules) ─────────────────────
  async chargeForLabOrder({ dispatch }, { patientId, orderId, testName, unitPrice }) {
    await billingApi.addCharge({
      patientId, description: `Lab: ${testName}`, category: 'laboratory',
      unitPrice, quantity: 1, sourceType: 'lab_order', sourceId: orderId,
      departmentSource: 'Laboratory'
    })
    await dispatch('fetchStatement', patientId)
    await dispatch('fetchAllStatements')
  },

  async chargeForImagingOrder({ dispatch }, { patientId, orderId, examName, unitPrice }) {
    await billingApi.addCharge({
      patientId, description: `Imaging: ${examName}`, category: 'imaging',
      unitPrice, quantity: 1, sourceType: 'imaging_order', sourceId: orderId,
      departmentSource: 'Radiology'
    })
    await dispatch('fetchStatement', patientId)
    await dispatch('fetchAllStatements')
  },

  async chargeForMedication({ dispatch }, { patientId, medicationId, drugName, unitPrice, quantity }) {
    // unitPrice MUST come from the PriceCatalog so the Cash Office bill always
    // matches the official price list exactly.
    await billingApi.addCharge({
      patientId, description: `Medication: ${drugName}`, category: 'drug',
      unitPrice, quantity: quantity || 1, sourceType: 'medication', sourceId: medicationId,
      departmentSource: 'Pharmacy'
    })
    await dispatch('fetchStatement', patientId)
    // Keep the Cash Office queue coherent so the new pending charge shows up at once.
    await dispatch('fetchAllStatements')
  },

  async chargeForAdmission({ dispatch }, { patientId, inpatientId, ward, unitPrice }) {
    await billingApi.addCharge({
      patientId, description: `Inpatient admission — ${ward}`, category: 'hospitalization',
      unitPrice, quantity: 1, sourceType: 'inpatient', sourceId: inpatientId,
      departmentSource: ward
    })
    await dispatch('fetchStatement', patientId)
    await dispatch('fetchAllStatements')
  }
}

export const getters = {
  catalog: state => state.catalog,
  catalogSections: state => Object.keys(state.catalog),
  flatCatalog: state => Object.keys(state.catalog).reduce((acc, section) => {
    return acc.concat((state.catalog[section] || []).map(item => ({ ...item, section })))
  }, []),
  activeCatalog: (state, getters) => getters.flatCatalog.filter(item => item.active !== false),
  getCatalogItem: state => (section, id) => {
    return (state.catalog[section] || []).find(i => i.id === id || i.dbId === id) || null
  },

  // Returns the live statement object for a patient
  statementForPatient: state => patientId => {
    return state.statements[patientId] || {
      invoiceId: null, patientId, patientName: '', charges: [], payments: [],
      totalCharges: 0, amountPaid: 0, balance: 0, status: 'NO_CHARGES', updatedAt: null
    }
  },

  // Returns outstanding balance for a patient (used by discharge gate)
  getPatientBalance: state => patientId => {
    const stmt = state.statements[patientId]
    return stmt ? stmt.balance : 0
  },

  // Returns active (non-revoked, non-expired) clearance for a patient+serviceType
  getPaymentClearance: state => (patientId, serviceType) => {
    if (!patientId) return null
    const list = state.clearances[patientId] || []
    return list.find(c =>
      !c.revoked &&
      new Date(c.expiresAt) > new Date() &&
      (!serviceType || c.serviceType === serviceType)
    ) || null
  }
}
