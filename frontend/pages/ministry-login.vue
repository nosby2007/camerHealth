
<template>
  <v-container fluid class="gov-login-bg fill-height d-flex align-center justify-center">
    <v-card flat tile class="gov-login-card b-1 shadow-md" width="550">

      <!-- Institutional Branding Header -->
      <div class="pa-8 bg-primary white--text d-flex align-center shadow-sm">
        <v-avatar tile size="44" class="mr-4">
          <v-img src="/logo.png" contain></v-img>
        </v-avatar>
        <div>
          <div class="text-caption font-weight-black ls-1 uppercase opacity-70">CameroHealth</div>
          <div class="text-h6 font-weight-black ls-tight uppercase">Digitalising Health, Improving Care</div>
        </div>
      </div>

      <div class="pa-10">
        <v-window v-model="step">

          <!-- Step 1: Role Selection -->
          <v-window-item :value="1">
            <h1 class="text-subtitle-1 font-weight-black gov-text-primary mb-8 uppercase text-center ls-1">
              HEALTH OFFICER ACCESS — SELECT ROLE
            </h1>
            <v-row>
              <v-col cols="12" sm="6">
                <v-card flat tile outlined class="pa-8 text-center gov-role-option shadow-sm" @click="selectRole('PUBLIC_HEALTH_OFFICER')">
                  <v-icon x-large color="#003366">mdi-account-tie</v-icon>
                  <div class="text-caption font-weight-black mt-4 gov-text-primary uppercase ls-1">PUBLIC HEALTH OFFICER</div>
                  <div class="grey--text x-small font-italic mt-1 uppercase">National Surveillance</div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6">
                <v-card flat tile outlined class="pa-8 text-center gov-role-option shadow-sm" @click="selectRole('EPIDEMIOLOGIST')">
                  <v-icon x-large color="#003366">mdi-chart-line</v-icon>
                  <div class="text-caption font-weight-black mt-4 gov-text-primary uppercase ls-1">EPIDEMIOLOGIST</div>
                  <div class="grey--text x-small font-italic mt-1 uppercase">Data & Analytics</div>
                </v-card>
              </v-col>
            </v-row>
            <v-btn text block small class="mt-8 grey--text font-weight-bold uppercase opacity-60" @click="$router.push('/')">
              <v-icon left x-small>mdi-arrow-left</v-icon> Back to Layer Selection
            </v-btn>
          </v-window-item>

          <!-- Step 2: Credentials -->
          <v-window-item :value="2">
            <h2 class="text-subtitle-2 font-weight-black gov-text-primary mb-6 uppercase ls-1 border-left px-4">
              MINISTRY CREDENTIALS
            </h2>

            <v-form ref="form" v-model="valid">
              <v-text-field v-model="form.fullName"    label="Authorized Full Name"         outlined tile dense required class="rounded-0 mb-4"></v-text-field>
              <v-text-field v-model="form.email"       label="Institutional Email"           outlined tile dense required class="rounded-0 mb-4"></v-text-field>
              <v-text-field v-model="form.staffId"     label="Official Staff ID"             outlined tile dense required class="rounded-0 mb-4"></v-text-field>
              <v-text-field v-model="form.institution" label="Institution (e.g. MINSANTE)"   outlined tile dense required class="rounded-0 mb-4"></v-text-field>
              <v-select     v-model="form.region"      :items="regions" label="Jurisdictional Region" outlined tile dense class="rounded-0 mb-4"></v-select>
              <v-text-field v-model="form.password"    label="System Access Key" type="password" outlined tile dense required class="mb-10 rounded-0"></v-text-field>

              <v-btn color="#003366" dark block height="56" tile depressed @click="finalizeLogin" class="font-weight-black text-caption ls-1">
                VALIDATE ACCESS & INITIALIZE SESSION
                <v-icon right small>mdi-lock-open-check</v-icon>
              </v-btn>

              <v-btn text block small class="mt-4 grey--text font-weight-bold uppercase opacity-60" @click="step = 1">
                Back to Role Selection
              </v-btn>
            </v-form>
          </v-window-item>

        </v-window>
      </div>

      <div class="pa-6 bg-grey lighten-4 text-center border-top">
        <v-icon x-small color="#C0392B" class="mb-1">mdi-shield-lock</v-icon>
        <div class="text-caption font-weight-black grey--text text--darken-1 uppercase ls-1 mb-1">Notice to Authorized Users</div>
        <p class="text-caption grey--text mb-0 opacity-60 font-weight-medium" style="font-size: 10px !important;">
          This CameroHealth infrastructure is restricted to authorized Ministerial Personnel or Hospital Personnel.
          All sessions are audited under National Health Security Protocol.
        </p>
      </div>
    </v-card>
  </v-container>
</template>

<script>
export default {
  layout: 'login-layout',
  data() {
    return {
      step: 1,
      valid: false,
      form: { role: null, fullName: '', email: '', staffId: '', institution: 'MINSANTE', region: 'Centre', password: '' },
      regions: ['Far North', 'North', 'Adamawa', 'Centre', 'South', 'East', 'West', 'Littoral', 'South-West', 'North-West']
    }
  },
  mounted() {
    // If already authenticated as ministry, go straight to dashboard
    if (this.$store.state.auth.isAuthenticated && this.$store.state.auth.role === 'PUBLIC_HEALTH_OFFICER') {
      this.$router.push('/ministry')
    }
  },
  methods: {
    selectRole(role) {
      this.form.role = role
      this.step = 2
    },
    finalizeLogin() {
      const user = {
        username:   this.form.fullName,
        email:      this.form.email,
        first_name: this.form.fullName.split(' ')[0],
        last_name:  this.form.fullName.split(' ')[1] || ''
      }
      this.$store.commit('auth/set', user)
      this.$store.commit('auth/setUserRole', {
        role:        this.form.role,
        staffId:     this.form.staffId,
        institution: this.form.institution,
        region:      this.form.region
      })
      this.$router.push('/ministry')
    }
  }
}
</script>

<style scoped>
.gov-login-bg {
  background-color: #F5F7F6 !important;
  background-image: radial-gradient(#E2E8F0 1px, transparent 1px);
  background-size: 20px 20px;
}
.gov-login-card { border: 1px solid #E2E8F0 !important; background-color: white !important; border-radius: 0px !important; }
.bg-primary { background-color: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.border-left { border-left: 4px solid #00A99D; }
.border-top { border-top: 1px solid #E2E8F0; }
.gov-role-option { cursor: pointer; transition: all 0.2s ease; border: 1px solid #E2E8F0; }
.gov-role-option:hover { background: #F8FAFC; border-color: #003366; }
.x-small { font-size: 9px; line-height: 1.1; }
.ls-1 { letter-spacing: 1px; }
.ls-tight { letter-spacing: -0.8px; }
.uppercase { text-transform: uppercase; }
.opacity-70 { opacity: 0.7; }
.opacity-60 { opacity: 0.6; }
.shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important; }
.shadow-md { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important; }
</style>
