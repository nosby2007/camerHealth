<template>
  <v-container fluid class="gov-content pa-8">
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap" style="gap:12px">
      <div>
        <div class="text-caption font-weight-black grey--text text-uppercase ls-1 mb-1">NURSE MODULE</div>
        <h1 class="text-h4 font-weight-black gov-text-primary uppercase mb-1">Nurse Command Center</h1>
        <div class="text-caption grey--text font-weight-bold">Patient 360, Clinical Avatar, Skin & Wound Navigator, Clinical Clipboard and Nurse TaskFlow</div>
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
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-icon color="#003366" small>mdi-account-heart</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Assigned patient queue</span>
            <v-spacer />
            <v-btn-toggle v-model="filter" tile dense>
              <v-btn x-small value="all" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="tasks" class="font-weight-black text-caption">TASKS</v-btn>
              <v-btn x-small value="wounds" class="font-weight-black text-caption">WOUNDS</v-btn>
              <v-btn x-small value="high" class="font-weight-black text-caption">HIGH RISK</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table :headers="headers" :items="filteredPatients" class="gov-table" :items-per-page="10" tile elevation="0">
            <template v-slot:item.displayName="{ item }">
              <nuxt-link :to="`/clinical/nursing/patients/${item.id}`" class="patient-link font-weight-black gov-text-primary">{{ item.displayName }}</nuxt-link>
              <div class="text-caption grey--text font-weight-bold">{{ item.mrn }} · {{ item.gender || 'N/A' }}</div>
            </template>
            <template v-slot:item.riskLevel="{ item }"><v-chip x-small label dark :color="riskColor(item.riskLevel)" class="font-weight-black">{{ item.riskLevel || 'standard' }}</v-chip></template>
            <template v-slot:item.work="{ item }">
              <div class="text-caption font-weight-black">{{ patientTasks(item.id).length }} task(s)</div>
              <div class="text-caption grey--text">{{ patientWounds(item.id).length }} wound(s)</div>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon small :to="`/clinical/nursing/patients/${item.id}`"><v-icon color="#003366">mdi-view-dashboard</v-icon></v-btn>
              <v-btn icon small :to="`/clinical/nursing/patients/${item.id}/tasks`"><v-icon color="#00A99D">mdi-format-list-checks</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <nurse-task-list :tasks="openTasks" @status-change="updateTaskStatus" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import NurseTaskList from '~/components/nursing/NurseTaskList.vue'

export default {
  components: { NurseTaskList },
  layout: 'admins',
  head: { title: 'Nurse Command Center' },
  data() {
    return {
      filter: 'all',
      headers: [
        { text: 'PATIENT', value: 'displayName' },
        { text: 'RISK', value: 'riskLevel', align: 'center' },
        { text: 'NURSING WORK', value: 'work', align: 'center' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/patientDirectory'] || [] },
    tasks() { return this.$store.getters['nursing/getTasks'] || [] },
    wounds() { return this.$store.getters['nursing/getWounds'] || [] },
    openTasks() { return this.tasks.filter(task => ['pending', 'in_progress'].includes(task.status)) },
    metrics() {
      const base = this.$store.getters['nursing/nurseDashboardMetrics'] || {}
      return [
        { label: 'Assigned patients', value: base.assignedPatients || this.patients.length, helper: 'Visible clinical queue', icon: 'mdi-account-group', color: '#003366' },
        { label: 'Open tasks', value: base.openTasks || 0, helper: 'Pending or in progress', icon: 'mdi-format-list-checks', color: '#D97706' },
        { label: 'Active wounds', value: base.activeWounds || 0, helper: 'Skin and wound follow-up', icon: 'mdi-bandage', color: '#00A99D' },
        { label: 'Unsigned notes', value: base.unsignedNotes || 0, helper: 'Draft notes to finalize', icon: 'mdi-clipboard-edit', color: '#0B3D2E' }
      ]
    },
    filteredPatients() {
      if (this.filter === 'tasks') return this.patients.filter(patient => this.patientTasks(patient.id).length)
      if (this.filter === 'wounds') return this.patients.filter(patient => this.patientWounds(patient.id).length)
      if (this.filter === 'high') return this.patients.filter(patient => patient.riskLevel === 'high')
      return this.patients
    }
  },
  mounted() { this.$store.commit('nursing/LOAD_FROM_STORAGE') },
  methods: {
    patientTasks(id) { return this.tasks.filter(task => task.patientId === id && ['pending', 'in_progress'].includes(task.status)) },
    patientWounds(id) { return this.wounds.filter(wound => wound.patientId === id && !['healed', 'closed'].includes(wound.status)) },
    riskColor(level) { return { high: '#C0392B', medium: '#D97706', low: '#1F7A5C' }[level] || '#003366' },
    updateTaskStatus(payload) { this.$store.dispatch('nursing/updateTaskStatus', payload) }
  }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.gov-text-primary { color:#1B1F23 !important; }
.border-bottom { border-bottom:1px solid #E5E7EB; }
.ls-1 { letter-spacing:0.8px !important; }
.uppercase { text-transform:uppercase; }
.h-100 { height:100%; }
.b-1 { border:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.patient-link { text-decoration:none; }
.patient-link:hover { text-decoration:underline; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
