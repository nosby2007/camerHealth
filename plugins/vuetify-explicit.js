import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

export default ({ app }) => {
  if (app.vuetify) return

  app.vuetify = new Vuetify({
    icons: {
      iconfont: 'mdi'
    },
    theme: {
      dark: false,
      themes: {
        dark: {
          primary: '#003366',
          accent: '#B91C1C',
          secondary: '#00A99D',
          info: '#003366',
          warning: '#D97706',
          error: '#B91C1C',
          success: '#00A99D'
        },
        light: {
          primary: '#003366',
          secondary: '#00A99D',
          accent: '#F4A300',
          error: '#C0392B',
          warning: '#F4A300',
          info: '#00A99D',
          success: '#00A99D'
        }
      }
    }
  })
}