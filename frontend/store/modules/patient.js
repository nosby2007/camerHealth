const state = () => ({
  currentPatient: null,
  currentEncounter: null,
  patients: {},
  encounters: {}
})

const mutations = {
  SET_CURRENT_PATIENT(state, patient) {
    state.currentPatient = patient
  },
  SET_CURRENT_ENCOUNTER(state, encounter) {
    state.currentEncounter = encounter
  },
  ADD_PATIENT(state, patient) {
    state.patients[patient.id] = patient
  },
  ADD_ENCOUNTER(state, encounter) {
    state.encounters[encounter.id] = encounter
  },
  UPDATE_PATIENT(state, patient) {
    state.patients[patient.id] = { ...state.patients[patient.id], ...patient }
  }
}

const actions = {
  async loadPatient({ commit }, patientId) {
    try {
      const patient = {
        id: patientId,
        name: 'Patient Name',
        mrn: '123456',
        dob: '1990-01-01',
        age: 34,
        gender: 'M',
        allergies: []
      }
      commit('ADD_PATIENT', patient)
      commit('SET_CURRENT_PATIENT', patient)
    } catch (error) {
      console.error('Error loading patient:', error)
    }
  },
  async loadEncounter({ commit }, encounterId) {
    try {
      const encounter = {
        id: encounterId,
        patientId: null,
        admissionDate: new Date().toISOString(),
        status: 'Active',
        location: 'Medical Unit',
        primaryProvider: 'Dr. Smith'
      }
      commit('ADD_ENCOUNTER', encounter)
      commit('SET_CURRENT_ENCOUNTER', encounter)
    } catch (error) {
      console.error('Error loading encounter:', error)
    }
  },
  updatePatient({ commit }, patient) {
    commit('UPDATE_PATIENT', patient)
  }
}

const getters = {
  getPatient: state => id => state.patients[id],
  getEncounter: state => id => state.encounters[id]
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
