import Vuex from "vuex";
import Vue from "vue";
Vue.use(Vuex);

export const state = () => ({
  locales: ['en', 'fr'],
  locale: 'en'
  // Custom state
});

export const mutations = {
  // Custom mutations
  SET_LANG(state, locale) {
    if (state.locales.includes(locale)) {
      state.locale = locale
      if (process.client) {
        localStorage.setItem('camero_locale', locale)
        document.documentElement.setAttribute('lang', locale)
      }
    }
  }
};

export const actions = {
  nuxtServerInit() { },
  initLocale({ commit, state }) {
    if (!process.client) return
    const stored = localStorage.getItem('camero_locale')
    const browser = (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en'
    commit('SET_LANG', state.locales.includes(stored) ? stored : browser)
  }
};
