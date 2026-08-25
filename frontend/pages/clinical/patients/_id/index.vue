<template>
  <div class="patient-detail-page">
    <v-container v-if="loading" class="text-center pa-12">
      <v-progress-circular indeterminate color="#003366" size="48" />
      <div class="mt-4 font-weight-bold grey--text text--darken-1">Loading Patient Chart...</div>
    </v-container>

    <ClinicalWorkspace
      v-else-if="patient"
      :patient-id="resolvedPatientId"
      :patient-record="patient"
      patient-scoped
    />

    <v-alert v-else type="error" tile dense class="ma-4">
      {{ patientId ? 'Patient chart not found or unavailable.' : 'No patient ID specified.' }}
      <nuxt-link to="/clinical/patients" class="white--text font-weight-black ml-2">Back to patient list</nuxt-link>
    </v-alert>
  </div>
</template>

<script>
import ClinicalWorkspace from '~/components/clinical/ClinicalWorkspace.vue'
import { patientApi } from '~/services/api'

export default {
  name: 'PatientWorkflow360Page',
  layout: 'admins',
  components: { ClinicalWorkspace },
  data() {
    return {
      ready: false,
      loading: true,
      loadedPatient: null
    }
  },
  computed: {
    patientId() {
      return this.$route.params.id
    },
    allPatients() {
      const directory = this.$store.getters['clinical/patientDirectory'] || []
      const scopedPatients = this.$store.getters['clinical/patientDirectoryAll'] || []
      return Array.from(new Map(
        [...directory, ...scopedPatients]
          .filter(patient => patient && patient.id)
          .map(patient => [patient.id, patient])
      ).values())
    },
    patient() {
      if (!this.patientId) return null
      const q = String(this.patientId).trim().toLowerCase()
      if (this.loadedPatient && [this.loadedPatient.id, this.loadedPatient.mrn, this.loadedPatient.externalId]
        .some(value => String(value || '').toLowerCase() === q)) {
        return this.loadedPatient
      }
      return this.allPatients.find(p =>
        String(p.id || '').toLowerCase() === q ||
        String(p.mrn || '').toLowerCase() === q ||
        String(p.externalId || '').toLowerCase() === q
      ) || null
    },
    resolvedPatientId() {
      return this.patient ? this.patient.id : (this.patientId || '')
    }
  },
  async mounted() {
    this.$store.commit('facility/RELOAD_FROM_STORAGE')
    if (this.$store.hasModule && this.$store.hasModule('nursing')) {
      this.$store.commit('nursing/LOAD_FROM_STORAGE')
    }

    if (this.patientId) {
      try {
        const { data } = await patientApi.get(this.patientId)
        if (data) {
          const rec = data.patient || data
          this.loadedPatient = rec
          this.$store.commit('clinical/UPSERT_PATIENT', rec)
        }
      } catch (err) {
        console.warn('Direct API lookup failed for patient chart:', this.patientId, err)
      }
    }

    this.loading = false
    this.ready = true
  }
}
</script>

<style scoped>
.patient-detail-page {
  min-height: 100vh;
  background: #dbe8e5;
}
</style>
