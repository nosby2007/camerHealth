
<template>
  <v-container fluid class="gov-login-bg fill-height d-flex align-center justify-center">
    <v-card flat tile class="gov-card b-1 shadow-md" width="680">

      <!-- Header -->
      <div class="pa-8 bg-primary white--text d-flex align-center">
        <v-avatar tile size="44" class="mr-4">
          <v-img src="/logo.png" contain></v-img>
        </v-avatar>
        <div>
          <div class="text-caption font-weight-black ls-1 uppercase opacity-70">CameroHealth</div>
          <div class="text-h6 font-weight-black ls-tight uppercase">New Facility Registration</div>
        </div>
      </div>

      <div class="pa-10">
        <v-alert dense text type="info" color="#0B3D2E" class="mb-4 text-caption font-weight-bold rounded-0">
          This form is completed <strong>once</strong> by the clinic director. It creates the facility record
          and the administrator account. The system will generate the admin's Staff ID and email automatically.
        </v-alert>

        <v-alert v-if="useSupabaseFacilityRegistration" dense text type="warning" class="mb-8 text-caption font-weight-bold rounded-0">
          Supabase Auth compatibility mode is enabled. This registration path creates the admin Auth account first,
          then attempts backend-backed facility and staff profile creation without storing Supabase tokens in localStorage.
        </v-alert>

        <v-alert v-if="registrationError" dense text type="error" class="mb-8 text-caption font-weight-bold rounded-0">
          {{ registrationError }}
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
            class="mb-4 rounded-0"
          ></v-text-field>

          <!-- Org Prefix -->
          <v-row dense>
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="facility.orgPrefix"
                label="Organisation Prefix (2 letters + 2 digits)"
                outlined tile dense required
                :rules="[required, orgPrefixRule]"
                hint="e.g. RH01 for Regional Hospital 01. Must be unique per organisation."
                persistent-hint
                maxlength="4"
                class="mb-8 rounded-0 font-weight-black"
                @input="facility.orgPrefix = facility.orgPrefix.toUpperCase()"
                :suffix="previewAdminId"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="7">
              <v-card v-if="previewAdminId" flat tile class="prefix-preview pa-4 mb-8" style="border:1px dashed #00A99D; background:#F0FDF9">
                <div class="text-caption font-weight-black mb-2" style="color:#0B3D2E; letter-spacing:1px">SYSTEM WILL GENERATE</div>
                <div class="text-caption mb-1"><strong>Admin ID:</strong> <span class="mono">{{ previewAdminId }}</span></div>
                <div class="text-caption"><strong>Admin Email:</strong> <span class="mono">{{ previewAdminEmail }}</span></div>
              </v-card>
            </v-col>
          </v-row>

          <!-- ── Section 2: Administrator Account ── -->
          <div class="section-label mb-4">ADMINISTRATOR ACCOUNT</div>

          <!-- Admin section: only name + password needed; ID & email auto-generated -->
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="admin.fullName"
                label="Administrator Full Name"
                outlined tile dense required
                :rules="[required]"
                class="mb-4 rounded-0"
              ></v-text-field>
            </v-col>
          </v-row>

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

          <!-- Credential result card — shown after successful registration -->
          <v-card v-if="generatedCredentials" flat tile class="mt-8 pa-6" style="border:2px solid #0B3D2E; background:#F0FDF9">
            <div class="text-caption font-weight-black mb-4" style="color:#0B3D2E; letter-spacing:1.5px">
              <v-icon small color="#0B3D2E" class="mr-1">mdi-shield-check</v-icon>
              REGISTRATION SUCCESSFUL — ADMINISTRATOR CREDENTIALS
            </div>
            <div class="cred-row mb-2"><span>Staff ID</span><strong class="mono">{{ generatedCredentials.adminId }}</strong></div>
            <div class="cred-row mb-2"><span>System Email</span><strong class="mono">{{ generatedCredentials.adminEmail }}</strong></div>
            <div class="cred-row mb-4"><span>Password</span><strong>( the one you just set )</strong></div>
            <v-alert dense text type="error" class="text-caption font-weight-bold rounded-0 mb-4">
              <v-icon x-small left>mdi-alert</v-icon>
              Save these credentials NOW. The system email is your login. The password cannot be recovered.
            </v-alert>
            <v-btn color="#0B3D2E" dark block height="44" tile depressed class="font-weight-black text-caption ls-1" @click="goToLogin">
              PROCEED TO LOGIN &nbsp;<v-icon right small>mdi-login</v-icon>
            </v-btn>
          </v-card>
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
import { generateStaffId, generateStaffEmail, getFacilityDomain, isValidOrgPrefix } from '~/util/identity'

export default {
  layout: 'login-layout',
  data() {
    return {
      valid: false,
      loading: false,
      registrationError: '',
      showPwd: false,
      generatedCredentials: null,
      facility: { name: '', region: 'Centre', city: '', quarter: '', email: '', orgPrefix: '' },
      admin: { fullName: '', password: '', confirmPassword: '' },
      regions: ['Far North', 'North', 'Adamawa', 'Centre', 'South', 'East', 'West', 'Littoral', 'South-West', 'North-West'],
      required:      v => !!v || 'This field is required',
      emailRule:     v => /.+@.+\..+/.test(v) || 'Enter a valid email',
      orgPrefixRule: v => isValidOrgPrefix(v) || 'Must be exactly 2 letters followed by 2 digits (e.g. RH01)',
      pwdRule:       v => (v && v.length >= 8 && /\d/.test(v)) || 'Min 8 characters including at least 1 number'
    }
  },
  mounted() {
    // Page is freely accessible for new facility registrations
  },
  computed: {
    useSupabaseFacilityRegistration() {
      return Boolean(this.$config && this.$config.ENABLE_SUPABASE_AUTH)
    },
    previewAdminId() {
      const prefix = (this.facility.orgPrefix || '').toUpperCase()
      if (!isValidOrgPrefix(prefix)) return ''
      return generateStaffId(prefix, 'ADMIN', [])
    },
    previewAdminEmail() {
      if (!this.previewAdminId) return ''
      const domain = getFacilityDomain(this.facility.email, this.facility.orgPrefix)
      return generateStaffEmail(this.previewAdminId, domain)
    }
  },
  methods: {
    async register() {
      if (!this.$refs.form.validate()) return
      this.loading = true
      this.registrationError = ''
      this.generatedCredentials = null
      try {
        if (this.useSupabaseFacilityRegistration) {
          const result = await this.$store.dispatch('facility/registerFacilityWithSupabase', {
            facility: this.facility,
            admin: this.admin,
            supabaseUrl: this.$config.SUPABASE_URL,
            supabaseKey: this.$config.SUPABASE_KEY
          })

          if (result.status === 'pending_confirmation') {
            this.$toast.info(result.message)
            this.registrationError = result.message
            return
          }

          this.$toast.success('Facility registered. Please log in with the administrator email and password.')
          this.$router.push('/login')
          return
        }

        const result = await this.$store.dispatch('facility/registerFacility', {
          facility: this.facility,
          admin: this.admin
        })

        // Show generated credentials BEFORE redirecting so the director can note them
        this.generatedCredentials = result
        this.$toast.success('Facility registered! Note your credentials below before continuing.')
      } catch (err) {
        const message = err && err.message ? err.message : 'Registration failed. Please try again.'
        this.registrationError = message
        this.$toast.error(message)
      } finally {
        this.loading = false
      }
    },
    goToLogin() {
      this.$router.push('/login')
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
.cred-row { display:flex; justify-content:space-between; font-size:12px; padding:5px 0; border-bottom:1px dashed #D1FAE5; }
.cred-row span { color:#6B7280; font-weight:600; }
.mono { font-family: 'Courier New', monospace; color:#0B3D2E; }
</style>
