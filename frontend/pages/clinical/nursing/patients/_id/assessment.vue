<template>
  <v-container fluid class="gov-content pa-8">
    <nurse-patient-header :patient="patient" />
    <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
      <div class="pa-4 bg-navy white--text text-caption font-weight-black text-uppercase ls-1">Nursing assessment</div>
      <div class="pa-5">
        <v-row dense>
          <v-col cols="12" md="4"><v-select v-model="form.assessmentType" :items="['triage','admission','shift','focused','discharge','home_care']" outlined tile dense label="Assessment type"></v-select></v-col>
          <v-col cols="12" md="4"><v-select v-model="form.mentalStatus" :items="['alert','confused','drowsy','stuporous','unresponsive']" outlined tile dense label="Mental status"></v-select></v-col>
          <v-col cols="12" md="4"><v-switch v-model="form.escalationRequired" color="#C0392B" label="Escalation required"></v-switch></v-col>
          <v-col cols="12" md="6"><v-textarea v-model="form.respiratory.notes" outlined tile rows="3" label="Respiratory"></v-textarea></v-col>
          <v-col cols="12" md="6"><v-textarea v-model="form.cardiovascular.notes" outlined tile rows="3" label="Cardiovascular"></v-textarea></v-col>
          <v-col cols="12" md="6"><v-textarea v-model="form.skin.notes" outlined tile rows="3" label="Skin"></v-textarea></v-col>
          <v-col cols="12" md="6"><v-textarea v-model="form.mobility.notes" outlined tile rows="3" label="Mobility and safety"></v-textarea></v-col>
          <v-col cols="12"><v-textarea v-model="form.escalationReason" outlined tile rows="2" label="Escalation reason"></v-textarea></v-col>
        </v-row>
        <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="saveAssessment"><v-icon left small>mdi-content-save</v-icon>Save assessment</v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import NursePatientHeader from '~/components/nursing/NursePatientHeader.vue'

export default {
  components: { NursePatientHeader },
  layout: 'admins',
  head: { title: 'Nursing Assessment' },
  data() { return { form: { assessmentType: 'shift', mentalStatus: 'alert', respiratory: {}, cardiovascular: {}, skin: {}, mobility: {}, escalationRequired: false, escalationReason: '' } } },
  computed: {
    patientId() { return this.$route.params.id },
    patient() { return (this.$store.getters['clinical/patientDirectory'] || []).find(item => item.id === this.patientId) || {} }
  },
  mounted() {
    this.$store.commit('nursing/LOAD_FROM_STORAGE')
    this.$store.dispatch('nursing/loadPatientChart', this.patientId)
  },
  methods: { saveAssessment() { this.$store.dispatch('nursing/createNursingAssessment', { ...this.form, patientId: this.patientId }); this.$toast && this.$toast.success('Assessment saved') } }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.bg-navy { background:#003366 !important; }
.b-1 { border:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing:0.8px !important; }
</style>
