
<template>
  <v-container fluid class="pa-8 gov-content">
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap" style="gap:12px">
      <div>
        <div class="text-caption font-weight-black grey--text text-uppercase ls-1 mb-1">HOSPITAL EMR COMMAND CENTER</div>
        <h1 class="text-h4 font-weight-black gov-text-primary uppercase mb-1">{{ institution }}</h1>
        <div class="text-caption grey--text font-weight-bold">Live patient flow, intake readiness and department worklists</div>
      </div>
      <div class="d-flex align-center flex-wrap" style="gap:8px">
        <v-chip label color="#003366" dark class="font-weight-black">
          <v-icon left small>mdi-account-key</v-icon>{{ userRole.replace('_', ' ') }}
        </v-chip>
        <v-btn tile depressed color="#00A99D" dark class="font-weight-black text-caption" to="/clinical/patients/new">
          <v-icon left small>mdi-account-plus</v-icon>New intake
        </v-btn>
      </div>
    </div>

    <v-row dense class="mb-6">
      <v-col cols="12" sm="6" lg="3" v-for="metric in metrics" :key="metric.label">
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

    <v-card flat tile class="gov-card b-1 shadow-sm mb-6">
      <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
        <v-icon color="#003366" small>mdi-apps</v-icon>
        <span class="text-caption font-weight-black grey--text text-uppercase ls-1">EMR capability suite</span>
      </div>
      <v-row dense class="pa-4">
        <v-col cols="12" sm="6" md="3" v-for="feature in featureTiles" :key="feature.title">
          <v-card flat tile class="feature-tile pa-4 h-100" :to="feature.to">
            <div class="d-flex align-center mb-3">
              <v-avatar tile size="32" :color="feature.color" class="mr-3"><v-icon dark small>{{ feature.icon }}</v-icon></v-avatar>
              <div class="text-caption font-weight-black gov-text-primary text-uppercase">{{ feature.title }}</div>
            </div>
            <div class="text-h5 font-weight-black gov-text-primary">{{ feature.value }}</div>
            <div class="text-caption grey--text font-weight-bold">{{ feature.helper }}</div>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card flat tile class="gov-card b-1 shadow-sm mb-6">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-icon color="#003366" small>mdi-source-branch</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Department patient flow</span>
            <v-spacer />
            <v-chip x-small label color="#F3F4F6" class="font-weight-black grey--text text--darken-2">{{ queueSummary }}</v-chip>
          </div>
          <v-row dense class="pa-4">
            <v-col cols="12" md="6" v-for="queue in departmentQueues" :key="queue.key">
              <v-card flat tile class="flow-card pa-4 h-100" :style="{ borderLeftColor: queue.color }">
                <div class="d-flex align-center mb-3">
                  <v-avatar tile size="32" :color="queue.color" class="mr-3"><v-icon dark small>{{ queue.icon }}</v-icon></v-avatar>
                  <div class="flex-grow-1 min-width-0">
                    <div class="text-caption font-weight-black gov-text-primary text-uppercase text-truncate">{{ queue.title }}</div>
                    <div class="text-caption grey--text">{{ queue.nextAction }}</div>
                  </div>
                  <div class="text-h5 font-weight-black gov-text-primary ml-2">{{ queue.total }}</div>
                </div>
                <div class="d-flex align-center justify-space-between">
                  <span class="text-caption grey--text font-weight-bold">High risk: {{ queue.highRisk }}</span>
                  <v-btn x-small tile text color="#003366" class="font-weight-black" :to="queueRoute(queue.key)">
                    Open
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>

        <v-card flat tile class="gov-card b-1 shadow-sm">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
            <v-icon color="#C0392B" small class="mr-2">mdi-alert-pulse</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Priority patient worklist</span>
          </div>
          <v-data-table :headers="patientHeaders" :items="priorityPatients" class="gov-table" :items-per-page="8" tile elevation="0">
            <template v-slot:item.displayName="{ item }">
              <nuxt-link :to="`/clinical/patients/${item.id}`" class="patient-link font-weight-black gov-text-primary">
                {{ item.displayName }}
              </nuxt-link>
              <div class="text-caption grey--text font-weight-bold">{{ item.mrn }}</div>
            </template>
            <template v-slot:item.riskLevel="{ item }">
              <v-chip x-small dark label :color="riskColor(item.riskLevel)" class="font-weight-black">{{ item.riskLevel.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.openOrders="{ item }">
              <span class="text-caption font-weight-black">{{ item.openOrders.length }}</span>
            </template>
            <template v-slot:item.openTasks="{ item }">
              <span class="text-caption font-weight-black">{{ item.openTasks.length }}</span>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon small :to="`/clinical/patients/${item.id}`"><v-icon small color="#003366">mdi-open-in-new</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 shadow-sm mb-6">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption text-uppercase ls-1">Operational throughput</div>
          <div class="pa-4">
            <apexchart height="260" type="bar" :options="chartOptions" :series="chartSeries"></apexchart>
          </div>
        </v-card>

        <v-card flat tile class="gov-card b-1 shadow-sm">
          <div class="pa-4 bg-grey lighten-4 border-bottom font-weight-black grey--text text-caption text-uppercase ls-1">Recent chart activity</div>
          <v-list dense class="pa-0">
            <v-list-item v-for="patient in recentPatients" :key="patient.id" class="border-bottom py-2" :to="`/clinical/patients/${patient.id}`">
              <v-list-item-avatar tile :color="riskColor(patient.riskLevel)" class="mr-3"><v-icon dark small>mdi-account</v-icon></v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title class="text-caption font-weight-black gov-text-primary">{{ patient.displayName }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ patient.currentDepartment }} · {{ formatDate(patient.lastActivityAt || patient.createdAt) }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <div v-if="recentPatients.length === 0" class="pa-8 text-center grey--text text-caption font-weight-bold">No patient records yet</div>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Hospital EMR Command Center' },
  computed: {
    institution() { return this.$store.state.auth.institution || 'Unknown Facility' },
    userRole() { return this.$store.state.auth.role || 'GUEST' },
    patients() { return this.$store.getters['clinical/patientDirectory'] || [] },
    departmentQueues() { return this.$store.getters['clinical/departmentQueues'] || [] },
    commandMetrics() { return this.$store.getters['clinical/clinicalCommandMetrics'] || {} },
    visits() { return this.$store.getters['clinical/getVisits'] || [] },
    metrics() {
      return [
        { label: 'Active patients', value: this.commandMetrics.activePatients || 0, helper: 'Currently moving through care', icon: 'mdi-account-heart', color: '#003366' },
        { label: 'High risk', value: this.commandMetrics.highRiskPatients || 0, helper: 'Needs priority review', icon: 'mdi-alert-octagon', color: '#C0392B' },
        { label: 'Pending diagnostics', value: this.commandMetrics.pendingDiagnostics || 0, helper: 'Lab and imaging not completed', icon: 'mdi-flask-outline', color: '#D97706' },
        { label: 'Open tasks', value: this.commandMetrics.openTasks || 0, helper: 'Care-team worklist items', icon: 'mdi-format-list-checks', color: '#6D28D9' }
      ]
    },
    featureTiles() {
      return [
        { title: 'Appointments', value: this.$store.getters['clinical/getAppointments'].length, helper: 'Scheduling calendar', icon: 'mdi-calendar-clock', color: '#4B5563', to: '/clinical/appointments' },
        { title: 'Billing', value: this.$store.getters['clinical/getInvoices'].length, helper: 'Invoices and payments', icon: 'mdi-receipt', color: '#00A99D', to: '/clinical/billing' },
        { title: 'Claims', value: this.commandMetrics.pendingClaims || 0, helper: 'Insurance workqueue', icon: 'mdi-shield-check', color: '#0B3D2E', to: '/clinical/insurance' },
        { title: 'Documents', value: this.commandMetrics.filedDocuments || 0, helper: 'Chart documents', icon: 'mdi-file-document-multiple', color: '#003366', to: '/clinical/documents' },
        { title: 'Templates', value: this.$store.getters['clinical/getMedicalTemplates'].length, helper: 'Smart phrases', icon: 'mdi-text-box-check', color: '#6D28D9', to: '/clinical/templates' },
        { title: 'Referrals', value: this.commandMetrics.openReferrals || 0, helper: 'Open transfers', icon: 'mdi-account-arrow-right', color: '#D97706', to: '/clinical/referrals' },
        { title: 'Portal', value: this.commandMetrics.unreadPortalMessages || 0, helper: 'Unread messages', icon: 'mdi-cellphone-message', color: '#C0392B', to: '/clinical/portal' },
        { title: 'Voice', value: this.$store.getters['clinical/getVoiceDrafts'].length, helper: 'Dictation drafts', icon: 'mdi-microphone', color: '#1F7A5C', to: '/clinical/voice' }
      ]
    },
    queueSummary() {
      const busiest = this.commandMetrics.busiestQueue
      return busiest && busiest.title ? `Busiest: ${busiest.title}` : 'No active queue'
    },
    priorityPatients() {
      const rank = { high: 1, medium: 2, low: 3 }
      return [...this.patients]
        .filter(patient => patient.riskLevel !== 'low' || patient.openOrders.length || patient.openTasks.length)
        .sort((a, b) => (rank[a.riskLevel] - rank[b.riskLevel]) || new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0))
    },
    recentPatients() {
      return [...this.patients]
        .sort((a, b) => new Date(b.lastActivityAt || b.createdAt || 0) - new Date(a.lastActivityAt || a.createdAt || 0))
        .slice(0, 8)
    },
    patientHeaders() {
      return [
        { text: 'PATIENT', value: 'displayName' },
        { text: 'DEPARTMENT', value: 'currentDepartment' },
        { text: 'RISK', value: 'riskLevel', align: 'center' },
        { text: 'ORDERS', value: 'openOrders', align: 'center' },
        { text: 'TASKS', value: 'openTasks', align: 'center' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    },
    chartSeries() {
      const currentDay = new Date().getDay()
      const counts = Array.from({ length: 7 }, (_, index) => {
        const dayIndex = (currentDay - 6 + index + 7) % 7
        return this.visits.filter(visit => new Date(visit.createdAt).getDay() === dayIndex).length
      })
      return [{ name: 'Encounters', data: counts }]
    },
    chartOptions() {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const currentDay = new Date().getDay()
      return {
        chart: { type: 'bar', toolbar: { show: false }, sparkline: { enabled: false } },
        colors: ['#00A99D'],
        plotOptions: { bar: { columnWidth: '46%', borderRadius: 0 } },
        xaxis: { categories: Array.from({ length: 7 }, (_, index) => days[(currentDay - 6 + index + 7) % 7]) },
        grid: { borderColor: '#E5E7EB' },
        dataLabels: { enabled: false }
      }
    }
  },
  methods: {
    formatDate(value) {
      if (!value) return 'No activity'
      return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })
    },
    riskColor(level) {
      return { high: '#C0392B', medium: '#D97706', low: '#1F7A5C' }[level] || '#6B7280'
    },
    queueRoute(key) {
      const routes = {
        'front-desk': '/clinical/patients',
        triage: '/clinical/patients',
        provider: '/clinical/visits',
        diagnostics: '/clinical/lab',
        inpatient: '/clinical/inpatient',
        scheduled: '/clinical/appointments',
        'task-worklist': '/clinical/patients',
        beds: '/clinical/inpatient'
      }
      return routes[key] || '/clinical/patients'
    }
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
.flow-card { border: 1px solid #E5E7EB; border-left: 4px solid #003366; background: #FFFFFF; }
.feature-tile { border: 1px solid #E5E7EB; background: #FFFFFF; text-decoration: none; }
.feature-tile:hover { border-color: #00A99D; }
.min-width-0 { min-width: 0; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
.patient-link { color: inherit; text-decoration: none; }
.patient-link:hover { text-decoration: underline; }
</style>
