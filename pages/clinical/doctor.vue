<template>
  <v-container fluid class="gov-content pa-8">
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap" style="gap:12px">
      <div>
        <div class="text-caption font-weight-black grey--text text-uppercase ls-1 mb-1">DOCTOR PATIENT MANAGEMENT</div>
        <h1 class="text-h4 font-weight-black gov-text-primary uppercase mb-1">Doctor Worklist</h1>
        <div class="text-caption grey--text font-weight-bold">From triage review to treatment, admission, referral and discharge</div>
      </div>
      <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" to="/clinical/patients">
        <v-icon left small>mdi-account-search</v-icon>Patient registry
      </v-btn>
    </div>

    <v-row dense class="mb-6">
      <v-col v-for="metric in metrics" :key="metric.label" cols="12" sm="6" lg="3">
        <v-card flat tile class="gov-card b-1 pa-5 h-100 shadow-sm">
          <div class="d-flex align-center justify-space-between mb-4">
            <v-avatar tile size="38" :color="metric.color"><v-icon dark>{{ metric.icon }}</v-icon></v-avatar>
            <span class="text-h4 font-weight-black gov-text-primary">{{ metric.value }}</span>
          </div>
          <div class="text-caption font-weight-black grey--text text-uppercase ls-1">{{ metric.label }}</div>
          <div class="text-caption grey--text mt-1">{{ metric.helper }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-icon color="#003366" small>mdi-stethoscope</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Patients needing doctor action</span>
            <v-spacer />
            <v-btn-toggle v-model="filter" tile dense>
              <v-btn x-small value="all" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="high" class="font-weight-black text-caption">HIGH RISK</v-btn>
              <v-btn x-small value="orders" class="font-weight-black text-caption">ORDERS</v-btn>
              <v-btn x-small value="admitted" class="font-weight-black text-caption">ADMITTED</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table :headers="headers" :items="filteredPatients" class="gov-table" :items-per-page="10" tile elevation="0">
            <template v-slot:item.displayName="{ item }">
              <nuxt-link :to="`/clinical/patients/${item.id}`" class="patient-link font-weight-black gov-text-primary">{{ item.displayName }}</nuxt-link>
              <div class="text-caption grey--text font-weight-bold">{{ item.mrn }} · {{ item.gender || 'N/A' }} · {{ item.age || 'Age N/A' }}</div>
            </template>
            <template v-slot:item.currentDepartment="{ item }">
              <span class="font-weight-black">{{ item.currentDepartment }}</span>
              <div class="text-caption grey--text">{{ item.serviceRouting || item.specialtyRouting || 'General medicine' }}</div>
            </template>
            <template v-slot:item.riskLevel="{ item }">
              <v-chip x-small label dark :color="riskColor(item.riskLevel)" class="font-weight-black">{{ item.riskLevel.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.work="{ item }">
              <div class="text-caption font-weight-black">Orders: {{ item.openOrders.length }}</div>
              <div class="text-caption grey--text">Tasks: {{ item.openTasks.length }}</div>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon small v-on="on" :to="`/clinical/patients/${item.id}/encounter/medical`"><v-icon color="#003366">mdi-medical-bag</v-icon></v-btn>
                </template>
                <span>Medical consultation</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon small v-on="on" :to="`/clinical/patients/${item.id}`"><v-icon color="#00A99D">mdi-chart-box</v-icon></v-btn>
                </template>
                <span>Open chart</span>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption text-uppercase ls-1">Level 1 hospital pathway</div>
          <div class="pa-5">
            <div v-for="step in pathway" :key="step.title" class="path-step mb-3">
              <v-avatar tile size="30" :color="step.color" class="mr-3"><v-icon dark small>{{ step.icon }}</v-icon></v-avatar>
              <div>
                <div class="text-caption font-weight-black gov-text-primary text-uppercase">{{ step.title }}</div>
                <div class="text-caption grey--text">{{ step.text }}</div>
              </div>
            </div>
          </div>
        </v-card>

        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom font-weight-black grey--text text-caption text-uppercase ls-1">Common level 1 decisions</div>
          <v-list dense class="pa-0">
            <v-list-item v-for="decision in decisions" :key="decision" class="border-bottom">
              <v-list-item-icon class="mr-3"><v-icon small color="#003366">mdi-check-circle</v-icon></v-list-item-icon>
              <v-list-item-title class="text-caption font-weight-bold">{{ decision }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Doctor Worklist' },
  data() {
    return {
      filter: 'all',
      headers: [
        { text: 'PATIENT', value: 'displayName' },
        { text: 'LOCATION', value: 'currentDepartment' },
        { text: 'RISK', value: 'riskLevel', align: 'center' },
        { text: 'WORK', value: 'work', align: 'center' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ],
      pathway: [
        { title: 'Review triage', text: 'Vitals, pain, GCS, acuity and allergies before seeing the patient.', icon: 'mdi-heart-pulse', color: '#00A99D' },
        { title: 'Consult and diagnose', text: 'History, examination, primary and differential diagnoses.', icon: 'mdi-stethoscope', color: '#003366' },
        { title: 'Order and treat', text: 'Prescriptions, labs, imaging, nursing tasks and billing items.', icon: 'mdi-pill', color: '#0B3D2E' },
        { title: 'Disposition', text: 'Discharge, admit, refer, follow up or emergency escalation.', icon: 'mdi-door-open', color: '#D97706' }
      ],
      decisions: ['Discharge home with instructions', 'Admit to ward', 'Refer to higher-level facility', 'Schedule follow-up', 'Request lab or imaging', 'Create nursing task']
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/patientDirectory'] || [] },
    filteredPatients() {
      const base = this.patients.filter(patient => patient.riskLevel !== 'low' || patient.latestVitals || patient.openOrders.length || patient.activeInpatient)
      if (this.filter === 'high') return base.filter(patient => patient.riskLevel === 'high')
      if (this.filter === 'orders') return base.filter(patient => patient.openOrders.length > 0)
      if (this.filter === 'admitted') return base.filter(patient => patient.activeInpatient)
      return base
    },
    metrics() {
      return [
        { label: 'Doctor queue', value: this.filteredPatients.length, helper: 'Patients needing medical action', icon: 'mdi-account-heart', color: '#003366' },
        { label: 'High risk', value: this.patients.filter(patient => patient.riskLevel === 'high').length, helper: 'Priority review', icon: 'mdi-alert-octagon', color: '#C0392B' },
        { label: 'Pending orders', value: this.patients.reduce((total, patient) => total + patient.openOrders.length, 0), helper: 'Lab and imaging follow-up', icon: 'mdi-flask', color: '#D97706' },
        { label: 'Admitted', value: this.patients.filter(patient => patient.activeInpatient).length, helper: 'Ward follow-up', icon: 'mdi-bed', color: '#0B3D2E' }
      ]
    }
  },
  methods: {
    riskColor(level) { return { high: '#C0392B', medium: '#D97706', low: '#1F7A5C' }[level] || '#6B7280' }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.h-100 { height: 100%; }
.b-1 { border: 1px solid #E5E7EB; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.path-step { display:flex; align-items:flex-start; border-bottom:1px solid #EEF2F7; padding-bottom:10px; }
.patient-link { text-decoration:none; }
.patient-link:hover { text-decoration:underline; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
