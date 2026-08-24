<template>
  <v-container fluid class="pa-8 content-container">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8 pb-4 border-bottom">
      <div>
        <h1 class="text-h4 font-weight-medium mb-1" style="color: #2F353A;">Patient Registry</h1>
        <div class="text-caption grey--text font-weight-bold">Find charts, route patients, and monitor open care activity.</div>
      </div>
      <div class="d-flex align-center" style="gap:8px">
        <v-btn outlined color="#003366" class="text-none px-4 font-weight-bold bg-white" to="/clinical/dashboard" elevation="0" style="border-width: 1px;">
          <v-icon left small>mdi-view-dashboard</v-icon> command center
        </v-btn>
        <v-btn outlined color="#20B2AA" class="text-none px-4 font-weight-bold bg-white" to="/clinical/patients/new" elevation="0" style="border-width: 1px;">
          <v-icon left small>mdi-account-plus</v-icon> new patient
        </v-btn>
      </div>
    </div>

    <!-- Empty State -->
    <v-card flat v-if="!patients || patients.length === 0" class="pa-5 rounded-sm empty-state">
      <div class="d-flex flex-wrap align-center justify-space-between" style="gap:12px">
        <span>No patients found. <nuxt-link to="/clinical/patients/new" class="empty-link">Create a new patient record?</nuxt-link></span>
        <v-btn small depressed color="#003366" dark class="font-weight-black text-caption" @click="provisionWorkflowDemo">
          <v-icon left small>mdi-database-plus</v-icon>Provision demo chart
        </v-btn>
      </div>
    </v-card>

    <!-- Patients Table -->
    <v-card flat tile v-else class="table-container bg-transparent">
      <div class="d-flex flex-wrap mb-4" style="gap:10px">
        <v-btn-toggle v-model="statusFilter" mandatory dense class="patient-status-filter">
          <v-btn v-for="item in statusFilters" :key="item.value" small :value="item.value">
            {{ item.text }} <span>{{ statusCount(item.value) }}</span>
          </v-btn>
        </v-btn-toggle>
        <v-text-field
          v-model="search"
          placeholder="Search name, MRN, phone, department"
          single-line
          hide-details
          flat
          outlined
          dense
          class="bg-white max-400 rounded-sm"
          style="border-color: #ccc;"
        ></v-text-field>
        <v-select
          v-model="riskFilter"
          :items="riskFilters"
          label="Risk"
          item-text="text"
          item-value="value"
          hide-details
          flat
          outlined
          dense
          class="bg-white rounded-sm filter-control"
        ></v-select>
        <v-select
          v-model="departmentFilter"
          :items="departmentFilters"
          label="Department"
          hide-details
          flat
          outlined
          dense
          class="bg-white rounded-sm filter-control"
        ></v-select>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredPatients"
        :search="search"
        class="hospital-table elevation-0"
        :items-per-page="12"
        @click:row="openPatient"
      >
        <template v-slot:item.name="{ item }">
          <nuxt-link :to="'/clinical/patients/' + item.id" class="patient-link">{{ item.displayName }}</nuxt-link>
          <div class="text-caption grey--text font-weight-bold">{{ item.mrn }}</div>
        </template>
        <template v-slot:item.sex="{ item }">
          <span>{{ item.gender }}</span>
        </template>
        <template v-slot:item.riskLevel="{ item }">
          <v-chip x-small label dark :color="riskColor(item.riskLevel)" class="font-weight-black">{{ item.riskLevel.toUpperCase() }}</v-chip>
        </template>
        <template v-slot:item.currentDepartment="{ item }">
          <div class="d-flex align-center flex-wrap" style="gap:4px">
            <span class="font-weight-bold">{{ item.currentDepartment }}</span>
            <v-chip v-if="hasConsultationClearance(item.id)" x-small label color="#00A99D" dark class="font-weight-black">
              <v-icon x-small left>mdi-check-decagram</v-icon>CLEARED: {{ getClearanceDepartment(item.id) }}
            </v-chip>

            <!-- Admission Pending: chip + Admit Now button side by side -->
            <div v-if="item.pendingAdmission" class="d-flex align-center admit-pending-row">
              <v-chip x-small label color="#C0392B" dark class="font-weight-black">
                <v-icon x-small left>mdi-bed</v-icon>
                ADMISSION PENDING: {{ item.pendingAdmission.toUpperCase() }}
              </v-chip>
              <v-btn
                x-small
                depressed
                color="#20B2AA"
                dark
                class="font-weight-black ml-1"
                @click.stop="goToInpatientAdmission(item)"
              >
                <v-icon x-small left>mdi-arrow-right-circle</v-icon>
                Admit Now
              </v-btn>
            </div>

          </div>
          <div v-if="item.serviceRouting || item.specialtyRouting" class="text-caption grey--text text-truncate" style="max-width:220px">
            {{ item.serviceRouting || 'Service pending' }}<span v-if="item.specialtyRouting"> · {{ item.specialtyRouting }}</span>
          </div>
          <div v-if="item.riskReasons && item.riskReasons.length" class="text-caption grey--text text-truncate" style="max-width:220px">{{ item.riskReasons.join(', ') }}</div>
          <v-chip v-if="item.isDischarged" x-small label color="#475569" dark class="font-weight-black mt-1">
            <v-icon x-small left>mdi-lock-outline</v-icon>DISCHARGED
          </v-chip>
        </template>
        <template v-slot:item.openOrders="{ item }">
          <span class="font-weight-bold">{{ item.openOrders.length }}</span>
        </template>
        <template v-slot:item.openTasks="{ item }">
          <span class="font-weight-bold">{{ item.openTasks.length }}</span>
        </template>
        <template v-slot:item.contact="{ item }">
          <span>{{ item.phone }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
            <v-btn icon small color="#20B2AA" title="Voir le dossier patient"
              @click.stop="$router.push('/clinical/patients/' + item.id)">
              <v-icon small>mdi-eye</v-icon>
            </v-btn>
            <v-btn icon small color="#003366" title="Triage infirmier"
              v-if="!item.isDischarged"
              @click.stop="$router.push('/clinical/patients/' + item.id + '/encounter/nurse')">
              <v-icon small>mdi-stethoscope</v-icon>
            </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      search: '',
      statusFilter: 'all',
      statusFilters: [
        { text: 'All patients', value: 'all' },
        { text: 'Waiting list', value: 'waiting' },
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' }
      ],
      riskFilter: '',
      departmentFilter: '',
      riskFilters: [
        { text: 'All risk', value: '' },
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' }
      ],
      headers: [
        { text: 'Name / MRN', align: 'start', value: 'name', class: 'table-header' },
        { text: 'Age', value: 'age', class: 'table-header' },
        { text: 'Sex', value: 'sex', class: 'table-header' },
        { text: 'Risk', value: 'riskLevel', class: 'table-header', align: 'center' },
        { text: 'Department', value: 'currentDepartment', class: 'table-header' },
        { text: 'Orders', value: 'openOrders', class: 'table-header', align: 'center' },
        { text: 'Tasks', value: 'openTasks', class: 'table-header', align: 'center' },
        { text: 'Contact', value: 'contact', class: 'table-header' },
        { text: 'Actions', value: 'actions', sortable: false, align: 'right', class: 'table-header' }
      ]
    }
  },
  computed: {
    patients() {
      return this.$store.getters['clinical/patientDirectoryAll'] || this.$store.getters['clinical/patientDirectory'] || []
    },
    allPatients() {
      return this.$store.getters['clinical/patientDirectoryAll'] || this.$store.getters['clinical/patientDirectory'] || []
    },
    departmentFilters() {
      const source = this.patients
      const departments = [...new Set(source.map(patient => patient.currentDepartment).filter(Boolean))].sort()
      return ['All departments', ...departments]
    },
    filteredPatients() {
      const query = (this.search || '').trim().toLowerCase()

      // If doctor/nurse searches by Patient Code / MRN / ID / Name / Phone, search facility-wide
      if (query) {
        return this.allPatients.filter(patient => {
          const idMatch = (patient.id || '').toLowerCase().includes(query)
          const mrnMatch = (patient.mrn || '').toLowerCase().includes(query)
          const extMatch = (patient.externalId || '').toLowerCase().includes(query)
          const nameMatch = (patient.displayName || patient.name || '').toLowerCase().includes(query)
          const phoneMatch = (patient.phone || '').toLowerCase().includes(query)
          const deptMatch = (patient.currentDepartment || '').toLowerCase().includes(query)

          const riskMatches = !this.riskFilter || patient.riskLevel === this.riskFilter
          const departmentMatches = !this.departmentFilter || this.departmentFilter === 'All departments' || patient.currentDepartment === this.departmentFilter

          return (idMatch || mrnMatch || extMatch || nameMatch || phoneMatch || deptMatch) && riskMatches && departmentMatches
        })
      }

      // Default view: list & count ONLY doctor/nurse accessible patients (own dept or transferred)
      return this.patients.filter(patient => {
        const statusMatches = this.statusFilter === 'all' || patient.lifecycleStatus === this.statusFilter
        const riskMatches = !this.riskFilter || patient.riskLevel === this.riskFilter
        const departmentMatches = !this.departmentFilter || this.departmentFilter === 'All departments' || patient.currentDepartment === this.departmentFilter
        return statusMatches && riskMatches && departmentMatches
      })
    }
  },
  async mounted() {
    await this.loadPatients()
  },
  methods: {
    async loadPatients() {
      try {
        await this.$store.dispatch('clinical/fetchPatients')
      } catch (err) {
        console.error('Unable to load patient registry:', err)
        if (this.$toast) this.$toast.error('Unable to refresh patient list.')
      }
    },
    statusCount(status) {
      return status === 'all' ? this.patients.length : this.patients.filter(patient => patient.lifecycleStatus === status).length
    },
    hasConsultationClearance(patientId) {
      return !!this.$store.getters['billing/getPaymentClearance'](patientId, 'consultation')
    },
    getClearanceDepartment(patientId) {
      const clr = this.$store.getters['billing/getPaymentClearance'](patientId, 'consultation')
      return clr ? (clr.department || 'General Medicine') : ''
    },
    async provisionWorkflowDemo() {
      const patientId = await this.$store.dispatch('clinical/provisionPatientWorkflowDemo')
      this.$toast.success('Demo patient chart provisioned.')
      this.$router.push('/clinical/patients/' + patientId)
    },
    openPatient(patient) {
      if (patient && patient.id) this.$router.push('/clinical/patients/' + patient.id)
    },
    /**
     * Called when the user clicks "Admit Now" on the red Admission Pending chip.
     * Stores the patient in Vuex so the Inpatient page can pre-fill the admission form,
     * then navigates directly to the Inpatient tab.
     */
    goToInpatientAdmission(patient) {
      // Persist the selected patient so the inpatient page can read it on mount
      this.$store.commit('clinical/SET_SELECTED_ADMISSION_PATIENT', patient)
      this.$router.push('/clinical/inpatient')
    },
    riskColor(level) {
      return { high: '#C0392B', medium: '#D97706', low: '#166534' }[level] || '#6B7280'
    }
  }
}
</script>

<style scoped>
.content-container {
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #F8F9FA;
  min-height: 100vh;
}
.border-bottom { border-bottom: 2px solid #E2E8F0; }
.bg-white { background: white !important; }
.bg-transparent { background: transparent !important; }
.max-400 { max-width: 400px; }
.filter-control { max-width: 190px; }
.patient-status-filter { flex: 0 0 100%; background: #fff; border: 1px solid #cbd5e1; }
.patient-status-filter .v-btn { min-width: 132px; border-radius: 0; text-transform: none; font-weight: 800; }
.patient-status-filter .v-btn span span { margin-left: 7px; padding: 1px 6px; background: #e2e8f0; color: #334155; font-size: 10px; }
.patient-status-filter .v-btn--active { background: #0f766e !important; color: #fff !important; }
.patient-status-filter .v-btn--active span span { background: rgba(255,255,255,.2); color: #fff; }
.patient-link { color: #20B2AA; text-decoration: none; font-weight: 700; }
.patient-link:hover { text-decoration: underline; }
.empty-state {
  background-color: #FCF8E3;
  color: #8A6D3B;
  border: 1px solid #FAEBCC;
}
.empty-link {
  color: #20B2AA;
  text-decoration: none;
  font-weight: 800;
}
.admit-pending-row {
  margin-top: 2px;
}

.hospital-table {
  background: white !important;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
}
.hospital-table ::v-deep th {
  background-color: #E2E8F0 !important;
  color: #64748B !important;
  font-size: 13px !important;
  font-weight: 600;
  height: 48px !important;
  text-transform: capitalize;
}
.hospital-table ::v-deep td {
  border-bottom: 1px solid #F1F5F9 !important;
  height: 50px !important;
  color: #1B1F23;
  font-size: 14px;
}
.hospital-table ::v-deep tbody tr {
  cursor: pointer;
}
.hospital-table ::v-deep tbody tr:hover {
  background: #ECFDF5 !important;
}
</style>
