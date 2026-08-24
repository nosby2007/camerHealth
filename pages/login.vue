
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

          <!-- Role selector -->
          <div v-if="!useSupabaseCompatLogin" class="text-caption font-weight-black grey--text mb-3 uppercase ls-1">Select Your Role</div>
          <v-row v-if="!useSupabaseCompatLogin" dense class="mb-2">
            <v-col v-for="r in visibleRoles" :key="r.value" cols="6" sm="4">
              <v-card
                flat tile
                :class="['role-chip pa-3 text-center b-1', form.role === r.value ? 'role-chip--active' : '']"
                @click="form.role = r.value"
                style="cursor:pointer"
              >
                <v-icon :color="form.role === r.value ? 'white' : '#003366'" small>{{ r.icon }}</v-icon>
                <div class="text-caption font-weight-black mt-1 uppercase" style="font-size:9px; letter-spacing:0.5px">{{ r.label }}</div>
              </v-card>
            </v-col>
          </v-row>

          <div
            v-if="!useSupabaseCompatLogin && rolePageCount > 1"
            class="role-pagination mb-6"
          >
            <v-btn
              text small
              color="#003366"
              class="role-page-btn font-weight-black"
              :disabled="rolePage === 0"
              aria-label="Previous roles"
              @click="previousRolePage"
            >
              <v-icon left small>mdi-chevron-left</v-icon>
              Previous
            </v-btn>
            <span class="role-page-status" aria-live="polite">
              {{ rolePage + 1 }} / {{ rolePageCount }}
            </span>
            <v-btn
              text small
              color="#003366"
              class="role-page-btn font-weight-black"
              :disabled="rolePage >= rolePageCount - 1"
              aria-label="Next roles"
              @click="nextRolePage"
            >
              Next
              <v-icon right small>mdi-chevron-right</v-icon>
            </v-btn>
          </div>

          <v-alert v-if="useSupabaseCompatLogin" dense text type="info" class="mb-4 text-caption font-weight-bold rounded-0">
            Transitional login mode: sign in with your Supabase email and password.
          </v-alert>

          <v-text-field
            v-model="form.identity"
            :label="useSupabaseCompatLogin ? 'Email' : 'Staff ID'"
            :type="useSupabaseCompatLogin ? 'email' : 'text'"
            outlined tile dense required
            :rules="[v => !!v || 'Required']"
            :prepend-inner-icon="useSupabaseCompatLogin ? 'mdi-email' : 'mdi-badge-account'"
            class="mb-4 rounded-0"
            :autocomplete="useSupabaseCompatLogin ? 'email' : 'username'"
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
            :disabled="!valid || loginDisabled" :loading="loading"
            class="font-weight-black text-caption ls-1"
          >
            VALIDATE ACCESS & INITIALIZE SESSION
            <v-icon right small>mdi-lock-open-check</v-icon>
          </v-btn>
          <v-btn text block small class="mt-4 grey--text font-weight-bold uppercase" @click="$router.push('/')">
            <v-icon left x-small>mdi-arrow-left</v-icon> Back to Layer Selection
          </v-btn>
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
  data() {
    return {
      valid: false,
      loading: false,
      showPwd: false,
      rolePage: 0,
      rolesPerPage: 12,
      form: { identity: '', password: '', role: null },
      roles: [
        { value: 'ADMIN',   label: 'Admin',   icon: 'mdi-shield-account' },
        { value: 'DOCTOR',  label: 'Doctor',  icon: 'mdi-doctor'          },
        { value: 'NP',      label: 'NP',      icon: 'mdi-stethoscope'     },
        { value: 'NURSE',   label: 'Nurse',   icon: 'mdi-medical-bag'     },
        { value: 'MIDWIFE', label: 'Midwife', icon: 'mdi-baby-face-outline' },
        { value: 'MAJOR_SERVICE', label: 'Major', icon: 'mdi-account-star' },
        { value: 'NURSING_SUPERVISOR', label: 'Supervisor', icon: 'mdi-account-supervisor' },
        { value: 'LAB',     label: 'Lab',     icon: 'mdi-flask'           },
        { value: 'PHARMACY', label: 'Pharmacy', icon: 'mdi-pill'          },
        { value: 'FRONT_DESK', label: 'Reception', icon: 'mdi-desk'       },
        { value: 'IMAGING', label: 'Imaging', icon: 'mdi-radiology-box'   },
        { value: 'BILLING', label: 'Cash Office', icon: 'mdi-cash-register' },
        { value: 'CNA', label: 'Care Assistant', icon: 'mdi-account-heart' },
        { value: 'RECORDS', label: 'Medical Records', icon: 'mdi-archive' },
        { value: 'SOCIAL_WORKER', label: 'Social Worker', icon: 'mdi-hand-heart' },
        { value: 'PHYSIOTHERAPIST', label: 'Physio', icon: 'mdi-human-wheelchair' }
      ]
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
    },
    loginDisabled() {
      if (this.useSupabaseCompatLogin) return false
      return !this.form.role
    },
    rolePageCount() {
      return Math.ceil(this.roles.length / this.rolesPerPage)
    },
    visibleRoles() {
      const start = this.rolePage * this.rolesPerPage
      return this.roles.slice(start, start + this.rolesPerPage)
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
    previousRolePage() {
      this.rolePage = Math.max(0, this.rolePage - 1)
    },
    nextRolePage() {
      this.rolePage = Math.min(this.rolePageCount - 1, this.rolePage + 1)
    },
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
      if (!this.$refs.form.validate() || this.loginDisabled) return
      this.loading = true

      let success = false

      // Transitional auth cutover path:
      // - ENABLE_SUPABASE_AUTH=false keeps prototype login unchanged.
      // - ENABLE_SUPABASE_AUTH=true enables Supabase compatibility sign-in.
      if (this.useSupabaseCompatLogin) {
        success = await this.$store.dispatch('auth/loginWithSupabaseCompat', {
          email: this.form.identity,
          password: this.form.password
        })
      } else {
        success = await this.$store.dispatch('auth/login', {
          staffId: this.form.identity,
          password: this.form.password,
          role: this.form.role
        })
      }

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
.role-chip {
  min-height: 74px;
  background: white !important;
  border: 1px solid #E2E8F0 !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.role-chip:hover { border-color: #003366 !important; background: #F8FAFC !important; }
.role-chip--active { background: #003366 !important; border-color: #003366 !important; color: white !important; }
.role-chip--active:hover { background: #003366 !important; }
.role-chip--active .text-caption { color: white !important; }
.role-pagination {
  min-height: 32px;
  display: grid;
  grid-template-columns: minmax(96px, 1fr) auto minmax(96px, 1fr);
  align-items: center;
  gap: 8px;
}
.role-page-btn {
  min-width: 96px !important;
  font-size: 10px !important;
  letter-spacing: 0.5px;
}
.role-page-btn:first-child { justify-self: start; }
.role-page-btn:last-child { justify-self: end; }
.role-page-status {
  color: #64748B;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}
</style>
