<template>
  <v-app>
    <v-menu offset-y transition="slide-y-transition" tile>
      <template v-slot:activator="{ on }">
        <v-btn fixed top right text class="mt-3 mr-3 font-weight-black text-caption lang-toggle" v-on="on">
          <v-icon left small>mdi-translate</v-icon>
          {{ currentLangName }}
        </v-btn>
      </template>
      <v-list dense tile class="pa-0">
        <v-list-item @click="setLang('en')">
          <v-list-item-title class="font-weight-bold text-caption">{{ $t('lang.english').toUpperCase() }}</v-list-item-title>
        </v-list-item>
        <v-list-item @click="setLang('fr')">
          <v-list-item-title class="font-weight-bold text-caption">{{ $t('lang.french').toUpperCase() }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-flex mx-auto>
      <nuxt />
    </v-flex>
  </v-app>
</template>

<script>
export default {
  computed: {
    currentLangName() {
      return this.$store.state.locale === 'fr' ? this.$t('lang.french').toUpperCase() : this.$t('lang.english').toUpperCase()
    }
  },
  methods: {
    setLang(lang) {
      this.$store.commit('SET_LANG', lang)
      this.$i18n.locale = lang
    }
  }
};
</script>

<style scoped>
.lang-toggle {
  background: rgba(255,255,255,0.92) !important;
  border: 1px solid #E2E8F0;
  z-index: 20;
}
</style>
