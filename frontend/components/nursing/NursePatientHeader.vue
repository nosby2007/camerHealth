<template>
  <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
    <div class="pa-5 d-flex align-center justify-space-between flex-wrap" style="gap:14px">
      <div class="d-flex align-center">
        <v-avatar tile size="48" color="#003366" class="mr-4">
          <v-icon dark>
            mdi-account-heart
          </v-icon>
        </v-avatar>
        <div>
          <div class="text-caption grey--text font-weight-black text-uppercase ls-1">
            {{ $t('clinical360.nursing.patient_360') }}
          </div>
          <h2 class="text-h5 font-weight-black gov-text-primary mb-1">
            {{ displayName }}
          </h2>
          <div class="text-caption grey--text font-weight-bold">
            {{ mrn }} · {{ patient.gender || patient.sex || 'Sexe N/A' }} · {{ ageLabel }} · {{ locationLabel }}
          </div>
        </div>
      </div>
      <div class="d-flex align-center flex-wrap" style="gap:8px">
        <v-chip
          v-if="patient.allergies"
          label
          small
          dark
          color="#C0392B"
          class="font-weight-black"
        >
          <v-icon left x-small>
            mdi-alert
          </v-icon>{{ $t('clinical360.nursing.allergies') }}
        </v-chip>
        <v-chip label small :color="riskColor" dark class="font-weight-black">
          {{ riskLabel }}
        </v-chip>
        <v-btn
          tile
          depressed
          color="#003366"
          dark
          class="font-weight-black text-caption"
          :to="`/clinical/patients/${patient.id}/encounter/nurse`"
        >
          <v-icon left small>
            mdi-clipboard-pulse
          </v-icon>{{ $t('clinical360.nursing.legacy_triage') }}
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script>
export default {
  props: {
    patient: { type: Object, default: () => ({}) },
    summary: { type: Object, default: () => ({}) }
  },
  computed: {
    displayName () { return this.patient.displayName || this.patient.name || `${this.patient.firstName || ''} ${this.patient.lastName || ''}`.trim() || this.$t('clinical360.nursing.unknown_patient') },
    mrn () { return this.patient.mrn || this.patient.externalId || this.patient.id || 'MRN N/A' },
    ageLabel () {
      if (this.patient.age) { return `${this.patient.age} ans` }
      if (!this.patient.dob) { return this.$t('clinical360.nursing.age_na') }
      const age = Math.floor((Date.now() - new Date(this.patient.dob).getTime()) / 31557600000)
      return Number.isFinite(age) ? `${age} ${this.$i18n.locale === 'fr' ? 'ans' : 'years'}` : this.$t('clinical360.nursing.age_na')
    },
    locationLabel () { return this.patient.currentDepartment || (this.patient.activeInpatient && this.patient.activeInpatient.ward) || this.$t('clinical360.nursing.outpatient') },
    riskLabel () { const risk = this.patient.riskLevel || this.summary.riskLevel || 'standard'; const key = `clinical360.nursing.risk.${risk}`; return this.$te(key) ? this.$t(key) : risk.toUpperCase() },
    riskColor () { return { high: '#C0392B', medium: '#D97706', low: '#1F7A5C', standard: '#003366' }[(this.patient.riskLevel || 'standard')] || '#003366' }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing: 0.8px !important; }
</style>
