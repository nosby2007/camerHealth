<template>
  <v-container fluid class="gov-content pa-8">
    <nurse-patient-header :patient="patient" />
    <v-row>
      <v-col cols="12" lg="8">
        <v-row dense>
          <v-col v-for="wound in chart.wounds" :key="wound.id" cols="12" md="6">
            <wound-card :wound="wound" :assessments="assessmentsFor(wound.id)" :detail-to="`/clinical/nursing/patients/${patientId}/wounds/${wound.id}`" />
          </v-col>
          <v-col v-if="!chart.wounds.length" cols="12"><v-alert tile color="#F8FAFC" class="b-1 text-caption grey--text">No wound records yet.</v-alert></v-col>
        </v-row>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-navy white--text text-caption font-weight-black text-uppercase ls-1">New wound problem</div>
          <div class="pa-5">
            <v-text-field v-model="form.woundType" outlined tile dense label="Wound type"></v-text-field>
            <v-text-field v-model="form.anatomicalLocation" outlined tile dense label="Anatomical location"></v-text-field>
            <v-select v-model="form.acquiredLocation" :items="['present_on_admission','facility_acquired','community_acquired','unknown']" outlined tile dense label="Acquired location"></v-select>
            <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="saveWound"><v-icon left small>mdi-plus</v-icon>Create wound</v-btn>
          </div>
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
  head: { title: 'Skin & Wound Navigator' },
  data() { return { form: { woundType: '', anatomicalLocation: '', acquiredLocation: 'unknown', status: 'active' } } },
  computed: {
    patientId() { return this.$route.params.id },
    patient() { return (this.$store.getters['clinical/patientDirectory'] || []).find(item => item.id === this.patientId) || {} },
    chart() { return this.$store.getters['nursing/patientNursing360'](this.patientId) }
  },
  mounted() {
    this.$store.commit('nursing/LOAD_FROM_STORAGE')
    this.$store.dispatch('nursing/loadPatientChart', this.patientId)
  },
  methods: {
    assessmentsFor(woundId) { return this.chart.woundAssessments.filter(item => item.woundId === woundId) },
    saveWound() { this.$store.dispatch('nursing/createWound', { ...this.form, patientId: this.patientId }); this.form = { woundType: '', anatomicalLocation: '', acquiredLocation: 'unknown', status: 'active' } }
  }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.bg-navy { background:#003366 !important; }
.b-1 { border:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing:0.8px !important; }
</style>
