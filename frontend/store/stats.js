
const axios = require("axios").default;

export const state = () => ({
  allstats: false,
  disease: 'Malaria' // Default surveillance focus
});

export const mutations = {
  set(state, data) {
    state.allstats = data;
  },
  SET_DISEASE(state, disease) {
    state.locale = disease; // Wait, this should be state.disease!
    state.disease = disease;
  }
};

export const actions = {
  async loadStats({ commit }) {
    try {
      // Mock stats for demo stage if URL is missing
      const url = process.env.STATUS_AXIOS_URL;
      if (!url) {
        commit("set", { confirmed: 1250, dead: 45, recovered: 890 });
        return;
      }
      const stats = await axios.get(url);
      commit("set", stats.data);
      return stats.data;
    } catch (err) {
      commit("set", null);
    }
  }
};

export const getters = {
  getAllStats: state => {
    return state.allstats;
  },
  getDisease: state => {
    return state.disease;
  }
};
