
<template>
  <v-container fluid class="gov-login-bg fill-height d-flex align-center justify-center">
    <v-card flat tile class="gov-card b-1 shadow-md" width="680">

      <!-- Header -->
      <div class="pa-8 bg-primary white--text d-flex align-center">
        <v-avatar tile size="44" class="mr-4">
          <v-img src="/logo.png" contain></v-img>
        </v-avatar>
        <div>
          <div class="text-caption font-weight-black ls-1 uppercase opacity-70">REPUBLIC OF CAMEROON — MINSANTE</div>
          <div class="text-h6 font-weight-black ls-tight uppercase">New Facility Registration</div>
        </div>
      </div>

      <div class="pa-10">
        <v-alert dense text type="info" color="#0B3D2E" class="mb-8 text-caption font-weight-bold rounded-0">
          This form is completed <strong>once</strong> by the clinic director. It creates the facility record
          and the administrator account. Keep your credentials safe — they cannot be recovered.
        </v-alert>

        <v-form ref="form" v-model="valid">

          <!-- ── Section 1: Facility Information ── -->
          <div class="section-label mb-4">FACILITY INFORMATION</div>

          <v-text-field
            v-model="facility.name"
            label="Official Facility Name"
            outlined tile dense required
            :rules="[required]"
            class="mb-4 rounded-0"
          ></v-text-field>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                v-model="facility.region"
                :items="regions"
                label="Region"
                outlined tile dense required
                :rules="[required]"
                class="mb-4 rounded-0"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="facility.city"
                label="City / Town"
                outlined tile dense required
                :rules="[required]"
                class="mb-4 rounded-0"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-text-field
            v-model="facility.quarter"
            label="Street / Quarter / Neighbourhood"
            outlined tile dense required
            :rules="[required]"
            class="mb-4 rounded-0"
          ></v-text-field>

          <v-text-field
            v-model="facility.email"
            label="Official Facility Email"
            type="email"
            outlined tile dense required
            :rules="[required, emailRule]"
            class="mb-8 rounded-0"
          ></v-text-field>

          <!-- ── Section 2: Administrator Account ── -->
          <div class="section-label mb-4">ADMINISTRATOR ACCOUNT</div>

          <v-row dense>
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="admin.fullName"
                label="Administrator Full Name"
                outlined tile dense required
                :rules="[required]"
                class="mb-4 rounded-0"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="admin.staffId"
                label="Admin Staff ID"
                outlined tile dense required
                :rules="[required, idRule]"
                hint="e.g. ADM-001"
                persistent-hint
                class="mb-4 rounded-0"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-text-field
            v-model="admin.email"
            label="Administrator Email"
            type="email"
            outlined tile dense required
            :rules="[required, emailRule]"
            class="mb-4 rounded-0"
          ></v-text-field>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="admin.password"
                label="Admin Password"
                :type="showPwd ? 'text' : 'password'"
                :append-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="showPwd = !showPwd"
                outlined tile dense required
                :rules="[required, pwdRule]"
                hint="Min 8 chars, at least 1 number"
                persistent-hint
                class="mb-4 rounded-0"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="admin.confirmPassword"
                label="Confirm Password"
                :type="showPwd ? 'text' : 'password'"
                outlined tile dense required
                :rules="[required, v => v === admin.password || 'Passwords do not match']"
                class="mb-4 rounded-0"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-divider class="my-8 grey lighten-3"></v-divider>

          <v-btn
            color="#0B3D2E" dark block height="56" tile depressed
            :disabled="!valid" :loading="loading"
            @click="register"
            class="font-weight-black text-caption ls-1"
          >
            REGISTER FACILITY & CREATE ADMIN ACCOUNT
            <v-icon right small>mdi-hospital-building</v-icon>
          </v-btn>
        </v-form>
      </div>

      <div class="pa-6 bg-grey lighten-4 text-center border-top">
        <v-icon x-small color="#C0392B" class="mb-1">mdi-shield-lock</v-icon>
        <p class="text-caption grey--text mb-0 font-weight-medium" style="font-size:10px">
          All credentials are hashed and stored locally. This system is restricted to authorized MINSANTE personnel.
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
      facility: { name: '', region: 'Centre', city: '', quarter: '', email: '' },
      admin: { fullName: '', staffId: '', email: '', password: '', confirmPassword: '' },
      regions: ['Far North', 'North', 'Adamawa', 'Centre', 'South', 'East', 'West', 'Littoral', 'South-West', 'North-West'],
      required:  v => !!v || 'This field is required',
      emailRule: v => /.+@.+\..+/.test(v) || 'Enter a valid email',
      idRule:    v => /^[A-Za-z0-9\-]+$/.test(v) || 'Only letters, numbers and hyphens',
      pwdRule:   v => (v && v.length >= 8 && /\d/.test(v)) || 'Min 8 characters including at least 1 number'
    }
  },
  mounted() {
    // If already set up, redirect to login
    if (this.$store.state.facility.setupComplete) this.$router.push('/login')
  },
  methods: {
    async register() {
      if (!this.$refs.form.validate()) return
      this.loading = true
      try {
        await this.$store.dispatch('facility/registerFacility', {
          facility: this.facility,
          admin: this.admin
        })
        this.$toast.success('Facility registered. Please log in with your admin credentials.')
        this.$router.push('/login')
      } catch (err) {
        this.$toast.error('Registration failed. Please try again.')
      } finally {
        this.loading = false
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
