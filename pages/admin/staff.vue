
<template>
  <v-container fluid class="gov-content pa-10">

    <!-- Header -->
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#003366" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-account-multiple</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">ADMIN — IDENTITY MANAGEMENT</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">STAFF ACCOUNTS</h1>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row class="no-gutters">

      <!-- ── Left: Create / Edit Form ── -->
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
            {{ editingId ? 'RESET PASSWORD' : 'CREATE STAFF ACCOUNT' }}
          </div>
          <div class="pa-8">

            <v-alert v-if="useSupabaseStaffInvitation" dense text type="warning" class="mb-6 text-caption font-weight-bold rounded-0">
              Supabase Auth compatibility mode is enabled. New staff onboarding must move through a secure backend invitation flow.
              Local password-based account creation is disabled in this mode.
            </v-alert>

            <!-- CREATE MODE -->
            <template v-if="!editingId">
              <v-form ref="createForm" v-model="createValid">

                <div class="section-label mb-4">PERSONAL INFORMATION</div>

                <v-text-field
                  v-model="form.fullName"
                  label="Full Name"
                  outlined tile dense required
                  :rules="[required]"
                  class="mb-4 rounded-0"
                ></v-text-field>

                <v-divider class="mb-6 grey lighten-3"></v-divider>
                <div class="section-label mb-4">LOGIN CREDENTIALS</div>

                <v-row dense>
                  <v-col cols="12">
                    <!-- Auto-ID preview: shown as soon as a role is selected -->
                    <v-card flat tile class="auto-id-preview pa-4 mb-4" :class="form.role ? 'active' : 'inactive'">
                      <div class="text-caption font-weight-black mb-1" style="letter-spacing:1px">
                        <v-icon small :color="form.role ? '#0B3D2E' : '#9CA3AF'" class="mr-1">mdi-identifier</v-icon>
                        SYSTEM-GENERATED STAFF ID
                      </div>
                      <div class="d-flex align-center">
                        <span v-if="previewStaffId" class="id-badge">{{ previewStaffId }}</span>
                        <span v-else class="id-badge-placeholder">Select a role to preview ID</span>
                      </div>
                      <div v-if="previewStaffEmail" class="text-caption mt-1" style="color:#6B7280">
                        <v-icon x-small class="mr-1">mdi-email-outline</v-icon>{{ previewStaffEmail }}
                      </div>
                    </v-card>
                  </v-col>
                  <v-col cols="12">
                    <v-select
                      v-model="form.role"
                      :items="roleOptions"
                      item-text="label"
                      item-value="value"
                      label="Role"
                      outlined tile dense required
                      :rules="[required]"
                      class="mb-4 rounded-0"
                    ></v-select>
                  </v-col>
                </v-row>

                <v-divider class="mb-6 grey lighten-3"></v-divider>
                <div class="section-label mb-4">HOSPITAL ASSIGNMENT</div>

                <v-text-field
                  v-model="form.position"
                  label="Position / Title"
                  outlined tile dense
                  hint="e.g. Chef de service, Major de service, Cardiologist"
                  persistent-hint
                  class="mb-4 rounded-0"
                ></v-text-field>

                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="form.department"
                      :items="departmentOptions"
                      label="Department (optional)"
                      outlined tile dense
                      class="mb-4 rounded-0"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="form.service"
                      :items="serviceOptions"
                      item-text="name"
                      item-value="name"
                      label="Ward / Unit (optional)"
                      outlined tile dense
                      class="mb-4 rounded-0"
                    ></v-select>
                  </v-col>

                </v-row>

                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="form.specialty"
                      :items="specialtyOptions"
                      label="Specialty (optional)"
                      outlined tile dense
                      class="mb-4 rounded-0"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="form.phiScope"
                      :items="phiScopeOptions"
                      label="PHI Scope (optional)"
                      outlined tile dense
                      class="mb-4 rounded-0"
                    ></v-select>
                  </v-col>
                </v-row>

                <template v-if="!useSupabaseStaffInvitation">
                  <v-text-field
                    v-model="form.password"
                    label="Initial Password"
                    :type="showPwd ? 'text' : 'password'"
                    :append-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append="showPwd = !showPwd"
                    outlined tile dense required
                    :rules="[required, pwdRule]"
                    hint="Min 8 chars, at least 1 number"
                    persistent-hint
                    class="mb-4 rounded-0"
                  ></v-text-field>

                  <v-text-field
                    v-model="form.confirmPassword"
                    label="Confirm Password"
                    :type="showPwd ? 'text' : 'password'"
                    outlined tile dense required
                    :rules="[required, v => v === form.password || 'Passwords do not match']"
                    class="mb-8 rounded-0"
                  ></v-text-field>
                </template>

                <v-alert v-else dense text type="info" class="mb-8 text-caption font-weight-bold rounded-0">
                  Initial passwords are not set in the browser for secure invitation mode. The backend endpoint will issue the invite and handle account activation.
                </v-alert>

                <!-- Credential preview card — shown before submit (auto-generated) -->
                <v-card v-if="!useSupabaseStaffInvitation && createValid && previewStaffId && form.role" flat tile class="credential-preview pa-5 mb-8">
                  <div class="text-caption font-weight-black mb-3 uppercase ls-1" style="color:#003366">
                    <v-icon small color="#003366" class="mr-1">mdi-card-account-details</v-icon>
                    CREDENTIAL PREVIEW (system-generated)
                  </div>
                  <div class="cred-row"><span>Staff ID</span><strong class="mono">{{ previewStaffId }}</strong></div>
                  <div class="cred-row"><span>Email</span><strong class="mono">{{ previewStaffEmail }}</strong></div>
                  <div class="cred-row"><span>Role</span><strong>{{ form.role }}</strong></div>
                  <div class="cred-row mb-1"><span>Password</span><strong>{{ form.password }}</strong></div>
                  <div class="cred-note mt-3">
                    <v-icon x-small color="#C0392B">mdi-alert</v-icon>
                    Share these credentials securely. Password is hashed on save and cannot be recovered.
                  </div>
                </v-card>

                <!-- Post-creation result card -->
                <v-card v-if="lastCreated" flat tile class="pa-5 mb-6" style="border:2px solid #0B3D2E; background:#F0FDF9">
                  <div class="text-caption font-weight-black mb-3 uppercase ls-1" style="color:#0B3D2E">
                    <v-icon small color="#0B3D2E" class="mr-1">mdi-check-circle</v-icon>
                    ACCOUNT CREATED — SHARE SECURELY
                  </div>
                  <div class="cred-row"><span>Staff ID</span><strong class="mono">{{ lastCreated.staffId }}</strong></div>
                  <div class="cred-row"><span>System Email</span><strong class="mono">{{ lastCreated.staffEmail }}</strong></div>
                  <div class="cred-row mb-1"><span>Password</span><strong>( the one you just set )</strong></div>
                </v-card>

                <v-btn
                  color="#003366" dark block height="52" tile depressed
                  :disabled="!createValid" :loading="loading"
                  @click="createAccount"
                  class="font-weight-black text-caption ls-1"
                >
                  {{ useSupabaseStaffInvitation ? 'SEND STAFF INVITE' : 'CREATE ACCOUNT' }}
                  <v-icon right small>{{ useSupabaseStaffInvitation ? 'mdi-email-fast' : 'mdi-account-plus' }}</v-icon>
                </v-btn>
              </v-form>
            </template>

            <!-- RESET PASSWORD MODE -->
            <template v-else>
              <v-alert dense text type="warning" class="mb-6 text-caption font-weight-bold rounded-0">
                Resetting password for <strong>{{ editingMember ? editingMember.fullName : '' }}</strong>
                ({{ editingId }})
              </v-alert>
              <v-form ref="resetForm" v-model="resetValid">
                <v-text-field
                  v-model="resetPwd.password"
                  label="New Password"
                  :type="showPwd ? 'text' : 'password'"
                  :append-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append="showPwd = !showPwd"
                  outlined tile dense required
                  :rules="[required, pwdRule]"
                  hint="Min 8 chars, at least 1 number"
                  persistent-hint
                  class="mb-4 rounded-0"
                ></v-text-field>
                <v-text-field
                  v-model="resetPwd.confirm"
                  label="Confirm New Password"
                  :type="showPwd ? 'text' : 'password'"
                  outlined tile dense required
                  :rules="[required, v => v === resetPwd.password || 'Passwords do not match']"
                  class="mb-8 rounded-0"
                ></v-text-field>
                <v-row dense>
                  <v-col cols="8">
                    <v-btn color="#003366" dark block height="48" tile depressed :disabled="!resetValid" :loading="loading" @click="doReset" class="font-weight-black text-caption ls-1">
                      RESET PASSWORD
                    </v-btn>
                  </v-col>
                  <v-col cols="4">
                    <v-btn color="grey lighten-2" block height="48" tile depressed @click="cancelEdit" class="font-weight-black text-caption">CANCEL</v-btn>
                  </v-col>
                </v-row>
              </v-form>
            </template>

          </div>
        </v-card>
      </v-col>

      <!-- ── Right: Staff Table ── -->
      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search staff..."
              single-line hide-details flat outlined tile dense
              class="bg-white rounded-0 max-400"
            ></v-text-field>
            <v-spacer />
            <v-btn-toggle v-model="roleFilter" tile dense class="ml-4">
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn v-for="r in roleOptions" :key="r.value" x-small :value="r.value" class="font-weight-black text-caption">{{ r.label }}</v-btn>
            </v-btn-toggle>
          </div>

          <v-data-table
            :headers="headers"
            :items="filteredStaff"
            :search="search"
            class="gov-table"
            tile elevation="0"
          >
            <template v-slot:item.fullName="{ item }">
              <div class="d-flex align-center py-2">
                <v-avatar size="32" :color="roleColor(item.role)" class="mr-3">
                  <v-icon dark x-small>{{ roleIcon(item.role) }}</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption font-weight-black gov-text-primary">{{ item.fullName.toUpperCase() }}</div>
                  <div class="text-caption grey--text">{{ item.email }}</div>
                </div>
              </div>
            </template>
            <template v-slot:item.staffCode="{ item }">
              <span class="id-badge text-caption font-weight-black mono">{{ item.staffCode || item.id }}</span>
            </template>
            <template v-slot:item.role="{ item }">
              <v-chip x-small dark label :color="roleColor(item.role)" class="font-weight-black">{{ item.role }}</v-chip>
            </template>
            <template v-slot:item.assignment="{ item }">
              <div class="text-caption font-weight-black gov-text-primary">{{ item.department || 'Unassigned' }}</div>
              <div class="text-caption grey--text">{{ item.service || item.specialty || item.phiScope || 'No PHI scope set' }}</div>
            </template>
            <template v-slot:item.active="{ item }">
              <v-chip x-small label :color="(item.status === 'active' || item.active) ? '#1F7A5C' : '#C0392B'" dark class="font-weight-black">
                {{ (item.status === 'active' || item.active) ? 'ACTIVE' : 'INACTIVE' }}
              </v-chip>
            </template>
            <template v-slot:item.createdAt="{ item }">
              <span class="text-caption grey--text font-weight-bold">{{ fmt(item.createdAt) }}</span>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" @click="startReset(item)" :disabled="!item.active" class="mr-1">
                    <v-icon small color="#F4A300">mdi-lock-reset</v-icon>
                  </v-btn>
                </template>
                <span>Reset Password</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" @click="confirmDeactivate(item)" :disabled="!item.active || item.role === 'ADMIN'">
                    <v-icon small color="#C0392B">mdi-account-off</v-icon>
                  </v-btn>
                </template>
                <span>Deactivate Account</span>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Deactivate Confirmation Dialog -->
    <v-dialog v-model="deactivateDialog" max-width="420" persistent>
      <v-card flat tile class="gov-card b-1">
        <div class="pa-4 bg-error white--text font-weight-black text-caption ls-1 uppercase">
          CONFIRM ACCOUNT DEACTIVATION
        </div>
        <div class="pa-8">
          <p class="text-body-2 font-weight-bold gov-text-primary mb-2">
            You are about to deactivate the account of:
          </p>
          <p class="text-h6 font-weight-black gov-text-primary mb-1">{{ deactivateTarget ? deactivateTarget.fullName : '' }}</p>
          <p class="text-caption grey--text mb-6">ID: {{ deactivateTarget ? deactivateTarget.id : '' }} — Role: {{ deactivateTarget ? deactivateTarget.role : '' }}</p>
          <v-alert dense text type="error" class="text-caption font-weight-bold rounded-0 mb-6">
            This action is logged in the audit trail and cannot be undone without direct database access.
          </v-alert>
          <v-row dense>
            <v-col cols="6">
              <v-btn color="#C0392B" dark block height="48" tile depressed :loading="loading" @click="doDeactivate" class="font-weight-black text-caption">DEACTIVATE</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn color="grey lighten-2" block height="48" tile depressed @click="deactivateDialog = false" class="font-weight-black text-caption">CANCEL</v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import { generateStaffId, generateStaffEmail, getFacilityDomain } from '~/util/identity'

export default {
  head: { title: 'Staff Management' },
  data() {
    return {
      search: '',
      roleFilter: '',
      loading: false,
      showPwd: false,
      createValid: false,
      resetValid: false,
      editingId: null,
      deactivateDialog: false,
      deactivateTarget: null,
      form: { fullName: '', role: null, position: '', department: '', service: '', specialty: '', phiScope: '', password: '', confirmPassword: '' },
      lastCreated: null,
      resetPwd: { password: '', confirm: '' },
      roleOptions: [
        { value: 'DOCTOR',  label: 'Doctor'  },
        { value: 'NP',      label: 'Nurse Practitioner' },
        { value: 'NURSE',   label: 'Nurse'   },
        { value: 'CNA',     label: 'Care Assistant' },
        { value: 'MIDWIFE', label: 'Sage-femme' },
        { value: 'MAJOR_SERVICE', label: 'Major de service' },
        { value: 'NURSING_SUPERVISOR', label: 'Surveillant general' },
        { value: 'LAB',     label: 'Laborantin' },
        { value: 'IMAGING', label: 'Imagerie' },
        { value: 'DENTIST', label: 'Dentist' },
        { value: 'ANESTHESIOLOGIST', label: 'Anesthesiologist' },
        { value: 'PHARMACY', label: 'Pharmacien' },
        { value: 'FRONT_DESK', label: 'Reception' },
        { value: 'RECORDS', label: 'Archives' },
        { value: 'BILLING', label: 'Facturation' },
        { value: 'SOCIAL_WORKER', label: 'Social' },
        { value: 'PHYSIOTHERAPIST', label: 'Kine' }
      ],

      headers: [
        { text: 'STAFF MEMBER', value: 'fullName', width: '260px' },
        { text: 'STAFF ID',     value: 'staffCode' },
        { text: 'ROLE',         value: 'role',      align: 'center' },
        { text: 'ASSIGNMENT',   value: 'assignment' },
        { text: 'STATUS',       value: 'active',    align: 'center' },
        { text: 'CREATED',      value: 'createdAt', align: 'right'  },
        { text: '',             value: 'actions',   sortable: false, align: 'right' }
      ],
      // validation rules
      required: v => !!v || 'Required',
      pwdRule:  v => (v && v.length >= 8 && /\d/.test(v)) || 'Min 8 chars including at least 1 number'
    }
  },
  computed: {
    useSupabaseStaffInvitation() {
      return Boolean(this.$config && this.$config.ENABLE_SUPABASE_AUTH)
    },
    allStaff() { return (this.$store.getters['facility/getAllStaff'] || []).filter(s => s && s.role !== 'ADMIN') },
    filteredStaff() {
      if (!this.roleFilter) return this.allStaff
      return this.allStaff.filter(s => s && s.role === this.roleFilter)
    },
    existingIds() { return (this.$store.getters['facility/getAllStaff'] || []).map(s => s && s.id) },
    hospitalDepartments() { return this.$store.getters['facility/getDepartments'] || [] },
    departmentOptions() { return this.hospitalDepartments.map(department => department.name) },

    selectedDepartment() { return this.hospitalDepartments.find(department => department.name === this.form.department) },
    serviceOptions() {
      if (this.selectedDepartment && this.selectedDepartment.services && this.selectedDepartment.services.length) {
        return this.selectedDepartment.services
      }
      // Return all wards/units from all departments when no department selected
      const allServices = []
      this.hospitalDepartments.forEach(dept => {
        (dept.services || []).forEach(svc => {
          const name = typeof svc === 'string' ? svc : svc.name
          if (name && !allServices.some(s => s.name === name)) {
            allServices.push({ id: svc.id || name, name })
          }
        })
      })
      return allServices
    },
    specialtyOptions() {
      const deptSpecs = this.selectedDepartment ? (this.selectedDepartment.specialties || []) : []
      const allSpecs = this.$store.getters['facility/getSpecialties'] || []
      return [...new Set([...deptSpecs, ...allSpecs])]
    },

    phiScopeOptions() {
      return [
        'facility-administration',
        'assigned-service-and-consult',
        'assigned-unit-care-team',
        'assigned-unit-care-team-limited',
        'maternal-care-team',
        'unit-nursing-supervision',
        'facility-nursing-oversight',
        'diagnostic-orders-only',
        'imaging-orders-only',
        'medication-profile',
        'demographics-and-consent',
        'billing-only',
        'records-management',
        'social-care-minimum',
        'rehab-care-plan',
        'no-direct-phi',
        'minimum-necessary'
      ]
    },
    uniqueIdRule() {
      // Kept for backward compat, not used in auto-ID mode but harmless
      return v => !this.existingIds.includes((v || '').trim().toUpperCase()) || 'This Staff ID already exists'
    },
    editingMember() {
      if (!this.editingId) return null
      return this.$store.getters['facility/getAllStaff'].find(s => s.id === this.editingId)
    },
    // ── Auto-ID preview (updates live as role changes) ────────────────────────
    previewStaffId() {
      if (!this.form.role) return ''
      const facility = this.$store.state.facility.facility || {}
      const orgPrefix = facility.orgPrefix || facility.code || 'HGOPY'
      const existingIds = (this.$store.getters['facility/getAllStaff'] || []).map(s => s.staffCode || s.id)
      return generateStaffId(orgPrefix, this.form.role, existingIds)
    },
    previewStaffEmail() {
      if (!this.previewStaffId) return ''
      const facility = this.$store.state.facility.facility || {}
      const domain = facility.facilityDomain || getFacilityDomain(facility.email, facility.orgPrefix || facility.code || 'HGOPY')
      return generateStaffEmail(this.previewStaffId, domain)
    }
  },
  async mounted() {
    await Promise.allSettled([
      this.$store.dispatch('facility/fetchStaff'),
      this.$store.dispatch('facility/fetchDepartments')
    ])
  },
  watch: {
    'form.service'(val) {
      if (val && !this.form.department) {
        const match = this.hospitalDepartments.find(d =>
          (d.services || []).some(s => (typeof s === 'string' ? s : s.name) === val)
        )
        if (match) {
          this.form.department = match.name
        }
      }
    }
  },
  methods: {

    async createAccount() {
      if (!this.$refs.createForm.validate()) return
      this.loading = true
      try {
        if (this.useSupabaseStaffInvitation) {
          await this.$store.dispatch('facility/inviteStaffAccount', {
            staff: this.form,
            endpoint: this.$config.STAFF_INVITE_ENDPOINT
          })
          this.$toast.success(`Invitation queued for ${this.form.fullName}.`)
          this.$refs.createForm.reset()
          this.form.role = null
          return
        }

        const result = await this.$store.dispatch('facility/createStaffAccount', this.form)
        this.lastCreated = result
        this.$toast.success(`Account created for ${this.form.fullName}. Share credentials securely.`)
        this.$refs.createForm.reset()
        this.form.role = null
      } catch (e) {
        this.$toast.error((e && e.message) || 'Failed to create account.')
      } finally {
        this.loading = false
      }
    },
    startReset(member) {
      this.editingId = member.id
      this.resetPwd = { password: '', confirm: '' }
    },
    async doReset() {
      if (!this.$refs.resetForm.validate()) return
      this.loading = true
      try {
        await this.$store.dispatch('facility/resetStaffPassword', { staffId: this.editingId, newPassword: this.resetPwd.password })
        this.$toast.success('Password reset successfully.')
        this.cancelEdit()
      } catch (e) {
        this.$toast.error('Password reset failed.')
      } finally {
        this.loading = false
      }
    },
    cancelEdit() { this.editingId = null; this.resetPwd = { password: '', confirm: '' } },
    confirmDeactivate(member) { this.deactivateTarget = member; this.deactivateDialog = true },
    async doDeactivate() {
      this.loading = true
      try {
        await this.$store.dispatch('facility/deactivateStaffAccount', this.deactivateTarget.id)
        this.$toast.success(`Account ${this.deactivateTarget.id} deactivated.`)
        this.deactivateDialog = false
        this.deactivateTarget = null
      } catch (e) {
        this.$toast.error('Deactivation failed.')
      } finally {
        this.loading = false
      }
    },
    fmt(ts) { return new Date(ts).toLocaleDateString() },
    roleColor(r) {
      return {
        ADMIN: '#003366',
        DOCTOR: '#0B3D2E',
        NP: '#0F766E',
        NURSE: '#1F7A5C',
        CNA: '#64748B',
        MIDWIFE: '#BE185D',
        MAJOR_SERVICE: '#7C3AED',
        NURSING_SUPERVISOR: '#4F46E5',
        LAB: '#F4A300',
        IMAGING: '#9B59B6',
        PHARMACY: '#0369A1',
        FRONT_DESK: '#0891B2',
        RECORDS: '#475569',
        BILLING: '#B45309',
        SOCIAL_WORKER: '#15803D',
        PHYSIOTHERAPIST: '#2563EB'
      }[r] || '#6B7280'
    },
    roleIcon(r) {
      return {
        ADMIN: 'mdi-shield-account',
        DOCTOR: 'mdi-doctor',
        NP: 'mdi-stethoscope',
        NURSE: 'mdi-medical-bag',
        CNA: 'mdi-account-heart',
        MIDWIFE: 'mdi-baby-face-outline',
        MAJOR_SERVICE: 'mdi-account-star',
        NURSING_SUPERVISOR: 'mdi-account-supervisor',
        LAB: 'mdi-flask',
        IMAGING: 'mdi-radiology-box',
        PHARMACY: 'mdi-pill',
        FRONT_DESK: 'mdi-desk',
        RECORDS: 'mdi-archive',
        BILLING: 'mdi-file-document-outline',
        SOCIAL_WORKER: 'mdi-hand-heart',
        PHYSIOTHERAPIST: 'mdi-human-cane'
      }[r] || 'mdi-account'
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #003366 !important; }
.bg-error { background-color: #C0392B !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.max-400 { max-width: 400px; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.section-label { font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:#003366; border-left:4px solid #00A99D; padding-left:10px; }
.credential-preview { background: #F0F7FF !important; border: 1px solid #BFDBFE !important; border-left: 4px solid #003366 !important; }
.cred-row { display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px solid #E2E8F0; }
.cred-row span { color:#6B7280; font-weight:600; }
.cred-note { font-size:10px; color:#C0392B; font-weight:600; }
.mono { font-family: 'Courier New', monospace; color: #0B3D2E; }
.auto-id-preview { border: 1px dashed #9CA3AF !important; background: #F9FAFB !important; }
.auto-id-preview.active { border-color: #00A99D !important; background: #F0FDF9 !important; }
.id-badge { font-family:'Courier New',monospace; font-size:16px; font-weight:900; color:#003366; background:#EFF6FF; padding:2px 10px; border-radius:2px; border:1px solid #BFDBFE; }
.id-badge-placeholder { font-size:12px; color:#9CA3AF; font-style:italic; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
