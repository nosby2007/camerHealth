
<template>
  <v-container fluid class="gov-login-bg fill-height d-flex align-center justify-center">
    <v-card flat tile class="gov-card b-1 shadow-md" width="480">

      <!-- Header -->
      <div class="pa-8 bg-primary white--text d-flex align-center">
        <v-avatar tile size="44" class="mr-4">
          <v-img src="/logo.png" contain></v-img>
        </v-avatar>
        <div>
          <div class="text-caption font-weight-black ls-1 uppercase opacity-70">REPUBLIC OF CAMEROON</div>
          <div class="text-h6 font-weight-black ls-tight uppercase">Health Intelligence Gateway</div>
        </div>
      </div>

      <div class="pa-10">
        <div class="section-label mb-8">AUTHORIZED PERSONNEL LOGIN</div>

        <v-alert v-if="loginError" dense text type="error" class="mb-6 text-caption font-weight-bold rounded-0">
          {{ loginError }}
        </v-alert>

        <v-form ref="form" v-model="valid" @submit.prevent="login">

          <!-- Role selector -->
          <div class="text-caption font-weight-black grey--text mb-3 uppercase ls-1">Select Your Role</div>
          <v-row dense class="mb-6">
            <v-col v-for="r in roles" :key="r.value" cols="6" sm="4">
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

          <v-text-field
            v-model="form.staffId"
            label="Staff ID"
            outlined tile dense required
            :rules="[v => !!v || 'Required']"
            prepend-inner-icon="mdi-badge-account"
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
            :disabled="!valid || !form.role" :loading="loading"
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
        <p class="text-caption grey--text mb-0 font-weight-medium" style="font-size:10px">
          This NIHIS infrastructure is restricted to authorized personnel.
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
      form: { staffId: '', password: '', role: null },
      roles: [
        { value: 'ADMIN',   label: 'Admin',   icon: 'mdi-shield-account' },
        { value: 'DOCTOR',  label: 'Doctor',  icon: 'mdi-doctor'          },
        { value: 'NURSE',   label: 'Nurse',   icon: 'mdi-medical-bag'     },
        { value: 'LAB',     label: 'Lab',     icon: 'mdi-flask'           },
        { value: 'IMAGING', label: 'Imaging', icon: 'mdi-radiology-box'   }
      ]
    }
  },
  computed: {
    loginError() { return this.$store.state.auth.loginError },
    isMinistryLayer() { return this.$route.query.layer === 'ministry' }
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
      return { ADMIN: '/admin', DOCTOR: '/clinical/dashboard', NURSE: '/clinical/dashboard', LAB: '/clinical/lab', IMAGING: '/clinical/imaging' }[role] || '/clinical/dashboard'
    },
    async login() {
      if (!this.$refs.form.validate() || !this.form.role) return
      this.loading = true
      const success = await this.$store.dispatch('auth/login', {
        staffId:  this.form.staffId,
        password: this.form.password,
        role:     this.form.role
      })
      this.loading = false
      if (success) {
        this.$router.push(this.roleHome(this.form.role))
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
  background: white !important;
  border: 1px solid #E2E8F0 !important;
  transition: all 0.15s ease;
}
.role-chip:hover { border-color: #003366 !important; background: #F8FAFC !important; }
.role-chip--active { background: #003366 !important; border-color: #003366 !important; color: white !important; }
.role-chip--active .text-caption { color: white !important; }
</style>
