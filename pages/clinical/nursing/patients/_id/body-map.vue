<template>
  <v-container fluid class="gov-content pa-8">
    <nurse-patient-header :patient="patient" />
    <v-row>
      <v-col cols="12" lg="7"><clinical-avatar :markers="chart.markers" @marker-click="selectMarker" /></v-col>
      <v-col cols="12" lg="5">
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-navy white--text text-caption font-weight-black text-uppercase ls-1">Add body marker</div>
          <div class="pa-5">
            <v-row dense>
              <v-col cols="6"><v-text-field v-model.number="form.xPosition" type="number" outlined tile dense label="X %"></v-text-field></v-col>
              <v-col cols="6"><v-text-field v-model.number="form.yPosition" type="number" outlined tile dense label="Y %"></v-text-field></v-col>
              <v-col cols="12"><v-text-field v-model="form.bodyRegion" outlined tile dense label="Body region"></v-text-field></v-col>
              <v-col cols="6"><v-select v-model="form.markerType" :items="markerTypes" outlined tile dense label="Marker type"></v-select></v-col>
              <v-col cols="6"><v-select v-model="form.severity" :items="['low','moderate','high','critical']" outlined tile dense label="Severity"></v-select></v-col>
            </v-row>
            <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="saveMarker"><v-icon left small>mdi-map-marker-plus</v-icon>Add marker</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import NursePatientHeader from '~/components/nursing/NursePatientHeader.vue'
import ClinicalAvatar from '~/components/nursing/ClinicalAvatar.vue'

export default {
  components: { NursePatientHeader, ClinicalAvatar },
  layout: 'admins',
  head: { title: 'Clinical Avatar' },
  data() { return { markerTypes: ['wound','pressure_injury','surgical_incision','iv_line','foley_catheter','drain','rash','bruise','edema','pain_point'], form: { xPosition: 50, yPosition: 45, bodyRegion: '', markerType: 'wound', severity: 'moderate', viewType: 'anterior', status: 'active' } } },
  computed: {
    patientId() { return this.$route.params.id },
    patient() { return (this.$store.getters['clinical/patientDirectory'] || []).find(item => item.id === this.patientId) || {} },
    chart() { return this.$store.getters['nursing/patientNursing360'](this.patientId) }
  },
  mounted() { this.$store.commit('nursing/LOAD_FROM_STORAGE') },
  methods: {
    saveMarker() { this.$store.dispatch('nursing/createBodyMapMarker', { ...this.form, patientId: this.patientId }); this.form.bodyRegion = '' },
    selectMarker(marker) { this.form = { ...this.form, ...marker } }
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
