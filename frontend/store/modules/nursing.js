const state = () => ({
  deviceMarkers: [],
  ivLines: [],
  catheters: [],
  drains: [],
  tracheostomies: [],
  ostomies: [],
  woundAssessments: []
})

const mutations = {
  ADD_DEVICE_MARKER(state, device) {
    state.deviceMarkers.push({
      id: Date.now().toString(),
      ...device,
      createdAt: new Date().toISOString()
    })

    switch (device.type) {
      case 'iv':
        state.ivLines.push(device)
        break
      case 'catheter':
      case 'foley':
        state.catheters.push(device)
        break
      case 'drain':
        state.drains.push(device)
        break
      case 'trach':
        state.tracheostomies.push(device)
        break
      case 'ostomy':
        state.ostomies.push(device)
        break
    }
  },
  UPDATE_DEVICE_STATUS(state, { deviceId, status }) {
    const device = state.deviceMarkers.find(d => d.id === deviceId)
    if (device) device.status = status
  },
  ADD_WOUND_ASSESSMENT(state, assessment) {
    state.woundAssessments.push({
      id: Date.now().toString(),
      ...assessment,
      createdAt: new Date().toISOString()
    })
  },
  ADD_WOUND_PHOTO(state, { assessmentId, photo }) {
    const assessment = state.woundAssessments.find(a => a.id === assessmentId)
    if (assessment) {
      if (!assessment.photos) assessment.photos = []
      assessment.photos.push({
        id: Date.now().toString(),
        data: photo.data,
        timestamp: photo.timestamp,
        assessmentId: photo.assessmentId,
        woundId: photo.woundId
      })
    }
  }
}

const actions = {
  async createDeviceMarker({ commit }, payload) {
    commit('ADD_DEVICE_MARKER', payload)
    return payload
  },
  async updateDeviceStatus({ commit }, payload) {
    commit('UPDATE_DEVICE_STATUS', payload)
    return payload
  },
  async createWoundAssessment({ commit }, assessment) {
    commit('ADD_WOUND_ASSESSMENT', assessment)
    return assessment
  },
  async addWoundPhoto({ commit }, payload) {
    commit('ADD_WOUND_PHOTO', payload)
    return payload
  }
}

const getters = {
  getActiveDevices: state => state.deviceMarkers.filter(d => d.status !== 'Removed'),
  getWoundPhotos: state => assessmentId => {
    const assessment = state.woundAssessments.find(a => a.id === assessmentId)
    return assessment ? assessment.photos || [] : []
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
