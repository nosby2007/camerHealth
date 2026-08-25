export const DISEASE_TYPES = {
  INFECTIOUS: 'Infectious',
  CHRONIC: 'Chronic'
}

export const diseases = {
  // Infectious
  MALARIA: 'malaria',
  CHOLERA: 'cholera',
  MONKEYPOX: 'monkeypox',
  TB: 'tb',
  MEASLES: 'measles',
  POLIO: 'polio',
  // Chronic
  DIABETES: 'diabetes',
  HYPERTENSION: 'hypertension',
  CKD: 'ckd',
  CVD_STROKE: 'cvd_stroke',
  CVD_HEART_ATTACK: 'cvd_heart_attack'
}

export const diseaseInfo = {
  malaria: {
    name: 'Malaria',
    nameFr: 'Paludisme',
    type: DISEASE_TYPES.INFECTIOUS,
    color: '#27ae60',
    icon: 'mdi-bug',
    stages: ['suspected', 'confirmed', 'under_treatment', 'discharged', 'deceased']
  },
  cholera: {
    name: 'Cholera',
    nameFr: 'Choléra',
    type: DISEASE_TYPES.INFECTIOUS,
    color: '#3498db',
    icon: 'mdi-water',
    stages: ['suspected', 'confirmed', 'hospitalized', 'discharged', 'deceased']
  },
  monkeypox: {
    name: 'Monkeypox',
    nameFr: 'Variole du singe',
    type: DISEASE_TYPES.INFECTIOUS,
    color: '#9b59b6',
    icon: 'mdi-alert-circle',
    stages: ['suspected', 'confirmed', 'isolated', 'recovered', 'deceased']
  },
  tb: {
    name: 'Tuberculosis',
    nameFr: 'Tuberculose',
    type: DISEASE_TYPES.INFECTIOUS,
    color: '#f39c12',
    icon: 'mdi-lungs',
    stages: ['suspected', 'confirmed', 'under_treatment', 'cured', 'deceased']
  },
  measles: {
    name: 'Measles',
    nameFr: 'Rougeole',
    type: DISEASE_TYPES.INFECTIOUS,
    color: '#e67e22',
    icon: 'mdi-rash',
    stages: ['suspected', 'confirmed', 'hospitalized', 'recovered', 'deceased']
  },
  polio: {
    name: 'Polio',
    nameFr: 'Polio',
    type: DISEASE_TYPES.INFECTIOUS,
    color: '#1abc9c',
    icon: 'mdi-wheelchair-accessibility',
    stages: ['suspected', 'confirmed', 'paralytic', 'recovered', 'deceased']
  },
  // Chronic Diseases
  diabetes: {
    name: 'Diabetes',
    nameFr: 'Diabète',
    type: DISEASE_TYPES.CHRONIC,
    color: '#e91e63',
    icon: 'mdi-insulin-pump',
    stages: ['suspected', 'newly_diagnosed', 'active_management', 'complications', 'deceased']
  },
  hypertension: {
    name: 'Hypertension',
    nameFr: 'Hypertension',
    type: DISEASE_TYPES.CHRONIC,
    color: '#f44336',
    icon: 'mdi-heart-pulse',
    stages: ['suspected', 'newly_diagnosed', 'active_management', 'stroke_risk', 'deceased']
  },
  ckd: {
    name: 'Chronic Kidney Disease',
    nameFr: 'Insuffisance Rénale Chronique',
    type: DISEASE_TYPES.CHRONIC,
    color: '#673ab7',
    icon: 'mdi-kidney',
    stages: ['stage_1', 'stage_2', 'stage_3', 'dialysis', 'deceased']
  },
  cvd_stroke: {
    name: 'Cardiovascular: Stroke',
    nameFr: 'AVC',
    type: DISEASE_TYPES.CHRONIC,
    color: '#ff5722',
    icon: 'mdi-brain',
    stages: ['acute', 'rehab', 'recovery', 'recurrent', 'deceased']
  },
  cvd_heart_attack: {
    name: 'Cardiovascular: Heart Attack',
    nameFr: 'Crise Cardiaque',
    type: DISEASE_TYPES.CHRONIC,
    color: '#a00',
    icon: 'mdi-fire-circle',
    stages: ['acute', 'stented', 'recovery', 'recurrent', 'deceased']
  }
}

export const state = () => ({
  currentDisease: 'malaria',
  diseaseData: {},
  loading: false,
  error: null,
  alerts: []
})

export const mutations = {
  setCurrentDisease(state, disease) {
    state.currentDisease = disease
  },
  setDiseaseData(state, { disease, data }) {
    state.diseaseData[disease] = data
  },
  setLoading(state, loading) {
    state.loading = loading
  },
  setError(state, error) {
    state.error = error
  },
  setAlerts(state, alerts) {
    state.alerts = alerts
  }
}

export const actions = {
  async loadDiseaseData({ commit, state }, disease) {
    commit('setLoading', true)
    commit('setError', null)
    
    try {
      const data = await getMockDiseaseData(disease)
      commit('setDiseaseData', { disease, data })
      commit('setLoading', false)
      return data
    } catch (error) {
      commit('setError', error.message)
      commit('setLoading', false)
    }
  },
  
  async loadAllAlerts({ commit, state }) {
    const alerts = generateAlerts(state.diseaseData[state.currentDisease])
    commit('setAlerts', alerts)
  },
  
  async fetchFromWHO({ commit }, disease) {
    const whoIndicators = {
      malaria: 'MALARIA_cases',
      cholera: 'CHOLERA_cases',
      measles: 'MEASLES_cases'
    }
    
    try {
      const response = await axios.get(
        `https://ghoapi.azureedge.net/api/${whoIndicators[disease]}`
      )
      return response.data
    } catch (error) {
      console.error('WHO API error:', error)
      return null
    }
  },
  
  changeDisease({ commit, dispatch }, disease) {
    commit('setCurrentDisease', disease)
    dispatch('loadDiseaseData', disease)
    dispatch('loadAllAlerts')
  }
}

export const getters = {
  getCurrentDisease: state => state.currentDisease,
  getDiseaseInfo: state => diseaseInfo[state.currentDisease],
  getCurrentData: state => state.diseaseData[state.currentDisease],
  getAlerts: state => state.alerts,
  isLoading: state => state.loading,
  getError: state => state.error,
  getAllDiseases: () => Object.keys(diseaseInfo)
}

function generateAlerts(data) {
  if (!data || !data.byRegion) return []
  
  const alerts = []
  const threshold = 1.5
  
  data.byRegion.forEach(region => {
    const recentAvg = region.recentTrend || 0
    const baseline = region.baseline || 1
    
    if (recentAvg > baseline * threshold) {
      alerts.push({
        type: 'warning',
        severity: recentAvg > baseline * 2 ? 'high' : 'medium',
        district: region.name,
        disease: data.disease,
        currentCases: region.cases,
        baseline: baseline,
        message: `Cases ${((recentAvg / baseline - 1) * 100).toFixed(0)}% above baseline`
      })
    }
  })
  
  return alerts.sort((a, b) => b.severity === 'high' ? 1 : -1)
}

async function getMockDiseaseData(disease) {
  const baseData = {
    malaria: {
      disease: 'malaria',
      total: { suspected: 2456000, confirmed: 1823400, under_treatment: 456000, discharged: 1354000, deceased: 4120 },
      byRegion: [
        { name: 'Far North', cases: 520000, baseline: 400 },
        { name: 'North', cases: 385000, baseline: 300 },
        { name: 'Adamawa', cases: 280000, baseline: 220 },
        { name: 'Centre', cases: 245000, baseline: 200 },
        { name: 'South', cases: 198000, baseline: 150 },
        { name: 'East', cases: 175000, baseline: 140 },
        { name: 'West', cases: 165000, baseline: 130 },
        { name: 'Littoral', cases: 145000, baseline: 120 },
        { name: 'South-West', cases: 98000, baseline: 80 },
        { name: 'North-West', cases: 64000, baseline: 50 }
      ],
      timeline: generateTimeline(30)
    },
    cholera: {
      disease: 'cholera',
      total: { suspected: 12450, confirmed: 8920, hospitalized: 1240, discharged: 7450, deceased: 230 },
      byRegion: [
        { name: 'Far North', cases: 4200, baseline: 15 },
        { name: 'North', cases: 2850, baseline: 10 },
        { name: 'Littoral', cases: 1820, baseline: 8 },
        { name: 'Centre', cases: 1240, baseline: 5 },
        { name: 'South-West', cases: 680, baseline: 4 },
        { name: 'East', cases: 520, baseline: 3 },
        { name: 'West', cases: 380, baseline: 2 },
        { name: 'Adamawa', cases: 280, baseline: 2 },
        { name: 'South', cases: 260, baseline: 2 },
        { name: 'North-West', cases: 220, baseline: 1 }
      ],
      timeline: generateTimeline(30)
    },
    monkeypox: {
      disease: 'monkeypox',
      total: { suspected: 892, confirmed: 245, isolated: 45, recovered: 198, deceased: 2 },
      byRegion: [
        { name: 'Centre', cases: 85, baseline: 5 },
        { name: 'South-West', cases: 52, baseline: 3 },
        { name: 'Littoral', cases: 45, baseline: 3 },
        { name: 'West', cases: 28, baseline: 2 },
        { name: 'North-West', cases: 18, baseline: 1 },
        { name: 'East', cases: 12, baseline: 1 },
        { name: 'South', cases: 5, baseline: 1 }
      ],
      timeline: generateTimeline(30)
    },
    tb: {
      disease: 'tb',
      total: { suspected: 89500, confirmed: 26840, under_treatment: 22450, cured: 4230, deceased: 160 },
      byRegion: [
        { name: 'Littoral', cases: 8200, baseline: 25 },
        { name: 'Centre', cases: 7450, baseline: 22 },
        { name: 'West', cases: 4200, baseline: 12 },
        { name: 'South-West', cases: 2850, baseline: 8 },
        { name: 'North-West', cases: 1820, baseline: 6 },
        { name: 'Far North', cases: 1240, baseline: 5 },
        { name: 'East', cases: 480, baseline: 3 },
        { name: 'South', cases: 320, baseline: 2 },
        { name: 'Adamawa', cases: 180, baseline: 1 },
        { name: 'North', cases: 100, baseline: 1 }
      ],
      timeline: generateTimeline(30)
    },
    measles: {
      disease: 'measles',
      total: { suspected: 24580, confirmed: 8920, hospitalized: 1240, recovered: 7640, deceased: 40 },
      byRegion: [
        { name: 'Far North', cases: 4200, baseline: 30 },
        { name: 'North', cases: 2850, baseline: 20 },
        { name: 'Adamawa', cases: 820, baseline: 8 },
        { name: 'Centre', cases: 450, baseline: 5 },
        { name: 'Littoral', cases: 280, baseline: 4 },
        { name: 'West', cases: 180, baseline: 3 },
        { name: 'South-West', cases: 140, baseline: 2 }
      ],
      timeline: generateTimeline(30)
    },
    polio: {
      disease: 'polio',
      total: { suspected: 45, confirmed: 12, paralytic: 3, recovered: 9, deceased: 0 },
      byRegion: [
        { name: 'Far North', cases: 5, baseline: 1 },
        { name: 'North', cases: 3, baseline: 1 },
        { name: 'Adamawa', cases: 2, baseline: 1 },
        { name: 'Centre', cases: 1, baseline: 0 },
        { name: 'Littoral', cases: 1, baseline: 0 }
      ],
      timeline: generateTimeline(30)
    }
  }
  
  return baseData[disease]
}

function generateTimeline(days) {
  const timeline = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    timeline.push({
      date: date.toISOString().split('T')[0],
      cases: Math.floor(Math.random() * 50) + 10,
      deaths: Math.floor(Math.random() * 5)
    })
  }
  
  return timeline
}