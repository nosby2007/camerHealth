<template>
  <v-container fluid class="gov-content pa-8">
    <nurse-patient-header :patient="patient" />
    <v-row>
      <v-col cols="12" lg="5"><wound-card :wound="wound" :assessments="assessments" :detail-to="$route.fullPath" /></v-col>
      <v-col cols="12" lg="7">
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden mb-6">
          <div class="pa-4 bg-navy white--text text-caption font-weight-black text-uppercase ls-1">Wound Intelligence assessment</div>
          <div class="pa-5">
            <v-row dense>
              <v-col cols="4"><v-text-field v-model.number="form.lengthCm" type="number" outlined tile dense label="Length cm"></v-text-field></v-col>
              <v-col cols="4"><v-text-field v-model.number="form.widthCm" type="number" outlined tile dense label="Width cm"></v-text-field></v-col>
              <v-col cols="4"><v-text-field v-model.number="form.depthCm" type="number" outlined tile dense label="Depth cm"></v-text-field></v-col>
              <v-col cols="6"><v-select v-model="form.drainageAmount" :items="['none','scant','small','moderate','large']" outlined tile dense label="Drainage"></v-select></v-col>
              <v-col cols="6"><v-text-field v-model="form.dressingType" outlined tile dense label="Dressing"></v-text-field></v-col>
              <v-col cols="12"><v-textarea v-model="form.treatmentPlan" outlined tile dense rows="3" label="Treatment plan"></v-textarea></v-col>
            </v-row>
            <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="saveAssessment"><v-icon left small>mdi-content-save</v-icon>Save assessment</v-btn>
          </div>
        </v-card>
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom text-caption font-weight-black grey--text text-uppercase ls-1">Assessment trend</div>
          <v-data-table :headers="headers" :items="assessments" dense hide-default-footer class="gov-table"></v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import NursePatientHeader from '~/components/nursing/NursePatientHeader.vue'
import WoundCard from '~/components/nursing/WoundCard.vue'

export default {
  components: { NursePatientHeader, WoundCard },
  layout: 'admins',
  head: { title: 'Wound Detail' },
  data() { return { form: { lengthCm: 0, widthCm: 0, depthCm: 0, drainageAmount: 'none', dressingType: '', treatmentPlan: '' }, headers: [{ text: 'DATE', value: 'createdAt' }, { text: 'SURFACE', value: 'surfaceArea' }, { text: 'VOLUME', value: 'volume' }, { text: 'PAIN', value: 'painScore' }] } },
  computed: {
    patientId() { return this.$route.params.id },
    woundId() { return this.$route.params.woundId },
    patient() { return (this.$store.getters['clinical/patientDirectory'] || []).find(item => item.id === this.patientId) || {} },
    chart() { return this.$store.getters['nursing/patientNursing360'](this.patientId) },
    wound() { return this.chart.wounds.find(item => item.id === this.woundId) || {} },
    assessments() { return this.$store.getters['nursing/woundTrend'](this.woundId) }
  },
  mounted() { this.$store.commit('nursing/LOAD_FROM_STORAGE') },
  methods: { saveAssessment() { this.$store.dispatch('nursing/createWoundAssessment', { ...this.form, woundId: this.woundId, patientId: this.patientId }) } }
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
