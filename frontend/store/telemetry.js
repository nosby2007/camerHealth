
export const state = () => ({
  records: [],
  loading: false
})

export const mutations = {
  SET_RECORDS(state, records) {
    state.records = records
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  }
}

export const actions = {
  async fetchNationalData({ commit }) {
    commit('SET_LOADING', true)
    console.log('--- STARTING NATIONAL CLOUD FETCH ---')
    try {
      const { data, error } = await this.$supabase
        .from('health_telemetry')
        .select('*')
        .order('recorded_at', { ascending: false })

      if (error) {
        console.error('❌ Cloud Fetch Failed:', error.message)
        throw error
      }
      
      console.log('✅ Cloud Fetch Successful! Records found:', data ? data.length : 0)
      commit('SET_RECORDS', data || [])
    } catch (e) {
      console.error('Supabase fetch error:', e)
    } finally {
      commit('SET_LOADING', false)
    }
  }
}

export const getters = {
  totalCases: state => state.records.reduce((sum, r) => sum + (r.case_count || 1), 0),
  getRegionalStats: state => {
    const stats = {}
    state.records.forEach(r => {
      if (!stats[r.region]) stats[r.region] = 0
      stats[r.region] += (r.case_count || 1)
    })
    return stats
  },
  getDiseaseStats: state => {
    const stats = {}
    state.records.forEach(r => {
      if (!stats[r.disease]) stats[r.disease] = 0
      stats[r.disease] += (r.case_count || 1)
    })
    return stats
  }
}
