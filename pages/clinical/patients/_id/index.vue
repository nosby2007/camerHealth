<template>
  <div class="patient-detail-page">
    <div v-if="!ready" class="patient-loading" role="status" aria-live="polite">
      <v-progress-circular indeterminate color="#0f766e" size="32" width="3" />
      <strong>Loading patient chart...</strong>
    </div>

    <v-alert v-else-if="!patient" type="error" tile dense class="ma-4">
      Patient not found.
      <nuxt-link to="/clinical/patients" class="white--text font-weight-black">Back to patient list</nuxt-link>
    </v-alert>

    <ClinicalWorkspace
      v-else
      :patient-id="patientId"
      patient-scoped
    />
  </div>
</template>

<script>
import ClinicalWorkspace from '~/components/clinical/ClinicalWorkspace.vue'

export default {
  name: 'PatientWorkflow360Page',
  layout: 'admins',
  components: { ClinicalWorkspace },
  data() {
    return { ready: false }
  },
  computed: {
    patientId() {
      return this.$route.params.id
    },
    patient() {
      const patients = this.$store.getters['clinical/patientDirectory'] || []
      return patients.find(patient => patient.id === this.patientId) || null
    }
  },
  mounted() {
    this.$store.commit('clinical/LOAD_FROM_STORAGE')
    this.$store.commit('facility/RELOAD_FROM_STORAGE')
    if (this.$store.hasModule && this.$store.hasModule('nursing')) {
      this.$store.commit('nursing/LOAD_FROM_STORAGE')
    }
    this.ready = true
  }
}
</script>

<style scoped>
.patient-detail-page {
  min-height: 100vh;
  background: #dbe8e5;
}

.patient-loading {
  min-height: 55vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #274b4c;
  font-size: 13px;
}
</style>
