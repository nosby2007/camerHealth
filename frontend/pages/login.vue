<template>
  <v-container fluid class="gov-login-bg fill-height d-flex align-center justify-center">
    <v-card flat tile class="gov-card b-1 shadow-md" width="480">

      <!-- Header -->
      <div class="pa-8 bg-primary white--text d-flex align-center">
        <v-avatar tile size="44" class="mr-4">
          <v-img src="/logo.png" contain></v-img>
        </v-avatar>
        <div>
          <div class="text-caption font-weight-black ls-1 uppercase opacity-70">CameroHealth</div>
          <div class="text-h6 font-weight-black ls-tight uppercase">Digitalising Health, Improving Care</div>
        </div>
      </div>

      <div class="pa-10">
        <div class="section-label mb-8">AUTHORIZED PERSONNEL LOGIN</div>

        <v-alert v-if="loginError" dense text type="error" class="mb-6 text-caption font-weight-bold rounded-0">
          {{ loginError }}
        </v-alert>

        <v-form ref="form" v-model="valid" @submit.prevent="login">

          <v-alert v-if="useSupabaseCompatLogin" dense text type="info" class="mb-4 text-caption font-weight-bold rounded-0">
            Transitional login mode: sign in with your Supabase email and password.
          </v-alert>

          <v-text-field
            v-model="form.identity"
            label="Staff ID or Email"
            type="text"
            outlined tile dense required
            :rules="[v => !!v || 'Required']"
            prepend-inner-icon="mdi-badge-account"
            placeholder="e.g. ADM001 or admin@camerohealth.cm"
            class="mb-4 rounded-0"
            autocomplete="username"
          ></v-text-field>

          <v-text-field
            v-model="form.password"
            label="Password"
            :type="showPwd ? 'text' : 'password'"
            :append-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showPwd = !showPwd"
            outlined tile dense required
            :rules="[v => !!v || 'Required']"
            prepend-inner-icon="mdi-lock"
            class="mb-8 rounded-0"
            autocomplete="current-password"
          ></v-text-field>

          <v-btn
            color="#003366" dark block height="56" tile depressed
            type="submit"
            :disabled="!valid" :loading="loading"
            class="font-weight-black text-caption ls-1 mb-4"
          >
            VALIDATE ACCESS &amp; INITIALIZE SESSION
            <v-icon right small>mdi-lock-open-check</v-icon>
          </v-btn>

          <div class="d-flex align-center justify-space-between pt-2">
            <v-btn text small class="grey--text text--darken-1 font-weight-bold text-caption pa-0" @click="$router.push('/')">
              <v-icon left x-small>mdi-arrow-left</v-icon> Access Layer
            </v-btn>
            <v-btn text small color="#003366" class="font-weight-black text-caption pa-0" @click="$router.push('/register')">
              <v-icon left x-small>mdi-hospital-building</v-icon> Register Facility
            </v-btn>
          </div>
        </v-form>
      </div>

      <div class="pa-6 bg-grey lighten-4 text-center border-top">
        <v-icon x-small color="#C0392B" class="mb-1">mdi-shield-lock</v-icon>
        <div class="text-caption font-weight-black grey--text text--darken-1 uppercase ls-1 mb-1">Notice to Authorized Users</div>
        <p class="text-caption grey--text mb-0 font-weight-medium" style="font-size:10px">
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
  head: { title: 'CameroHealth — Authorized Personnel Login' },
  data() {
    return {
      valid: false,
      loading: false,
      showPwd: false,
      form: { identity: '', password: '' }
    }
  },
  computed: {
    loginError() { return this.$store.state.auth.loginError },
    isMinistryLayer() { return this.$route.query.layer === 'ministry' },
    useSupabaseCompatLogin() {
      const flag = this.$config && this.$config.ENABLE_SUPABASE_AUTH
      if (typeof flag === 'boolean') return flag
      if (typeof flag === 'string') return ['1', 'true', 'yes', 'on'].includes(flag.trim().toLowerCase())
      return false
    }
  },
  mounted() {
    this.$store.commit('clinical/LOAD_FROM_STORAGE')
    this.$store.commit('facility/RELOAD_FROM_STORAGE')
    if (this.$store.state.auth.isAuthenticated) {
      this.$router.push(this.roleHome(this.$store.state.auth.role))
    }
  },
  methods: {
    roleHome(role) {
      return {
        ADMIN: '/admin',
        DOCTOR: '/clinical/dashboard',
        NP: '/clinical/dashboard',
        NURSE: '/clinical/patients',
        CNA: '/clinical/nursing',
        MIDWIFE: '/clinical/patients',
        MAJOR_SERVICE: '/clinical/patients',
        NURSING_SUPERVISOR: '/clinical/patients',
        LAB: '/clinical/lab',
        IMAGING: '/clinical/imaging',
        PHARMACY: '/clinical/pharmacy',
        FRONT_DESK: '/clinical/patients',
        RECORDS: '/clinical/patients',
        SOCIAL_WORKER: '/clinical/patients',
        PHYSIOTHERAPIST: '/clinical/patients',
        BILLING: '/clinical/billing'
      }[role] || '/clinical/dashboard'
    },
    async login() {
      if (!this.$refs.form.validate()) return
      this.loading = true

      const success = await this.$store.dispatch('auth/login', {
        email: this.form.identity,
        staffId: this.form.identity,
        loginInput: this.form.identity,
        password: this.form.password
      })

      this.loading = false
      if (success) {
        this.$router.push(this.roleHome(this.$store.state.auth.role))
      }
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
.gov-card { background-color: white !important; border-radius: 0 !important; }
.bg-primary { background-color: #003366 !important; }
.b-1 { border: 1px solid #E2E8F0 !important; }
.border-top { border-top: 1px solid #E2E8F0; }
.shadow-md { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important; }
.ls-tight { letter-spacing: -0.8px; }
.ls-1 { letter-spacing: 1px; }
.uppercase { text-transform: uppercase; }
.opacity-70 { opacity: 0.7; }
.section-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #003366;
  border-left: 4px solid #00A99D;
  padding-left: 10px;
}
</style>
