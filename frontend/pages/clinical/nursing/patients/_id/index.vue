<template>
  <v-container fluid class="gov-content pa-8">
    <nurse-patient-header :patient="patient" />
    <v-row>
      <v-col cols="12" lg="8">
        <v-row dense class="mb-6">
          <v-col v-for="item in quickLinks" :key="item.title" cols="12" sm="6" lg="3">
            <v-card flat tile class="gov-card b-1 pa-4 h-100 shadow-sm quick-card" :to="item.to">
              <v-icon :color="item.color" class="mb-3">{{ item.icon }}</v-icon>
              <div class="text-caption font-weight-black gov-text-primary text-uppercase">{{ item.title }}</div>
              <div class="text-caption grey--text mt-1">{{ item.text }}</div>
            </v-card>
          </v-col>
        </v-row>
        <clinical-avatar :markers="chart.markers" class="mb-6" />
        <nurse-task-list :tasks="chart.tasks" @status-change="updateTaskStatus" />
      </v-col>
      <v-col cols="12" lg="4">
        <clinical-flags :patient="patient" :tasks="chart.tasks" :wounds="chart.wounds" :wound-assessments="chart.woundAssessments" class="mb-6" />
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom text-caption font-weight-black grey--text text-uppercase ls-1">Recent clinical notes</div>
          <v-list dense class="pa-0">
            <v-list-item v-for="note in recentNotes" :key="note.id" class="border-bottom">
              <v-list-item-content>
                <v-list-item-title class="text-caption font-weight-black gov-text-primary">{{ note.title || note.noteType }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ note.status }} · {{ note.createdAt }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="!recentNotes.length"><v-list-item-title class="text-caption grey--text">No notes yet.</v-list-item-title></v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import NursePatientHeader from '~/components/nursing/NursePatientHeader.vue'
import ClinicalAvatar from '~/components/nursing/ClinicalAvatar.vue'
import ClinicalFlags from '~/components/nursing/ClinicalFlags.vue'
import NurseTaskList from '~/components/nursing/NurseTaskList.vue'

export default {
  components: { NursePatientHeader, ClinicalAvatar, ClinicalFlags, NurseTaskList },
  layout: 'admins',
  head: { title: 'Patient 360' },
  computed: {
    patientId() { return this.$route.params.id },
    patient() { return (this.$store.getters['clinical/patientDirectory'] || []).find(item => item.id === this.patientId) || {} },
    chart() { return this.$store.getters['nursing/patientNursing360'](this.patientId) },
    recentNotes() { return [...this.chart.notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6) },
    quickLinks() {
      const base = `/clinical/nursing/patients/${this.patientId}`
      return [
        { title: 'Body Map', text: 'Clinical Avatar markers', icon: 'mdi-human', color: '#003366', to: `${base}/body-map` },
        { title: 'Wounds', text: 'Skin & Wound Navigator', icon: 'mdi-bandage', color: '#00A99D', to: `${base}/wounds` },
        { title: 'Assessment', text: 'Structured nursing exam', icon: 'mdi-clipboard-pulse', color: '#D97706', to: `${base}/assessment` },
        { title: 'Notes', text: 'Clinical Clipboard', icon: 'mdi-clipboard-edit', color: '#0B3D2E', to: `${base}/notes` }
      ]
    }
  },
  mounted() {
    this.$store.commit('nursing/LOAD_FROM_STORAGE')
    this.$store.dispatch('nursing/loadPatientChart', this.patientId)
  },
  methods: { updateTaskStatus(payload) { this.$store.dispatch('nursing/updateTaskStatus', payload) } }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.gov-text-primary { color:#1B1F23 !important; }
.quick-card { text-decoration:none; cursor:pointer; }
.quick-card:hover { border-color:#003366; }
.b-1 { border:1px solid #E5E7EB; }
.border-bottom { border-bottom:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.h-100 { height:100%; }
.ls-1 { letter-spacing:0.8px !important; }
</style>
