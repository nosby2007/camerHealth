
<template>
  <v-app id="camerohealth-gov">
    <!-- Health Infrastructure Sidebar (Forest Green) -->
    <v-navigation-drawer v-model="drawer" fixed app floating width="280" color="#00A99D" dark class="gov-sidebar">
      <div class="pa-6 d-flex align-center">
        <v-avatar tile size="32" class="mr-3">
          <v-img src="/logo.png" contain></v-img>
        </v-avatar>
        <div class="line-height-1">
          <div class="text-caption font-weight-black grey--text text--lighten-1 ls-1 uppercase">CameroHealth</div>
          <div class="text-subtitle-2 font-weight-black white--text uppercase ls-tight">Digitalising Health, Improving Care</div>
        </div>
      </div>

      <v-divider class="mx-4 opacity-10"></v-divider>

      <v-list nav flat class="mt-4 px-2">
        <template v-for="(item, i) in filteredNavItems">
          <v-list-item :key="'item-'+i" :to="item.to" router exact active-class="gov-active-item">
            <v-list-item-icon><v-icon>{{ item.icon }}</v-icon></v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="font-weight-medium uppercase">{{ item.titleKey.includes('menu') ? $t(item.titleKey) : item.titleKey }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
           <v-btn block text color="grey lighten-1 " @click="logout" class="justify-start px-2 font-weight-bold">
              <v-icon left>mdi-logout-variant</v-icon>{{ $t("logout") }}
           </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Hospital-Grade App Bar -->
    <v-app-bar flat fixed app color="white" height="72" class="gov-navbar b-bottom">
      <v-btn icon aria-label="Toggle navigation" title="Toggle navigation" @click.stop="drawer = !drawer" class="gov-nav-toggle mr-2">
         <v-icon class="gov-navbar-icon">mdi-menu-open</v-icon>
      </v-btn>

      <div class="ml-4 d-none d-md-flex flex-column">
        <span class="text-caption font-weight-black grey--text text--darken-1 mb-n1 mt-1">CameroHealth - {{ isClinical ? 'Clinical Layer' : 'National Health Statistics' }}</span>
        <span class="text-subtitle-2 font-weight-bold gov-primary--text">
          {{ isClinical ? institution : 'Ministry of Public Health - Surveillance Portal' }}
        </span>
      </div>
      
      <v-spacer />

      <!-- Language Selector (CRITICAL UPDATE) -->
      <v-menu offset-y transition="slide-y-transition" tile>
        <template v-slot:activator="{ on }">
          <v-btn text class="mr-4 px-4 font-weight-black text-caption ls-1 gov-primary--text" v-on="on">
            <v-icon left small>mdi-translate</v-icon>
            {{ currentLangName }}
          </v-btn>
        </template>
        <v-list dense tile class="pa-0 b-1">
           <v-list-item @click="setLang('en')" class="py-2">
              <v-list-item-title class="font-weight-bold text-caption">ENGLISH</v-list-item-title>
           </v-list-item>
           <v-list-item @click="setLang('fr')" class="py-2">
              <v-list-item-title class="font-weight-bold text-caption">FRANÇAIS</v-list-item-title>
           </v-list-item>
        </v-list>
      </v-menu>

      <v-divider vertical class="mx-2 my-4 grey lighten-3"></v-divider>

      <v-menu offset-y transition="slide-y-transition">
        <template v-slot:activator="{ on }">
          <v-btn text class="gov-session-trigger pa-2" v-on="on">
            <div class="text-right mr-3 d-none d-sm-block">
              <div class="text-caption font-weight-black grey--text mb-n1 uppercase">SESSION: {{ isClinical ? 'STAFF' : 'OFFICER' }}</div>
              <div class="text-body-2 font-weight-black gov-primary--text">{{ displayName }}</div>
            </div>
            <v-avatar size="40" color="#F5F7F6" class="b-1 gov-session-avatar">
              <v-icon class="gov-navbar-icon">mdi-account-circle</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-list dense tile class="pa-0 b-1 shadow-sm">
           <v-list-item class="bg-grey lighten-4 py-2 border-bottom">
              <v-list-item-content>
                 <v-list-item-title class="font-weight-black text-caption">{{ institution }}</v-list-item-title>
                 <v-list-item-subtitle class="text-caption">STAFF ID: {{ $store.state.auth.staffId }}</v-list-item-subtitle>
                 <v-list-item-subtitle v-if="userRole !== 'ADMIN' && userDepartment" class="text-caption font-weight-bold teal--text text--darken-2">DEPT: {{ userDepartment }} | WARD: {{ userWard }}</v-list-item-subtitle>
              </v-list-item-content>
           </v-list-item>
           <v-list-item @click="logout" class="py-2">
              <v-list-item-icon class="mr-2"><v-icon small color="error">mdi-power</v-icon></v-list-item-icon>
              <v-list-item-title class="font-weight-bold text-caption error--text">TERMINATE AUTH SESSION</v-list-item-title>
           </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main class="gov-main-bg">
      <!-- Mission-Critical Alert Banner -->
      <v-alert v-if="criticalAlert" tile :type="criticalAlert.type" color="#00A99D" dark class="ma-0 font-weight-black text-caption px-10 gov-alert">
         <v-icon left small>mdi-bullhorn-variant</v-icon>{{ criticalAlert.message }}
         <template v-slot:append>
            <v-btn x-small text class="font-weight-black ml-4" @click="criticalAlert = null">DISMISS</v-btn>
         </template>
      </v-alert>

      <div class="gov-content-wrapper">
        <nuxt />
      </div>
    </v-main>
  </v-app>
</template>

<script>
import { mapActions } from "vuex";

export default {
  head() {
    return { meta: [{ hid: 'robots', name: 'robots', content: 'noindex, nofollow' }] }
  },
  data() {
    return {
      drawer: true,
      criticalAlert: null,
      navItems: [
        // ── National Health Statistics ──
        { icon: 'mdi-view-dashboard',   titleKey: 'menu.dashboard',   to: '/ministry',              roles: ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'] },
        { icon: 'mdi-shield-search',    titleKey: 'menu.surveillance', to: '/surveillance',          roles: ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'] },
        { icon: 'mdi-map',              titleKey: 'menu.map',          to: '/maps',                  roles: ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'] },
        { icon: 'mdi-file-chart',       titleKey: 'menu.reports',      to: '/reports',               roles: ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'] },
        // ── Admin Layer ──
        { icon: 'mdi-shield-account',   titleKey: 'Admin Dashboard',   to: '/admin',                 roles: ['ADMIN'] },
        { icon: 'mdi-account-multiple', titleKey: 'Staff Accounts',    to: '/admin/staff',           roles: ['ADMIN'] },
        { icon: 'mdi-history',          titleKey: 'Audit Log',         to: '/admin/audit',           roles: ['ADMIN'] },
        { icon: 'mdi-shield-crown',     titleKey: 'Super Admin',       to: '/super-admin',           roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN'] },
        { icon: 'mdi-account-plus',     titleKey: 'Sales Pipeline',    to: '/super-admin/pipeline',  roles: ['SUPER_ADMIN', 'SALES'] },
        { icon: 'mdi-account-supervisor-circle', titleKey: 'Team Access', to: '/super-admin/team',   roles: ['SUPER_ADMIN'] },
        { icon: 'mdi-file-chart-check', titleKey: 'Submit RMA',        to: '/admin/rma',              roles: ['ADMIN'] },
        { icon: 'mdi-monitor-dashboard', titleKey: 'EMR Command Center', to: '/clinical/patients', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'LAB', 'IMAGING', 'PHARMACY', 'RECORDS', 'FRONT_DESK', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST'] },
        // ── Patient Modules ──
        { icon: 'mdi-account-group',    titleKey: 'Patient Listing',   to: '/clinical/patients',     roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'RECORDS', 'FRONT_DESK'] },
        { icon: 'mdi-account-plus',     titleKey: 'New Patient',       to: '/clinical/patients/new', roles: ['ADMIN', 'NURSE', 'MIDWIFE', 'FRONT_DESK'] },
        { icon: 'mdi-clipboard-list',   titleKey: 'Outpatient',        to: '/clinical/visits',       roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'] },
        { icon: 'mdi-bed',               titleKey: 'Inpatient',         to: '/clinical/inpatient',    roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'] },
        { icon: 'mdi-calendar-clock',   titleKey: 'Appointments',      to: '/clinical/appointments', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'FRONT_DESK'] },
        { icon: 'mdi-pill',             titleKey: 'Medications',       to: '/clinical/medications',  roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'PHARMACY'] },
        { icon: 'mdi-printer-check',    titleKey: 'Report Center',     to: '/clinical/report-center', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'RECORDS'] },
        { icon: 'mdi-file-export',      titleKey: 'menu.field_input',  to: '/clinical/reports',      roles: ['ADMIN'] },
        // ── Lab & Imaging ──
        { icon: 'mdi-flask',            titleKey: 'Laboratory',        to: '/clinical/lab',          roles: ['LAB', 'ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE'] },
        { icon: 'mdi-radiology-box',    titleKey: 'Imaging',           to: '/clinical/imaging',      roles: ['IMAGING', 'ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE'] },
        { icon: 'mdi-cash-register',    titleKey: 'Cash Office',       to: '/clinical/billing',      roles: ['BILLING', 'ADMIN'] },
        { icon: 'mdi-format-list-bulleted', titleKey: 'Price List',      to: '/clinical/catalog',      roles: ['BILLING', 'ADMIN'] },
        { icon: 'mdi-tag-multiple',      titleKey: 'Price Catalog',     to: '/admin/tarification',    roles: ['ADMIN'] }
      ]
    };
  },
  mounted() {
    const savedLocale = window.localStorage.getItem('camero_health_locale')
    if (savedLocale === 'en' || savedLocale === 'fr') this.setLang(savedLocale, false)
    this.$store.commit('clinical/LOAD_FROM_STORAGE');
    this.$store.commit('facility/RELOAD_FROM_STORAGE');
    if (this.isMinistry) {
      setTimeout(() => {
        const infectious = this.$store.getters['clinical/infectiousAlerts'];
        if (infectious.length > 0) {
          this.criticalAlert = { type: 'error', message: `CRITICAL ALERT: ${infectious[0].title.toUpperCase()} PROTOCOL ACTIVE` };
        }
      }, 2000);
    }
  },
  methods: {
    ...mapActions("auth", ["logout"]),
    setLang(lang, notify = true) {
      this.$store.commit('SET_LANG', lang);
      this.$i18n.locale = lang;
      window.localStorage.setItem('camero_health_locale', lang);
      if (notify) this.$toast.success(lang === 'fr' ? 'Langue changée en Français' : 'Language set to English');
    }
  },
  computed: {
    admin() { return this.$store.state.auth.user; },
    displayName() { return this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Authorized User'; },
    userRole() { return this.$store.state.auth.role || 'GUEST'; },
    institution() { return this.$store.state.auth.institution; },
    userDepartment() {
      if (this.$store.state.auth.department) return this.$store.state.auth.department
      const staffCtx = this.$store.getters['facility/getStaffContext'] ? this.$store.getters['facility/getStaffContext'](this.$store.state.auth.staffId) : null
      if (staffCtx && staffCtx.department) return staffCtx.department
      if (staffCtx && staffCtx.departmentRecord) return staffCtx.departmentRecord.name
      return ''
    },
    userWard() {
      if (this.$store.state.auth.service) return this.$store.state.auth.service
      const staffCtx = this.$store.getters['facility/getStaffContext'] ? this.$store.getters['facility/getStaffContext'](this.$store.state.auth.staffId) : null
      if (staffCtx && (staffCtx.service || staffCtx.ward)) return staffCtx.service || staffCtx.ward
      if (staffCtx && staffCtx.serviceRecord) return staffCtx.serviceRecord.name
      return ''
    },
    isClinical() { return ['ADMIN','DOCTOR','NP','NURSE','CNA','MIDWIFE','MAJOR_SERVICE','NURSING_SUPERVISOR','LAB','IMAGING','PHARMACY','BILLING','RECORDS','FRONT_DESK','SOCIAL_WORKER','PHYSIOTHERAPIST'].includes(this.userRole); },
    isMinistry() { return ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'].includes(this.userRole); },
    currentLangName() { return this.$store.state.locale === 'fr' ? 'FRANÇAIS' : 'ENGLISH'; },
    filteredNavItems() { return this.navItems.filter(item => item.roles.includes(this.userRole)); }
  }
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
html { font-size: 17px !important; }
html, body { font-family: 'Inter', sans-serif !important; background: #F5F7F6 !important; }
.gov-sidebar {
  border-right: none !important;
  .gov-active-item { background: #003366 !important; color: white !important; font-weight: 900; margin: 0 12px; }
  .v-list-item { margin: 4px 12px; border-radius: 4px !important; }
}
.gov-navbar { box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important; z-index: 100; }
.gov-navbar .v-toolbar__content { align-items: center; padding: 0 16px !important; }
.gov-nav-toggle { width: 44px !important; height: 44px !important; flex: 0 0 44px; }
.gov-session-trigger { min-height: 52px !important; height: 52px !important; }
.gov-session-avatar { flex: 0 0 40px; }
.gov-navbar-icon { color: #003366 !important; opacity: 1 !important; }
.gov-main-bg { background-color: #F5F7F6 !important; }
.gov-content-wrapper { padding: 0; min-height: calc(100vh - 72px); }
.gov-primary--text { color: #003366 !important; }
.b-bottom { border-bottom: 1px solid #E5E7EB !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.line-height-1 { line-height: 1.1; }
.opacity-10 { opacity: 0.1; }
.opacity-60 { opacity: 0.6; }
.v-application { font-family: 'Inter', sans-serif !important; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
</style>
