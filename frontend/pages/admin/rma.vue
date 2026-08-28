<template>
  <v-container fluid class="gov-content pa-8">
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap" style="gap:12px">
      <div>
        <div class="text-caption font-weight-black grey--text text-uppercase ls-1 mb-1">FACILITY REPORTING</div>
        <h1 class="text-h4 font-weight-black gov-text-primary uppercase mb-1">Rapport Mensuel d'Activité</h1>
        <div class="text-caption grey--text font-weight-bold">Submit this facility's monthly activity report to your regional delegation / district.</div>
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <v-card flat tile class="b-1 pa-6 shadow-sm">
          <div class="d-flex" style="gap:12px">
            <v-select v-model="reportMonth" :items="monthOptions" outlined dense label="Month"></v-select>
            <v-select v-model="reportYear" :items="yearOptions" outlined dense label="Year"></v-select>
          </div>

          <v-divider class="my-4"></v-divider>

          <v-text-field v-for="field in indicatorFields" :key="field.key" v-model.number="indicators[field.key]" type="number" outlined dense :label="field.label" class="mb-1"></v-text-field>

          <v-alert v-if="lastResult" dense text :type="lastResult.error ? 'error' : 'success'" class="mt-2">
            {{ lastResult.message }}
          </v-alert>

          <v-btn block tile depressed color="#003366" dark class="font-weight-black mt-4" :loading="submitting" @click="submit">
            <v-icon left small>mdi-send</v-icon>Submit RMA
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card flat tile class="b-1 pa-6 shadow-sm">
          <div class="text-caption font-weight-black grey--text text-uppercase ls-1 mb-3">Previously submitted</div>
          <div v-if="!reports.length" class="grey--text text-caption">No RMA submitted yet.</div>
          <div v-for="report in reports" :key="report.id" class="d-flex align-center justify-space-between py-2 border-bottom">
            <span class="font-weight-bold">{{ report.reportMonth }}/{{ report.reportYear }}</span>
            <v-chip x-small label dark :color="statusColor(report.status)" class="font-weight-black">{{ report.status }}</v-chip>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'

const INDICATOR_FIELDS = [
  { key: 'consultationsTotal', label: 'Total consultations' },
  { key: 'consultationsNew', label: 'New consultations' },
  { key: 'admissionsTotal', label: 'Admissions' },
  { key: 'deliveries', label: 'Deliveries' },
  { key: 'deathsTotal', label: 'Deaths (total)' },
  { key: 'deathsMaternal', label: 'Maternal deaths' },
  { key: 'deathsUnder5', label: 'Under-5 deaths' },
  { key: 'malariaCases', label: 'Malaria cases' },
  { key: 'tuberculosisCases', label: 'Tuberculosis cases' },
  { key: 'vaccinationsDoses', label: 'Vaccination doses given' }
]

export default {
  name: 'AdminRma',
  head: { title: 'Rapport Mensuel d\'Activité' },
  data() {
    const now = new Date()
    return {
      reportMonth: now.getMonth() + 1,
      reportYear: now.getFullYear(),
      indicators: {},
      indicatorFields: INDICATOR_FIELDS,
      monthOptions: Array.from({ length: 12 }, (_, i) => i + 1),
      yearOptions: Array.from({ length: 5 }, (_, i) => now.getFullYear() - i),
      submitting: false,
      lastResult: null
    }
  },
  computed: {
    ...mapState('reports', ['reports'])
  },
  async mounted() {
    await this.fetchReports({})
  },
  methods: {
    ...mapActions('reports', ['submitRma', 'fetchReports']),
    async submit() {
      this.submitting = true
      this.lastResult = null
      try {
        const result = await this.submitRma({
          reportMonth: this.reportMonth,
          reportYear: this.reportYear,
          indicators: this.indicators
        })
        this.lastResult = result?.queued
          ? { message: 'No connection — RMA saved and queued. It will be submitted automatically once you are back online.' }
          : { message: 'RMA submitted successfully.' }
        await this.fetchReports({})
      } catch (err) {
        this.lastResult = { error: true, message: err.response?.data?.error || err.message }
      } finally {
        this.submitting = false
      }
    },
    statusColor(status) {
      return { draft: '#94a3b8', submitted: '#d97706', validated: '#0f766e', rejected: '#be123c' }[status] || '#94a3b8'
    }
  }
}
</script>
