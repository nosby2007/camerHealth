<template>
  <div class="patient-detail-page">
    <v-container v-if="loading" class="text-center pa-12">
      <v-progress-circular indeterminate color="#003366" size="48" />
      <div class="mt-4 font-weight-bold grey--text text--darken-1">Loading Patient Chart...</div>
    </v-container>

    <ClinicalWorkspace
      v-else-if="patient"
      :patient-id="resolvedPatientId"
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
      loading: true
    }
  },
  computed: {
    patientId() {
      return this.$route.params.id
    },
    allPatients() {
      const dir = this.$store.getters['clinical/patientDirectory'] || []
      const raw = (this.$store.state.clinical && this.$store.state.clinical.patients) || []
      return [...dir, ...raw]
    },
    patient() {
      if (!this.patientId) return null
      const q = String(this.patientId).trim().toLowerCase()
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
    this.$store.commit('clinical/LOAD_FROM_STORAGE')
    this.$store.commit('facility/RELOAD_FROM_STORAGE')
    if (this.$store.hasModule && this.$store.hasModule('nursing')) {
      this.$store.commit('nursing/LOAD_FROM_STORAGE')
    }

    try {
      await this.$store.dispatch('clinical/fetchPatients')
    } catch (e) {
      console.warn('Could not fetch patient registry, using local state:', e)
    }

    if (!this.patient && this.patientId) {
      try {
        const { data } = await patientApi.get(this.patientId)
        if (data) {
          const rec = data.patient || data
          this.$store.commit('clinical/ADD_PATIENT', rec)
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
