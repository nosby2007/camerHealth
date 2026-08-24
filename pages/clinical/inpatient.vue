
<template>
  <v-container fluid class="gov-content pa-10">

    <!-- Header -->
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#0B3D2E" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-bed</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">CLINICAL DATA</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">INPATIENT</h1>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row class="no-gutters">

      <!-- Admission Form -->
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm admission-form">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
            {{ editingId ? 'EDIT ADMISSION' : 'NEW ADMISSION' }}
          </div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">

              <div class="section-label mb-4">PATIENT</div>

              <v-autocomplete
                v-model="form.patientId"
                :items="patientItems"
                item-text="label"
                item-value="id"
                label="Patient's Code"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-autocomplete>

              <v-divider class="mb-6 grey lighten-3"></v-divider>
              <div class="section-label mb-4">ADMISSION DETAILS</div>

              <v-text-field
                v-model="form.admissionDate"
                label="Admission Date"
                type="date"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-text-field>

              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="form.ward"
                    :items="dynamicWards"
                    label="Ward / Unit"
                    flat outlined tile dense required
                    :rules="[v => !!v || 'Required']"
                    class="mb-4 rounded-0"
                  ></v-select>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="form.bedNumber"
                    label="Bed No."
                    flat outlined tile dense
                    class="mb-4 rounded-0"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-select
                v-model="form.admissionType"
                :items="['Emergency', 'Elective', 'Maternity', 'Surgical', 'Medical', 'Paediatric', 'ICU']"
                label="Admission Type"
                flat outlined tile dense
                class="mb-4 rounded-0"
              ></v-select>

              <v-textarea
                v-model="form.admissionReason"
                label="Reason for Admission"
                rows="2"
                flat outlined tile dense
                class="mb-4 rounded-0"
              ></v-textarea>

              <v-autocomplete
                v-model="form.attendingDoctorId"
                :items="dynamicDoctors"
                item-text="label"
                item-value="id"
                label="Attending Doctor"
                flat outlined tile dense
                clearable
                class="mb-4 rounded-0"
                attach
              ></v-autocomplete>

              <v-divider class="mb-6 grey lighten-3"></v-divider>
              <div class="section-label mb-4">CLINICAL NOTES</div>

              <v-textarea
                v-model="form.diagnosis"
                label="Diagnosis"
                rows="2"
                flat outlined tile dense
                class="mb-4 rounded-0"
              ></v-textarea>

              <v-textarea
                v-model="form.treatment"
                label="Treatment Plan"
                rows="2"
                flat outlined tile dense
                class="mb-8 rounded-0"
              ></v-textarea>

              <v-row dense>
                <v-col :cols="editingId ? 8 : 12">
                  <v-btn
                    color="#0B3D2E" dark block height="52" tile depressed
                    :disabled="!valid" :loading="loading"
                    @click="save"
                    class="font-weight-black text-caption ls-1"
                  >
                    {{ editingId ? 'UPDATE' : 'ADMIT PATIENT' }}
                    <v-icon right small>mdi-bed-plus</v-icon>
                  </v-btn>
                </v-col>
                <v-col v-if="editingId" cols="4">
                  <v-btn color="grey lighten-2" block height="52" tile depressed @click="cancelEdit" class="font-weight-black text-caption">CANCEL</v-btn>
                </v-col>
              </v-row>

            </v-form>
          </div>
        </v-card>
      </v-col>

      <!-- Inpatient Table -->
      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom flex-wrap" style="gap:8px">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search inpatients..."
              single-line hide-details flat outlined tile dense
              class="bg-white rounded-0" style="max-width:280px"
            ></v-text-field>
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense>
              <v-btn x-small value=""           class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Admitted"   class="font-weight-black text-caption">ADMITTED</v-btn>
              <v-btn x-small value="Stable"     class="font-weight-black text-caption">STABLE</v-btn>
              <v-btn x-small value="Critical"   class="font-weight-black text-caption">CRITICAL</v-btn>
              <v-btn x-small value="Discharged" class="font-weight-black text-caption">DISCHARGED</v-btn>
            </v-btn-toggle>
          </div>

          <v-data-table
            :headers="headers"
            :items="filteredInpatients"
            :search="search"
            class="gov-table"
            tile elevation="0"
          >
            <template v-slot:item.patientName="{ item }">
              <div>
                <div class="text-caption font-weight-black grey--text">{{ item.patientId }}</div>
                <div>
                  <nuxt-link :to="patientDetailsRoute(item.patientId)" class="text-body-2 font-weight-black gov-text-primary patient-link">
                    {{ item.patientName.toUpperCase() }}
                  </nuxt-link>
                </div>
              </div>
            </template>
            <template v-slot:item.ward="{ item }">
              <span class="text-caption font-weight-black">{{ item.ward }}</span>
              <span v-if="item.bedNumber" class="text-caption grey--text ml-1">· Bed {{ item.bedNumber }}</span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.admissionDate="{ item }">
              <span class="text-caption grey--text font-weight-bold">{{ item.admissionDate }}</span>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" :to="patientDetailsRoute(item.patientId)" class="mr-1">
                    <v-icon small color="#003366">mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span>Patient details</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" :to="nurseEncounterRoute(item.patientId)" class="mr-1" :disabled="item.status === 'Discharged'">
                    <v-icon small color="#00A99D">mdi-stethoscope</v-icon>
                  </v-btn>
                </template>
                <span>Nursing evaluation</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" @click="editInpatient(item)" class="mr-1">
                    <v-icon small color="#0B3D2E">mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <span>Edit</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" @click="setStatus(item, 'Critical')" :disabled="item.status === 'Discharged'">
                    <v-icon small color="#C0392B">mdi-alert-circle</v-icon>
                  </v-btn>
                </template>
                <span>Mark Critical</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" @click="confirmDischarge(item)" :disabled="item.status === 'Discharged'">
                    <v-icon small color="#1F7A5C">mdi-exit-run</v-icon>
                  </v-btn>
                </template>
                <span>Discharge</span>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Discharge Confirmation Dialog -->
    <v-dialog v-model="dischargeDialog" max-width="420" persistent>
      <v-card flat tile class="gov-card b-1">
        <div class="pa-4 bg-teal white--text font-weight-black text-caption ls-1 uppercase">
          CONFIRM PATIENT DISCHARGE
        </div>
        <div class="pa-8">
          <p class="text-body-2 font-weight-bold gov-text-primary mb-1">Discharging:</p>
          <p class="text-h6 font-weight-black gov-text-primary mb-1">{{ dischargeTarget ? dischargeTarget.patientName : '' }}</p>
          <p class="text-caption grey--text mb-6">{{ dischargeTarget ? dischargeTarget.patientId : '' }} — Ward: {{ dischargeTarget ? dischargeTarget.ward : '' }}</p>
          <v-text-field v-model="dischargeNote" label="Discharge Note (optional)" outlined tile dense class="mb-6 rounded-0"></v-text-field>
          <v-row dense>
            <v-col cols="6">
              <v-btn color="#0B3D2E" dark block height="48" tile depressed :loading="loading" @click="doDischarge" class="font-weight-black text-caption">DISCHARGE</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn color="grey lighten-2" block height="48" tile depressed @click="dischargeDialog = false" class="font-weight-black text-caption">CANCEL</v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
export default {
  head: { title: 'Inpatient' },
  mounted() {
    this.$store.dispatch('clinical/fetchPatients')
    this.$store.dispatch('clinical/fetchInpatients')
    this.$store.dispatch('facility/fetchStaff')
    this.$store.dispatch('billing/fetchCatalog')

    // Pre-fill form if user arrived via "Admit Now" from the patient list
    const pending = this.$store.state.clinical.selectedAdmissionPatient
    if (pending) {
      this.form.patientId       = pending.id               || ''
      this.form.ward            = pending.pendingAdmission  || ''
      this.form.admissionReason = pending.admissionReason   || ''
      this.form.admissionDate   = new Date().toISOString().slice(0, 10)
      this.$store.commit('clinical/SET_SELECTED_ADMISSION_PATIENT', null)
      this.$nextTick(() => {
        const el = this.$el.querySelector('.admission-form')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  },

  data() {
    return {
      valid: false,
      search: '',
      statusFilter: '',
      loading: false,
      editingId: null,
      dischargeDialog: false,
      dischargeTarget: null,
      dischargeNote: '',
      form: {
        patientId: '', admissionDate: '', ward: '', bedNumber: '',
        admissionType: 'Medical', admissionReason: '', attendingDoctorId: '',
        diagnosis: '', treatment: ''
      },
      wards: ['General Medicine', 'Surgery', 'Maternity', 'Paediatrics', 'ICU', 'Orthopaedics', 'Cardiology', 'Neurology', 'Oncology', 'Isolation'],
      headers: [
        { text: 'PATIENT',        value: 'patientName' },
        { text: 'WARD / BED',     value: 'ward' },
        { text: 'TYPE',           value: 'admissionType' },
        { text: 'ADMITTED',       value: 'admissionDate' },
        { text: 'STATUS',         value: 'status',  align: 'center' },
        { text: '',               value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    userRole() { return this.$store.state.auth.role || 'ADMIN' },
    userDepartment() { return this.$store.state.auth.department || '' },
    userWard() { return this.$store.state.auth.service || '' },
    allPatients() { return this.$store.getters['clinical/patientDirectoryAll'] || this.$store.getters['clinical/getPatients'] || [] },
    patients() { return this.$store.getters['clinical/patientDirectory'] || this.allPatients },
    patientItems() {
      return this.allPatients.map(p => ({ id: p.id, label: `${p.mrn || p.id} — ${p.displayName || p.name}` }))
    },
    facilityModel() {
      return this.$store.getters['facility/getHospitalModel'] || { departments: [] }
    },
    dynamicWards() {
      const depts = this.facilityModel.departments || []
      const wardList = []
      depts.forEach(d => {
        if (d.inpatientWards && d.inpatientWards.length) {
          d.inpatientWards.forEach(w => wardList.push(`${d.name} — ${w}`))
        } else if (d.services && d.services.length) {
          d.services.forEach(s => wardList.push(`${d.name} — ${s.name}`))
        } else {
          wardList.push(d.name)
        }
      })
      return wardList.length ? wardList : this.wards
    },
    dynamicDoctors() {
      const staff = this.$store.getters['facility/getAllStaff'] || []
      return staff
        .filter(s => (s.role === 'DOCTOR' || s.role === 'NP') && s.status !== 'inactive')
        .map(s => ({ id: s.id, label: `${s.fullName || s.name} (${s.staffCode || s.role})` }))
    },
    inpatients() {
      const raw = this.$store.getters['clinical/getInpatients'] || []
      return raw.map(a => {
        const p = this.allPatients.find(pt => pt.id === a.patientId)
        return {
          ...a,
          patientName: p ? (p.displayName || p.name) : 'Unknown',
          patientDept: p ? p.currentDepartment : ''
        }
      }).reverse()
    },
    filteredInpatients() {
      const query = (this.search || '').trim().toLowerCase()

      if (query) {
        return this.inpatients.filter(item => {
          const codeMatch = (item.patientId || '').toLowerCase().includes(query)
          const nameMatch = (item.patientName || '').toLowerCase().includes(query)
          const wardMatch = (item.ward || '').toLowerCase().includes(query)
          const bedMatch = (item.bedNumber || '').toLowerCase().includes(query)
          const statusMatches = !this.statusFilter || item.status === this.statusFilter
          return (codeMatch || nameMatch || wardMatch || bedMatch) && statusMatches
        })
      }

      return this.inpatients.filter(item => {
        const statusMatches = !this.statusFilter || item.status === this.statusFilter
        if (!statusMatches) return false

        if (!this.userRole || this.userRole === 'ADMIN' || !this.userDepartment) return true

        const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const uDept = norm(this.userDepartment)
        const uWard = norm(this.userWard)
        const itemWard = norm(item.ward)
        const itemDept = norm(item.patientDept)

        if (uDept && (itemWard.includes(uDept) || itemDept.includes(uDept))) return true
        if (uWard && itemWard.includes(uWard)) return true

        return false
      })
    }
  },
  methods: {
    async save() {
      if (!this.$refs.form.validate()) return
      this.loading = true
      try {
        const payload = {
          patientId:         this.form.patientId,
          ward:              this.form.ward,
          bedNumber:         this.form.bedNumber,
          admissionType:     this.form.admissionType,
          admissionReason:   this.form.admissionReason,
          diagnosis:         this.form.diagnosis,
          treatmentPlan:     this.form.treatment,
          attendingDoctorId: this.form.attendingDoctorId || undefined
        }
        if (this.editingId) {
          await this.$store.dispatch('clinical/updateInpatient', { ...payload, id: this.editingId })
          this.$toast.success('Admission record updated.')
          this.cancelEdit()
        } else {
          const result = await this.$store.dispatch('clinical/admitPatient', payload)
          const admitted = result.inpatient || result
          // Auto-charge hospitalization fee
          const hospPrice = this.$store.getters['billing/activeCatalog']
            .find(i => i.section === 'hospitalization')
          if (hospPrice && admitted && admitted.id) {
            await this.$store.dispatch('billing/chargeForAdmission', {
              patientId: payload.patientId,
              inpatientId: admitted.id,
              ward: payload.ward,
              unitPrice: hospPrice.unitPrice
            })
          }
          this.$toast.success('Patient admitted successfully.')
          this.$refs.form.reset()
          this.form.admissionType = 'Medical'
        }
        await this.$store.dispatch('clinical/fetchInpatients')
      } finally {
        this.loading = false
      }
    },
    editInpatient(item) {
      this.editingId = item.id
      this.form = {
        patientId:         item.patientId,
        admissionDate:     item.admissionDate || item.admittedAt?.slice(0, 10) || '',
        ward:              item.ward,
        bedNumber:         item.bedNumber,
        admissionType:     item.admissionType,
        admissionReason:   item.admissionReason,
        attendingDoctorId: item.attendingDoctorId || '',
        diagnosis:         item.diagnosis,
        treatment:         item.treatmentPlan
      }
    },
    cancelEdit() { this.editingId = null; this.$refs.form.reset(); this.form.admissionType = 'Medical' },
    async setStatus(item, status) {
      await this.$store.dispatch('clinical/updateInpatient', { id: item.id, status })
      await this.$store.dispatch('clinical/fetchInpatients')
    },
    confirmDischarge(item) {
      const balance = this.$store.getters['billing/getPatientBalance']
        ? this.$store.getters['billing/getPatientBalance'](item.patientId)
        : 0
      if (balance > 0) {
        this.$toast.error(`Cannot discharge: outstanding balance of XAF ${balance.toLocaleString()}. Patient must settle billing first.`)
        return
      }
      this.dischargeTarget = item; this.dischargeNote = ''; this.dischargeDialog = true
    },
    async doDischarge() {
      this.loading = true
      try {
        await this.$store.dispatch('clinical/updateInpatient', {
          id: this.dischargeTarget.id,
          status: 'Discharged',
          dischargeSummary: this.dischargeNote
        })
        await this.$store.dispatch('clinical/fetchInpatients')
        this.$toast.success('Patient discharged.')
        this.dischargeDialog = false
        this.dischargeTarget = null
      } finally {
        this.loading = false
      }
    },
    patientDetailsRoute(patientId) {
      return `/clinical/patients/${patientId}`
    },
    nurseEncounterRoute(patientId) {
      return `/clinical/patients/${patientId}/encounter/nurse`
    },
    statusColor(s) {
      return { Admitted: '#003366', Stable: '#1F7A5C', Critical: '#C0392B', Discharged: '#6B7280' }[s] || '#6B7280'
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #0B3D2E !important; }
.bg-teal { background-color: #0B3D2E !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.section-label { font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:#0B3D2E; border-left:4px solid #00A99D; padding-left:10px; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
.patient-link { color: inherit; text-decoration: none; }
.patient-link:hover { text-decoration: underline; }
</style>
