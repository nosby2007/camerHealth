<template>
  <v-app id="camerohealth-public">
    <header class="public-header">
      <nuxt-link to="/" class="brand-lockup" aria-label="CameroHealth home">
        <span class="brand-mark"><img src="/logo.png" alt="" /></span>
        <span class="brand-copy"><strong>CameroHealth</strong><small>{{ copy.brandLine }}</small></span>
      </nuxt-link>

      <nav class="public-nav" aria-label="Public navigation">
        <nuxt-link to="/">{{ copy.home }}</nuxt-link>
        <nuxt-link to="/about">{{ copy.product }}</nuxt-link>
        <nuxt-link to="/implementation">{{ copy.deployment }}</nuxt-link>
        <nuxt-link to="/security">{{ copy.security }}</nuxt-link>
        <nuxt-link to="/contact">{{ copy.contact }}</nuxt-link>
      </nav>

      <div class="header-actions">
        <button class="language-button" type="button" @click="toggleLanguage">
          <v-icon small>mdi-translate</v-icon>{{ isFrench ? 'EN' : 'FR' }}
        </button>
        <nuxt-link to="/login" class="access-button" :aria-label="copy.access">
          {{ copy.access }}<v-icon small>mdi-arrow-right</v-icon>
        </nuxt-link>
      </div>
    </header>

    <main class="public-main"><nuxt /></main>

    <footer class="public-footer">
      <div class="footer-grid">
        <div><strong>CameroHealth</strong><p>{{ copy.footerLine }}</p></div>
        <div class="footer-links">
          <nuxt-link to="/implementation">{{ copy.deployment }}</nuxt-link>
          <nuxt-link to="/security">{{ copy.security }}</nuxt-link>
          <nuxt-link to="/contact">{{ copy.contact }}</nuxt-link>
        </div>
        <div class="footer-status"><span></span>{{ copy.availability }}</div>
      </div>
      <div class="footer-bottom">© {{ new Date().getFullYear() }} CameroHealth</div>
    </footer>
  </v-app>
</template>

<script>
export default {
  head() {
    return {
      meta: [
        { hid: 'robots', name: 'robots', content: 'index, follow' },
        { hid: 'theme-color', name: 'theme-color', content: '#003f3a' }
      ]
    }
  },
  computed: {
    isFrench() { return this.$store.state.locale !== 'en' },
    copy() {
      return this.isFrench
        ? {
            brandLine: 'Système hospitalier intégré', home: 'Accueil', product: 'Produit',
            deployment: 'Déploiement', security: 'Sécurité', contact: 'Contact', access: 'Accéder',
            footerLine: 'Le dossier patient, les opérations cliniques et le pilotage hospitalier dans un environnement sécurisé.',
            availability: 'Conçu pour fonctionner en réseau contraint'
          }
        : {
            brandLine: 'Integrated hospital system', home: 'Home', product: 'Product',
            deployment: 'Deployment', security: 'Security', contact: 'Contact', access: 'Sign in',
            footerLine: 'Patient records, clinical operations and hospital oversight in one secure environment.',
            availability: 'Designed for constrained networks'
          }
    }
  },
  mounted() {
    const saved = window.localStorage.getItem('camero_health_locale')
    if (saved === 'en' || saved === 'fr') {
      this.$store.commit('SET_LANG', saved)
      this.$i18n.locale = saved
    }
  },
  methods: {
    toggleLanguage() {
      const language = this.isFrench ? 'en' : 'fr'
      this.$store.commit('SET_LANG', language)
      this.$i18n.locale = language
      window.localStorage.setItem('camero_health_locale', language)
    }
  }
}
</script>

<style scoped>
.public-header {
  position: sticky; top: 0; z-index: 50; min-height: 72px;
  display: grid; grid-template-columns: minmax(220px, 1fr) auto minmax(220px, 1fr);
  align-items: center; gap: 22px; padding: 10px clamp(18px, 4vw, 58px);
  border-bottom: 1px solid #d5e3e1; background: rgba(255,255,255,.98);
}
.brand-lockup,.public-nav a,.header-actions a,.footer-links a { text-decoration: none; }
.brand-lockup { display: inline-flex; align-items: center; gap: 11px; color: #073c38; min-width: 0; }
.brand-mark { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid #c8dcd9; background: #f3faf8; }
.brand-mark img { width: 28px; height: 28px; object-fit: contain; }
.brand-copy { display: flex; flex-direction: column; line-height: 1.05; }
.brand-copy strong { font-size: 16px; letter-spacing: 0; }
.brand-copy small { margin-top: 4px; color: #607a77; font-size: 10px; font-weight: 700; }
.public-nav { display: flex; align-items: center; justify-content: center; gap: 2px; }
.public-nav a { padding: 9px 10px; color: #355451; font-size: 12px; font-weight: 800; white-space: nowrap; }
.public-nav a:hover,.public-nav a.nuxt-link-exact-active { color: #006b63; background: #edf7f5; }
.header-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
.language-button,.access-button {
  min-height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  padding: 0 13px; border: 1px solid #c8dcd9; border-radius: 4px;
  font-size: 12px; font-weight: 900; cursor: pointer;
}
.language-button { color: #254c48; background: #fff; }
.access-button { color: #fff !important; background: #006b63; border-color: #006b63; }
.access-button .v-icon { color: #fff !important; }
.public-main { min-height: calc(100vh - 72px); background: #f8fbfa; }
.public-footer { padding: 42px clamp(20px, 5vw, 72px) 18px; color: #d8ece9; background: #073c38; }
.footer-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr .8fr .8fr; gap: 30px; }
.footer-grid strong { color: #fff; font-size: 18px; }
.footer-grid p { max-width: 520px; margin: 9px 0 0; color: #b7d0cd; line-height: 1.6; }
.footer-links { display: flex; flex-direction: column; gap: 8px; }
.footer-links a { color: #d8ece9; font-weight: 700; }
.footer-status { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; font-weight: 700; }
.footer-status span { width: 9px; height: 9px; margin-top: 4px; border-radius: 50%; background: #55d38a; }
.footer-bottom { max-width: 1200px; margin: 30px auto 0; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.15); color: #8fb0ac; font-size: 12px; }
@media (max-width: 1020px) {
  .public-header { grid-template-columns: 1fr auto; }
  .header-actions { grid-column: 2; grid-row: 1; }
  .public-nav { grid-column: 1 / -1; grid-row: 2; justify-content: flex-start; overflow-x: auto; }
}
@media (max-width: 620px) {
  .public-header { display: flex; flex-wrap: wrap; gap: 8px; padding: 9px 14px; }
  .brand-lockup { flex: 1 1 auto; }
  .header-actions { flex: 0 0 auto; }
  .public-nav { order: 3; flex: 1 0 100%; }
  .brand-mark { width: 36px; height: 36px; }
  .brand-copy strong { font-size: 15px; }
  .brand-copy small { display: none; }
  .language-button { width: 40px; padding: 0; }
  .language-button .v-icon { display: none; }
  .access-button { width: 40px; padding: 0; font-size: 0; }
  .access-button .v-icon { font-size: 18px !important; }
  .public-nav { gap: 0; scrollbar-width: none; }
  .public-nav::-webkit-scrollbar { display: none; }
  .public-nav a { padding: 9px 10px; }
  .footer-grid { grid-template-columns: 1fr; }
}
</style>
