<template>
  <v-container fluid class="gov-content pa-8">
    <nurse-patient-header :patient="patient" />
    <v-row>
      <v-col cols="12" lg="8">
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom text-caption font-weight-black grey--text text-uppercase ls-1">Documents and reports</div>
          <v-data-table :headers="headers" :items="chart.documents" dense class="gov-table"></v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-navy white--text text-caption font-weight-black text-uppercase ls-1">Create document shell</div>
          <div class="pa-5">
            <v-select v-model="form.documentType" :items="['wound_report','nursing_summary','discharge_instructions','incident_report']" outlined tile dense label="Document type"></v-select>
            <v-text-field v-model="form.title" outlined tile dense label="Title"></v-text-field>
            <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="saveDocument"><v-icon left small>mdi-file-plus</v-icon>Create document</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import NursePatientHeader from '~/components/nursing/NursePatientHeader.vue'

export default {
  components: { NursePatientHeader },
  layout: 'admins',
  head: { title: 'Nursing Documents' },
  data() { return { form: { documentType: 'nursing_summary', title: '' }, headers: [{ text: 'TITLE', value: 'title' }, { text: 'TYPE', value: 'documentType' }, { text: 'STATUS', value: 'status' }, { text: 'CREATED', value: 'createdAt' }] } },
  computed: {
    patientId() { return this.$route.params.id },
    patient() { return (this.$store.getters['clinical/patientDirectory'] || []).find(item => item.id === this.patientId) || {} },
    chart() { return this.$store.getters['nursing/patientNursing360'](this.patientId) }
  },
  mounted() { this.$store.commit('nursing/LOAD_FROM_STORAGE') },
  methods: { saveDocument() { this.$store.dispatch('nursing/createDocument', { ...this.form, patientId: this.patientId, status: 'active' }); this.form.title = '' } }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.bg-navy { background:#003366 !important; }
.b-1 { border:1px solid #E5E7EB; }
.border-bottom { border-bottom:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing:0.8px !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
